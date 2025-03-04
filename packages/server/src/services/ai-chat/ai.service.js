const OpenAIApi = require('openai');
const { QueryError } = require('./errors');
const openai = new OpenAIApi({ key: process.env.OPENAI_API_KEY });
const MAX_RETRIES = 3;

function formatMessagesForContext(messages) {
  console.log("Messages", messages);
  return messages.map(msg => ({
    role: msg.isUser ? "user" : "assistant",
    content: typeof msg.content === 'string' ? msg.content : msg.content.message || ''
  }));
}

async function identifyQueryIntent(userInput, retryCount = 0) {
  try {
    const prompt = `Given this user input: "${userInput}"

Determine if this is:
1. SEARCH_QUERY: Questions asking to find or locate entities matching descriptions, keywords, or criteria
   Examples:
   - "Find brands selling toys"
   - "Is there a brand related to cashews?"
   - "Show me products with discounts"
   - "Any benefits about travel?"
   - "List all products created this month"

2. DATABASE_QUERY: Specific queries that reference exact models, fields, or IDs
   Examples:
   - "Get product with ID 123"
   - "Find order #A456B89"
   - "Show me user with ID CUS789's details"
   - "Get the price and name fields from product 456"
   - "Find all orders from user ID 234"
   - "Show transactions with ID TRX123, TRX456, and TRX789"

3. ANALYTICS_QUERY: Questions asking for statistical analysis, trends, patterns, or aggregated data
   Examples:
   - "What's the average rating for brand ABC?"
   - "How many users answered the questionnaire for brand XYZ?"
   - "Show me the distribution of answers for brand 123's questions"
   - "What percentage of users rate sports brands above 4 stars?"
   - "What's the most common answer to question 5 for brand DEF?"
   - "Compare the feedback between premium and regular brands"
   - "Calculate the average time users spend on brand profiles"
   - "What's the user satisfaction trend for eco-friendly brands?"

4. CONVERSATION: General chat, greetings, or non-data questions
   Examples:
   - "Hello"
   - "Thanks for the help"
   - "Can you explain how this works?"

Respond with exactly one of: SEARCH_QUERY, DATABASE_QUERY, ANALYTICS_QUERY or CONVERSATION`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini-2024-07-18",
      messages: [
        {
          role: "system",
          content: "Classify user queries accurately, focusing especially on distinguishing between simple database queries and analytical requests."
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 20,
      temperature: 0
    });

    const intent = completion.choices[0].message.content.trim();

    if (!['SEARCH_QUERY', 'DATABASE_QUERY', 'ANALYTICS_QUERY', 'CONVERSATION'].includes(intent)) {
      throw new Error('Invalid intent type returned');
    }

    console.log("Identified intent:", intent);
    return intent;
  } catch (error) {
    console.error('Intent identification failed:', error);
    if (retryCount < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return identifyQueryIntent(userInput, retryCount + 1);
    }
    throw new QueryError("Failed to identify query intent", "INTENT_ERROR", { error });
  }
}

async function generateConversationalResponse(userInput, retryCount = 0) {
  try {

    console.log("Generating conversational response for:", userInput);

    const prompt = `
      The user's latest message: "${userInput}"

      Provide a friendly, natural conversation response that:
      1. Maintains context from the previous messages
      2. Maintains a helpful and professional tone
      3. Is appropriate for a business context
      4. Is concise but engaging
      5. References previous parts of the conversation when relevant
      6. If you're responding to an error, explain what might have gone wrong and suggest alternatives

      Don't mention being an AI or assistant. Simply provide a natural response.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini-2024-07-18",
      messages: [
        {
          role: "system",
          content: "You are a friendly professional who provides natural, conversational responses."
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content.trim();

    console.log("Conversational response:", response);

    return response
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return generateConversationalResponse(userInput, retryCount + 1);
    }
    throw new QueryError("Failed to generate conversational response", "CONVERSATION_ERROR", { error });
  }
}

async function formatConversationalResponse(userQuestion, data, previousMessages = [], options = {}, retryCount = 0) {
  try {
    const messageHistory = formatMessagesForContext(previousMessages);

    const prompt = `
      Given this conversation history:
      ${messageHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

      The user asked: "${userQuestion}"

      The data obtained is:
      ${JSON.stringify(data, null, 2)}

      Additional context:
      ${options.wasDataTruncated ? '- The response was truncated for length' : ''}
      ${options.resultCount ? `- Showing ${options.resultCount} results` : ''}
      ${options.totalResults ? `- Total available results: ${options.totalResults}` : ''}

      Provide a conversational response that:
      1. Maintains context from the previous messages
      2. References relevant information from previous messages if applicable
      3. Is concise but informative
      4. If the data was truncated or limited, mention this naturally in the response
      5. ALWAYS add the ID in parentheses immediately after mentioning any entity
         Examples:
         - "The brand Nike (id: 123) specializes in..."
         - "Found three products: Running Shoes (id: 456), Sports Shirt (id: 789), and Shorts (id: 101)"
         - "According to the data, John Smith (id: 202) founded..."

      Don't mention being an assistant or AI. Simply provide the conversational response.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini-2024-07-18",
      messages: [
        {
          role: "system",
          content: "You are a friendly analyst who provides conversational and natural responses."
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content.trim();

    return response;
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return formatConversationalResponse(userQuestion, data, previousMessages, options, retryCount + 1);
    }
    throw new QueryError("Failed to format response", "FORMATTING_ERROR", { error });
  }
}

async function identifyEntityFromSchema(searchQuery, schemaContent, retryCount = 0) {
  try {

    const prompt = `Given this Prisma schema:
${schemaContent}

And this search query: "${searchQuery}"

Analyze the query and schema to:
1. Identify which model is being searched
2. Determine the minimal fields needed to answer the search query, including identification fields
3. Generate a minimal Prisma query

STRICT QUERY RULES:
1. Select fields that are necessary to answer the specific search query
2. Always include 'id: true' as it's required for reference
3. When searching for information about a specific entity, ALWAYS include the name/title field
4. All selected fields must be specified with 'true' value
5. Only use fields that exist in the schema
6. No nested selects or includes - all fields must be selected with 'true' at the top level
7. All Json fields must be selected with just 'true', never with nested selects
8. Return ONLY a simple findMany query without where clauses

Example search: "Give me the founders of the brand Korosho?"
Example minimal query:
return await prisma.brands.findMany({
  select: {
    id: true,
    name: true,
    founders: true
  }
});

Example search: "Who founded these brands?"
Example minimal query:
return await prisma.brands.findMany({
  select: {
    id: true,
    name: true,
    founders: true
  }
});

Example search: "What are the brand descriptions?"
Example minimal query:
return await prisma.brands.findMany({
  select: {
    id: true,
    name: true,
    description: true
  }
});

IMPORTANT:
- When the query asks about a specific entity (by name), ALWAYS include the name field
- When returning lists of items, include identifying fields (name/title) to make the results meaningful
- DO NOT select fields that aren't needed to answer the search query

Return ONLY the raw query without any code block markers.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini-2024-07-18",
      messages: [
        {
          role: "system",
          content: "You are a Prisma expert who generates minimal, efficient queries that select only the fields necessary to answer the specific question. Always prioritize data efficiency and minimal field selection."
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 300,
      temperature: 0
    });

    const query = completion.choices[0].message.content.trim();

    // Extract entity name from the query
    const entityMatch = query.match(/prisma\.(\w+)\.findMany/);
    const entityName = entityMatch ? entityMatch[1] : null;

    // Validate that the query contains minimal fields
    const selectMatch = query.match(/select:\s*{([^}]+)}/);
    if (selectMatch) {
      const selectedFields = selectMatch[1].match(/\w+:\s*true/g) || [];
      if (selectedFields.length > 5) {
        console.warn('Warning: Query might be selecting more fields than necessary');
      }
    }

    return {
      query,
      entityName
    };
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return identifyEntityFromSchema(searchQuery, schemaContent, retryCount + 1);
    }
    throw error;
  }
}

// Write a function that receives a list of messages and a ai chat message.
// The function should return a propmt that clearly explains what the user wants to know.
async function enhanceQueryWithPreviousMessages(consult, previousMessages = []) {
  try {
    const messageHistory = formatMessagesForContext(previousMessages);

    console.log("Message history", messageHistory);

    // If no previous messages, try to make the current query as clear as possible
    if (!messageHistory.length) {
      const prompt = `Given this raw user question: "${consult}"
Rewrite it as a clear, specific database query request.

Examples:
Raw: "what about nike?"
Clear: "Find information about the brand Nike"

Raw: "show me sports brands"
Clear: "Find all brands related to sports"

Raw: "when was it created"
Clear: "Find the creation date of brands"

Return only the rewritten query without any additional text.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini-2024-07-18",
        messages: [
          {
            role: "system",
            content: "You are an expert at converting user questions into clear, specific queries."
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 100,
        temperature: 0
      });

      return completion.choices[0].message.content.trim();
    }

    // If there are previous messages, analyze context and create a comprehensive query
    const prompt = `Given this conversation history:
${messageHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

And this new question: "${consult}"

Create a single, clear query that:
1. Incorporates relevant context from previous messages, put just the ids in parentheses if present, if not, use the most relevant information available
2. Makes implicit references explicit (e.g., "it", "that brand", "those products" should be replaced with actual ids)
3. Combines the context with the new request

Examples:
History: "user: Tell me about Nike" followed by "assistant: Nike (id: "123") is a popular brand" followed by "user: Show me products from Nike"
Clear query: "Find products from the brand of id 123"

History: "user: Show sports brands" followed by "assistant: Nike (id: "123"), Adidas (id: "456"), and Puma (id: "789") are sports brands" followed by "user: Tell me more about those brands"
Clear query: "Find more information about brands with ids 123, 456, and 789"

Return only the rewritten query without any additional text.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini-2024-07-18",
      messages: [
        {
          role: "system",
          content: "You are an expert at analyzing conversation context and creating clear, specific queries."
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 150,
      temperature: 0
    });

    const result = completion.choices[0].message.content.trim();

    console.log("Enhanced query:", result);

    return result;
  } catch (error) {
    // If there's an error in enhancement, return the original query
    console.error('Error enhancing query:', error);
    return consult;
  }
}

module.exports = {
 identifyQueryIntent,
 generateConversationalResponse,
 formatConversationalResponse,
 identifyEntityFromSchema,
 formatMessagesForContext,
 enhanceQueryWithPreviousMessages
};
