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

Determine if the user is asking about one of these questions, it doesnt need to be an exact match, just similar or talking about the same topic:

1. AGE_DISTRIBUTION
"What's the age distribution of the people that have a deal of my brand?" - "How old are the users that rated me?" - "Tell me about the age of users who have my brand"

2. RATING_ANSWERS_ANALYSIS
"Give me the ratings given to my brand for each age group" - "Show me the ratings given to my brand from of my users" - "Give me the rating given from my users over 60 years" - "Give me the overall rating for my brand" - "Give me the rating of my brand "

3. BRAND_COLLABORATION_OPPORTUNITIES
"Show me brands that are similar to mine" - "Show me brands that i could colaborate with" - "Find brands that my users will probably also interact with" - "Give me similar brands"

4. ANSWERS_ANALYSIS
"Give me the answers of the questions related to X" - "What did my users answered for the question X?" - "What did my users answered for the question that says something like Y?" - "What did my users answered for the questions that says something like Y?" - "Show me the answers of the question X" - "Analize the answers of the question X"

5. BRAND_PERFORMANCE
"How much is my brand being showed in the app?" - "Show me how my brand is performing" - "What's the performance of my brand?"

6. NOT_AVAILABLE
If the user query doesn't match any of the specific questions, return NOT_AVAILABLE

Return EXACTLY ONE of these strings: AGE_DISTRIBUTION, RATING_ANSWERS_ANALYSIS, BRAND_COLLABORATION_OPPORTUNITIES, BRAND_PERFORMANCE, ANSWERS_ANALYSIS or NOT_AVAILABLE if the user query doesn't match any of the specific questions.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini-2024-07-18",
      messages: [
        {
          role: "system",
          content: "You are a precise question matcher that identifies if a user query matches one of eight specific question types, considering variations in phrasing but maintaining the core intent."
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 20,
      temperature: 0
    });

    const intent = completion.choices[0].message.content.trim();

    console.log("Identified intent:", intent);

    const validIntents = [
      "AGE_DISTRIBUTION",
      "RATING_ANSWERS_ANALYSIS",
      "BRAND_COLLABORATION_OPPORTUNITIES",
      "BRAND_PERFORMANCE",
      "ANSWERS_ANALYSIS",
      "NOT_AVAILABLE"
    ];

    if (!validIntents.includes(intent)) {
      console.error(`Invalid intent returned: "${intent}". Valid intents are: ${validIntents.join(', ')}`);
      throw new Error('Invalid intent type returned');
    }

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
    const prompt = `
      Given this conversation history:
      ${messageHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

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

    return completion.choices[0].message.content.trim();
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

async function identifyEntityFromSchema(searchQuery, schemaContent, brandId, retryCount = 0) {
  try {

    const prompt = `Given this Prisma schema:
${schemaContent}

And this search query: "${searchQuery}"

Analyze the query and schema to:
1. Identify which model is being searched
2. Determine the minimal fields needed to answer the search query, including identification fields
3. Generate a minimal Prisma query
4. We cannot give away information about other brands, only the brand with ID ${brandId}

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
async function enhanceQueryWithPreviousMessages(consult, previousMessages = [], brandId) {
  try {
    const messageHistory = formatMessagesForContext(previousMessages);


    // If no previous messages, try to make the current query as clear as possible
    if (!messageHistory.length) {
      const prompt = `Given this raw user question: "${consult}" and considering that he is talking about the brand with ID ${brandId}.
Rewrite it as a clear, specific database query request.

Examples:
Raw: "what about the brand?"
Clear: "Find information about the brand with id ${brandId}"

Raw: "Give me the products"
Clear: "Show products from the brand with id ${brandId}"

Raw: "when was it created"
Clear: "Find the creation date of the brand with id ${brandId}"

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

and considering that he is talking about the brand with ID ${brandId}.
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
