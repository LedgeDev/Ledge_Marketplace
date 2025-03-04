const OpenAIApi = require('openai');
const prisma = require('../../prisma.js');
const { identifyEntityFromSchema, formatMessagesForContext, formatConversationalResponse } = require('./ai.service.js');
const { findRequestedEntities } = require('./search.service.js');
const { QueryError } = require('./errors');

const openai = new OpenAIApi({ key: process.env.OPENAI_API_KEY });
const MAX_RETRIES = 3;

const ALLOWED_OPERATIONS = [
 'findMany',
 'findFirst',
 'findUnique',
 'count',
 'aggregate',
 'groupBy'
];

function isQuerySafe(query) {
 if (!query.startsWith('return await prisma.')) {
   return false;
 }
 const hasAllowedOperation = ALLOWED_OPERATIONS.some(op => query.includes(op));
 const hasForbiddenOperation = /\b(delete|update|create|upsert)\b/.test(query);
 return hasAllowedOperation && !hasForbiddenOperation;
}

async function generatePrismaQuery(schemaContent, userQuestion, retryCount = 0) {
  try {
    // Extract IDs from the question if present
    const idsMatch = userQuestion.match(/(\b[0-9a-f]{24}\b)/g);
    const hasIds = idsMatch && idsMatch.length > 0;

    const prompt = `
Analyze this Prisma schema and generate the most minimal query possible that answers the user's question:
\`\`\`prisma
${schemaContent}
\`\`\`

The user asks: "${userQuestion}"

STRICT QUERY RULES:
1. Select ONLY fields that are necessary to answer the specific question
2. Always include 'id: true' as it's required for reference
3. All selected fields must be explicit with 'true' value
4. Only use these operations: findMany, findFirst, findUnique, count, aggregate, groupBy
5. No text search operations (contains, search, startsWith, endsWith)
6. No array operations (some, every, none)
7. No nested selects - all fields must be selected with 'true' at the top level
8. For the brands model, remember that 'founders' is a Json[] field, not a relation
${hasIds ? `9. IMPORTANT: The question contains specific IDs. You MUST include a where clause with these IDs: ${idsMatch.join(', ')}` : '9. No where clauses or filters'}

Example:
${hasIds ? `
return await prisma.brands.findMany({
  where: {
    id: {
      in: [${idsMatch.map(id => `'${id}'`).join(', ')}]
    }
  },
  select: {
    id: true,
    name: true
  }
});` : `
return await prisma.brands.findMany({
  select: {
    id: true,
    name: true
  }
});`}

Return only the query code starting with 'return await prisma.' and ending with semicolon.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini-2024-07-18",
      messages: [
        {
          role: "system",
          content: "You are a Prisma expert focused on generating minimal, efficient queries that select only the fields necessary to answer the specific question. When IDs are provided, you must use them in the where clause."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0,
    });

    let query = completion.choices[0].message.content;
    query = query.match(/return await[\s\S]*?;/)?.[0] || '';
    query = query.replace(/`javascript|`prisma|```|\n/g, '').trim();

    return query;
  } catch (error) {
    console.error('Failed to generate Prisma query:', error);
    if (retryCount < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return generatePrismaQuery(schemaContent, userQuestion, retryCount + 1);
    }
    throw new QueryError("Failed to generate Prisma query", "QUERY_GENERATION_ERROR", { error });
  }
}

async function executeDataQuery(consult, schemaContent) {
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    try {
      const query = await generatePrismaQuery(schemaContent, consult, attempt);

      if (!query || !isQuerySafe(query)) {
        throw new QueryError(
          "Generated query is not valid or contains unauthorized operations",
          "INVALID_QUERY",
          { query }
        );
      }

      // Execute the original query without modifications
      const executableQuery = query.replace('return await ', '');
      let totalResults = null;

      if (executableQuery.includes('findMany')) {
        // Get total count for findMany queries
        const countQuery = executableQuery.replace(/findMany\((.*?)\)/, 'count()');
        try {
          totalResults = await eval(`(async () => { return await ${countQuery} })()`);
        } catch (error) {
          console.warn('Failed to get total count:', error);
        }
      }

      // Execute the query
      const result = await eval(`(async () => {
        try {
          return await ${executableQuery}
        } catch (error) {
          throw new QueryError("Error executing query", "EXECUTION_ERROR", {
            error: error.message,
            query: executableQuery
          });
        }
      })()`);

      return {
        data: result,
        totalResults,
        wasDataTruncated: false, // Since we're not limiting results anymore
        resultCount: Array.isArray(result) ? result.length : 1
      };

    } catch (error) {
      console.error('Database query failed:', error);
      lastError = error;

      if (attempt === MAX_RETRIES + 1) {
        throw new QueryError(
          getErrorMessage(error.type),
          error.type,
          error.details || {}
        );
      }

      // Exponential backoff before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }

  throw lastError;
}

async function generateDatabaseQuery(consult, schemaContent, retryCount = 0) {
  try {
    console.log('Generating database query', consult);

    // Extract the ids on the query using regex
    const idsMatch = consult.match(/(\b[0-9a-f]{24}\b)/g);
    const hasIds = idsMatch && idsMatch.length > 0;

    const prompt = `Given this Prisma schema:
${schemaContent}

And this database query: "${consult}"

Create a Prisma query that:
1. Identifies the specific model being queried
2. Selects only the explicitly requested fields, plus the ID field
3. If specific fields are not mentioned, select id, name/title, and other essential identifying fields
4. Always include the attributes that connect the model to other models. For example, if querying a product, include the brandId
${hasIds ? `4. IMPORTANT: The question contains specific IDs. You MUST include a where clause with these IDs: ${idsMatch.join(', ')}` : ''}

QUERY RULES:
1. Always include 'id: true' in the select clause
2. Always include a where clause with specific IDs if mentioned
2. All fields must be specified with 'true' value
3. You cant use attributes that doesnt exist in the schema
4. No nested selects or includes
5. All Json fields must be selected with just 'true'
6. Dont put comments in the query

THE FORMAT SHOULD ALWAYS BE LIKE THIS:

return await prisma.{MODEL}.findMany({
  where: {
    id: {
      in: [{ID1}, {ID2}, {MORE IDS}]
    }
  },
  select: {
    id: true,
    {ATTRIBUTE1}: true,
    {ATTRIBUTE2}: true,
    {MORE ATTRIBUTES}: true
  }
});



EXAMPLES:

Input: "Get product X (id: "123") and the product B (id: "456")"
Output:
return await prisma.products.findMany({
  where: {
    id: {
      in: ["123", "456"]
    }
  },
  select: {
    id: true,
    name: true,
    description: true,
    regularPrice: true
  }
});

Input: "Who is the founder of the brand Korosho (id: 661941550895cb71762477d4) that focuses on cashews?"
Output:
return await prisma.brands.findMany({
  where: {
    id: {
      in: ["661941550895cb71762477d4"]
    }
  },
  select: {
    id: true,
    name: true,
    description: true,
    founders: true
  }
});

Return ONLY the raw Prisma query without any code block markers or additional text.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini-2024-07-18",
      messages: [
        { role: "system", content: "You are a Prisma expert who generates precise database queries based on user requests." },
        { role: "user", content: prompt }
      ],
      max_tokens: 300,
      temperature: 0
    });

    const query = completion.choices[0].message.content.trim();

    console.log('AI response:', query);

    if (!query.includes('prisma.') || !query.includes('select: {')) {
      throw new QueryError("Invalid query structure", "QUERY_STRUCTURE_ERROR");
    }

    return query;
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return generateDatabaseQuery(consult, schemaContent, retryCount + 1);
    }
    throw new QueryError("Failed to generate database query", "QUERY_GENERATION_ERROR", { error });
  }
}

async function executeDatabaseQuery(query, retryCount = 0) {
  try {
    if (!isQuerySafe(query)) {
      throw new QueryError("Query contains unauthorized operations", "INVALID_QUERY", { query });
    }

    const executableQuery = query.replace('return await ', '');
    let totalResults = null;

    if (executableQuery.includes('findMany')) {
      const countQuery = executableQuery.replace(/findMany\((.*?)\)/, 'count()');
      try {
        totalResults = await eval(`(async () => { return await ${countQuery} })()`);
      } catch (error) {
        console.warn('Failed to get total count:', error);
      }
    }

    const result = await eval(`(async () => {
      try {
        return await ${executableQuery}
      } catch (error) {
        throw new QueryError("Error executing query", "EXECUTION_ERROR", {
          error: error.message,
          query: executableQuery
        });
      }
    })()`);

    return {
      data: result,
      totalResults,
      wasDataTruncated: false,
      resultCount: Array.isArray(result) ? result.length : 1
    };
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      return executeDatabaseQuery(query, retryCount + 1);
    }
    throw error;
  }
}

async function handleDatabaseQuery(consult, schemaContent, previousMessages = [], retryCount = 0) {
  try {

    console.log('Handling database query:', consult);

    // Generate query from user's input
    const query = await generateDatabaseQuery(consult, schemaContent);

    console.log('Query:', query);

    // Execute the query safely
    const queryResult = await executeDatabaseQuery(query);

    console.log('Query result:', queryResult);

    // Format the results into a conversational response
    const response = await formatConversationalResponse(
      consult,
      queryResult.data,
      previousMessages,
      {
        wasDataTruncated: queryResult.wasDataTruncated,
        resultCount: queryResult.resultCount,
        totalResults: queryResult.totalResults
      }
    );

    return response;
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      return handleDatabaseQuery(consult, schemaContent, previousMessages, retryCount + 1);
    }
    throw error;
  }
}

async function validateQueryResults(searchQuery, results, entityName, retryCount = 0) {
  try {
    console.log('Validating query results');

    console.log('Search query:', searchQuery);
    const prompt = `
    Given this search query: "${searchQuery}"
    And these ${entityName} results:
    ${JSON.stringify(results, null, 2)}

    Analyze if any of these results matches what the user is looking for.
    Consider:
    1. Semantic meaning of the search query
    2. Key attributes of the entities
    3. Any specific criteria mentioned in the query
    4. Fuzzy matching for names and descriptions
    5. Potential synonyms or related terms

    If no good match is found, return wasFinded as false and entity as null.
    If a match is found, return wasFinded as true and include the matching entity.

    Return a raw JSON response with exactly this format and without any code block markers:
    {
      "wasFinded": boolean,
      "entityId": string (if found) null (if not found),
      "confidence": number (0-1),
      "reasoning": string (brief explanation)
    }

    Example:

    {
      "wasFinded": true,
      "entityId": "123",
      "confidence": 0.8,
      "reasoning": "The name and email match the user query"
    }
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini-2024-07-18",
      messages: [
        {
          role: "system",
          content: "You are a precise entity matcher that analyzes search results against user queries."
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.1
    });

    const rawResponse = completion.choices[0].message.content.trim();

    console.log('AI response:', rawResponse);

    try {
      const response = JSON.parse(rawResponse);

      // Validate response format
      if (typeof response.wasFinded !== 'boolean' ||
          (response.wasFinded && !response.entityId) ||
          typeof response.confidence !== 'number' ||
          typeof response.reasoning !== 'string') {
        throw new Error('Invalid response format');
      }

      // Ensure confidence is between 0 and 1
      response.confidence = Math.max(0, Math.min(1, response.confidence));

      return response;
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new QueryError("Invalid AI response format", "VALIDATION_ERROR", { error: parseError });
    }

  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return validateQueryResults(searchQuery, results, entityName, retryCount + 1);
    }
    throw new QueryError("Failed to validate query results", "VALIDATION_ERROR", { error });
  }
}

// Helper function to get appropriate error messages
function getErrorMessage(errorType) {
  switch (errorType) {
    case "INVALID_QUERY":
      return "I'm having trouble understanding how to query that information. Could you try rephrasing your question? For example, if you're asking about dates, specify if you want to know creation dates, last login dates, etc.";
    case "EXECUTION_ERROR":
      return "I encountered an error while fetching that information. This might be because the data you're looking for doesn't exist or the way we're trying to access it isn't quite right. Could you try asking in a different way?";
    default:
      return "I apologize, but I'm having trouble processing that request at the moment. Could you try asking in a simpler way or break your question into smaller parts?";
  }
}

async function handleSearchQuery(searchQuery, schemaContent, retryCount = 0) {
  try {
    // Get base query for entity
    const {
      query,
      entityName
    } = await identifyEntityFromSchema(searchQuery, schemaContent);

    console.log('Query:', query);

    // Execute query to get all potential matches and stringify the result
    const allEntities = await eval(`(async () => { ${query}; })()`);

    // Pass to second AI for finding specific instance
    const matches = await findRequestedEntities(searchQuery, entityName, allEntities);

    if (!matches || matches.length === 0) {
      return {
        type: 'search',
        message: 'No matching entities found'
      };
    }

    // Extract model (should be the same for all matches) and ids
    const { model } = matches[0];
    const ids = matches.map(match => match.id);

    // Build query with all matched ids
    const buildedSearchQuery = searchQuery + `
      One of the following 3 entities ${model} with the IDs ${ids.join(', ')} must
      have the searched entity. Give me information of this elements that
      would help me corroborate that one of these 3 elements
      corresponds to my search.`;


    // Handle found entities like a database query, using executeDataQuery
    const queryResult = await executeDataQuery(buildedSearchQuery, schemaContent);

    // Use the ai service to check if one of the entities is the one the user is looking for in the search query
    // If the entity is found, return the entity and wasFinded = true
    // If the entity is not found, return entity = null and wasFinded = false
    const { wasFinded, entityId } = await validateQueryResults(searchQuery, queryResult, entityName);

    console.log('Entity found:', wasFinded, entityId);

    if (wasFinded) {

      // Get the entity object from the queryResult data
      const entityFinded = queryResult.data.find(e => e.id === entityId);

      return await formatConversationalResponse(
        searchQuery,
        entityFinded
      );
    }

    return {
      type: 'search',
      message: 'I found some potential matches, but none of them seem to match what you are looking for :(. Could you provide more details or try rephrasing your query?'
    };

  } catch (error) {
    console.error('Search query failed:', error);
    if (retryCount < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return handleSearchQuery(searchQuery, schemaContent, retryCount + 1);
    }
    throw new QueryError("Search query failed", "SEARCH_ERROR", { error });
  }
}

// async function handleAnalyticsQuery(searchQuery, schemaContent, retryCount = 0) {
//   try {
//     // Get the type of process that we need
//     const processType = await selectOptimalProcess(searchQuery, schemaContent);

//     switch (processType) {
//       case 'TOO_COMPLEX':
//         return {
//           type: 'analytics',
//           message: "I apologize, but this analysis is too complex for me to process accurately. It requires extensive data processing or calculations that I'm not able to perform reliably. Could you try breaking down your question into simpler parts?"
//         };

//       case 'SEARCH_FIRST':
//         // First find the entity, then perform analytics
//         const searchResult = await handleEntitySearch(searchQuery, schemaContent);
//         if (!searchResult.success) {
//           return {
//             type: 'analytics',
//             message: "I couldn't find the specific entity you're asking about. Could you provide more details or try rephrasing your query?"
//           };
//         }
//         return await processAnalyticsWithEntity(searchResult.entity, searchQuery, schemaContent);

//       case 'ANSWERS_ANALYSIS':
//         // Process user answers for a specific brand
//         return await analyzeUserAnswers(searchQuery, schemaContent);

//       case 'SIMPLE_QUERY':
//         // Handle simple statistical queries
//         const queryResult = await executeDataQuery(searchQuery, schemaContent);
//         return await formatConversationalResponse(
//           searchQuery,
//           queryResult.data,
//           [],
//           {
//             wasDataTruncated: queryResult.wasDataTruncated,
//             resultCount: queryResult.resultCount,
//             totalResults: queryResult.totalResults
//           }
//         );

//       default:
//         throw new QueryError(
//           "Invalid process type returned",
//           "PROCESS_TYPE_ERROR",
//           { processType }
//         );
//     }

//   } catch (error) {
//     console.error('Analytics query failed:', error);
//     if (retryCount < MAX_RETRIES) {
//       await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
//       return handleAnalyticsQuery(searchQuery, schemaContent, retryCount + 1);
//     }
//     throw new QueryError(
//       "Analytics query failed",
//       "ANALYTICS_ERROR",
//       { error: error.message || error }
//     );
//   }
// }

// Export functions and utilities
module.exports = {
 handleDatabaseQuery,
 handleSearchQuery,
 isQuerySafe,
 ALLOWED_OPERATIONS
};
