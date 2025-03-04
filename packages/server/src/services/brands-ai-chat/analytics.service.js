async function selectOptimalProcess(searchQuery, schemaContent, retryCount = 0) {
  try {
    const prompt = `Given this Prisma schema:
${schemaContent}

And this analytics query: "${searchQuery}"

Determine if this query is:

1. TOO_COMPLEX: Query is too complex to be processed or requires unavailable data
Examples:
- "Calculate the predicted brand success rate based on historical user behavior"
- "Find correlations between user demographics and brand preferences across all categories"
- "Generate a machine learning model for user engagement patterns"

2. SEARCH_FIRST: Need to find entity IDs before creating the actual query
Examples:
- "What's the average rating for the brand Nike?"
- "Show me all answers from users who interacted with Adidas"
- "Analyze user feedback for the brand with the founder called 'Elon Musk'"
- "Get statistics for sports category brands"

3. ANSWERS_ANALYSIS: Analyzing user answers/feedback for a specific brand (when brand ID is known)
Examples:
- "Analyze user answers for brand with ID 123456"
- "Show answer patterns for brand ID 789012"
- "Get feedback statistics for brand ID 345678"
- "Calculate response distribution for questionnaire of brand ID 901234"

4. SIMPLE_QUERY: Can be answered with a single Prisma query
Examples:
- "Count total number of brands with video pitches"
- "Get average rating for brand ID 123456"
- "How many users are in each level"
- "Total number of deal codes used"

Return ONLY one of these exact strings: "TOO_COMPLEX", "SEARCH_FIRST", "ANSWERS_ANALYSIS", or "SIMPLE_QUERY"`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini-2024-07-18",
      messages: [
        {
          role: "system",
          content: "You are an analytics expert who determines query complexity. Only respond with the exact type string."
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 20,
      temperature: 0
    });

    const processType = completion.choices[0].message.content.trim();

    if (!['TOO_COMPLEX', 'SEARCH_FIRST', 'ANSWERS_ANALYSIS', 'SIMPLE_QUERY'].includes(processType)) {
      throw new Error('Invalid process type returned');
    }

    return processType;

  } catch (error) {
    console.error('Process selection failed:', error);
    if (retryCount < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return selectOptimalProcess(searchQuery, schemaContent, retryCount + 1);
    }
    throw new QueryError(
      "Failed to select optimal process",
      "PROCESS_SELECTION_ERROR",
      { error: error.message || error }
    );
  }
}
