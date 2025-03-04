// Helper function to extract text from JSON fields
const extractTextFromJson = (jsonField) => {
  if (!jsonField) return '';
  try {
    if (typeof jsonField === 'string') return jsonField;
    if (Array.isArray(jsonField)) {
      return jsonField.map(item => extractTextFromJson(item)).join(' ');
    }
    if (typeof jsonField === 'object') {
      return Object.values(jsonField)
        .map(value => extractTextFromJson(value))
        .join(' ');
    }
    return String(jsonField);
  } catch (error) {
    return '';
  }
};

// Text normalization function
const normalizeText = (text) => {
  return text.toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

// Helper functions for matching
const getPluralVariants = (word) => {
  const variants = new Set([word]);
  variants.add(word + 's');
  if (word.endsWith('y')) {
    variants.add(word.slice(0, -1) + 'ies');
  }
  if (word.endsWith('s')) {
    variants.add(word.slice(0, -1));
  }
  if (word.match(/[sxz]$|[cs]h$/)) {
    variants.add(word + 'es');
  }
  return Array.from(variants);
};

const isExactMatch = (term, word) => {
  const termVariants = getPluralVariants(term.toLowerCase());
  const wordVariants = getPluralVariants(word.toLowerCase());
  return termVariants.some(termVar =>
    wordVariants.some(wordVar => termVar === wordVar)
  );
};

// Scoring helper functions
const calculateTermFrequency = (term, text) => {
  const words = text.split(' ');
  const matchCount = words.filter(word => isExactMatch(term, word)).length;
  return matchCount / words.length;
};

const calculateLevenshteinDistance = (str1, str2) => {
  const matrix = Array(str2.length + 1).fill().map(() =>
    Array(str1.length + 1).fill(0)
  );

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const substitutionCost = str1[i - 1].toLowerCase() === str2[j - 1].toLowerCase() ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + substitutionCost
      );
    }
  }

  return matrix[str2.length][str1.length];
};

const calculateSubstringScore = (term, text) => {
  const words = text.split(' ');
  let maxScore = 0;
  const termVariants = getPluralVariants(term);
  for (const word of words) {
    for (const termVar of termVariants) {
      if (word.toLowerCase().includes(termVar.toLowerCase()) ||
          termVar.toLowerCase().includes(word.toLowerCase())) {
        const matchLength = Math.min(termVar.length, word.length);
        const maxLength = Math.max(termVar.length, word.length);
        const score = matchLength / maxLength;
        maxScore = Math.max(maxScore, score);
      }
    }
  }
  return maxScore;
};

const calculateProximityScore = (text, terms) => {
  const words = text.split(' ');
  let proximityScore = 0;

  for (let i = 0; i < terms.length - 1; i++) {
    for (let j = i + 1; j < terms.length; j++) {
      const term1Indices = words.reduce((acc, word, idx) => {
        if (isExactMatch(terms[i], word)) acc.push(idx);
        return acc;
      }, []);

      const term2Indices = words.reduce((acc, word, idx) => {
        if (isExactMatch(terms[j], word)) acc.push(idx);
        return acc;
      }, []);

      if (term1Indices.length && term2Indices.length) {
        const minDistance = Math.min(
          ...term1Indices.flatMap(idx1 =>
            term2Indices.map(idx2 => Math.abs(idx1 - idx2))
          )
        );
        proximityScore += 1 / (1 + minDistance);
      }
    }
  }

  return proximityScore;
};

// GPT enhancement function
async function enhanceSearchTerms(query, entityType) {
  try {
    const prompt = `Given this search query: "${query}"
Analyze the query and follow these steps:
1. First, identify and correct any spelling mistakes in the query terms
2. Extract relevant search terms for finding matches in a ${entityType} database, dont consider the term ${entityType}
3. Consider exact or similar matches and related concepts

Return a JSON array of objects with the following structure:
{
  "exactTerms": ["term1", "term2"],
  "relatedTerms": ["term3", "term4"],
  "importance": {
    "term1": 1.0,
    "term2": 0.3,
    "term3": 0.2,
    "term4": 0.1
  }
}

Return ONLY the raw JSON without any code block markers.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini-2024-07-18",
      messages: [
        {
          role: "system",
          content: "Extract just important terms, correct spelling, and enhance search terms for precise database querying. Prioritize exact matches and semantic relevance."
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 150,
      temperature: 0.2
    });

    const enhancedTerms = JSON.parse(completion.choices[0].message.content.trim());
    return enhancedTerms;

  } catch (error) {
    const terms = normalizeText(query).split(' ').filter(term => term.length > 2);
    return {
      exactTerms: terms,
      relatedTerms: [],
      concepts: [],
      wordRoots: [],
      importance: terms.reduce((acc, term) => ({ ...acc, [term]: 1.0 }), {})
    };
  }
}

// Scoring function
const calculateScore = (entity, searchableFields, enhancedTerms) => {
  const fieldWeights = {
    name: 4.0,      // Increased from 3.0
    title: 3.5,     // Increased from 2.5
    description: 2.5,// Increased from 2.0
    content: 2.0,   // Increased from 1.5
    tags: 1.5,      // Increased from 1.2
    default: 1.0
  };

  const matchWeights = {
    exact: 5.0,     // Significantly increased weight for exact matches
    partial: 0.7,   // Reduced relative importance
    related: 0.5,   // Reduced relative importance
    concept: 0.3,   // Reduced relative importance
    root: 0.4       // Reduced relative importance
  };

  let totalScore = 0;
  let matches = {
    exact: 0,
    partial: 0,
    related: 0,
    concept: 0,
    root: 0
  };

  const contentToSearch = {};
  searchableFields.forEach(field => {
    if (entity[field]) {
      contentToSearch[field] = normalizeText(extractTextFromJson(entity[field]));
    }
  });

  // Score exact matches with enhanced weighting
  enhancedTerms.exactTerms.forEach(term => {
    const termImportance = enhancedTerms.importance[term] || 1;

    searchableFields.forEach(field => {
      if (contentToSearch[field]) {
        const fieldWeight = fieldWeights[field] || fieldWeights.default;
        const words = contentToSearch[field].split(' ');

        // Check for exact matches including plurals
        const exactMatchCount = words.filter(word => isExactMatch(term, word)).length;
        if (exactMatchCount > 0) {
          const score = (exactMatchCount / words.length) * termImportance * fieldWeight * matchWeights.exact;
          totalScore += score;
          matches.exact += exactMatchCount;
        }

        // Check for partial matches only if no exact match was found
        if (exactMatchCount === 0) {
          words.forEach(word => {
            // Calculate substring match score
            const substringScore = calculateSubstringScore(term, word);
            if (substringScore > 0.5) {
              const score = substringScore * termImportance * fieldWeight * matchWeights.partial;
              totalScore += score;
              matches.partial++;
            }

            // Calculate Levenshtein distance for similar words
            const distance = calculateLevenshteinDistance(term, word);
            const maxLength = Math.max(term.length, word.length);
            const similarity = 1 - (distance / maxLength);

            if (similarity > 0.7) {
              const score = similarity * termImportance * fieldWeight * matchWeights.partial;
              totalScore += score;
              matches.partial++;
            }
          });
        }
      }
    });
  });

  // Score related terms with reduced weight
  enhancedTerms.relatedTerms.forEach(term => {
    const termImportance = enhancedTerms.importance[term] || 0.7;
    searchableFields.forEach(field => {
      if (contentToSearch[field]) {
        const fieldWeight = fieldWeights[field] || fieldWeights.default;
        const termFreq = calculateTermFrequency(term, contentToSearch[field]);

        if (termFreq > 0) {
          const score = termFreq * termImportance * fieldWeight * matchWeights.related;
          totalScore += score;
          matches.related++;
        }
      }
    });
  });

  // Calculate proximity bonus with increased weight for exact matches
  searchableFields.forEach(field => {
    if (contentToSearch[field]) {
      const allTerms = [
        ...enhancedTerms.exactTerms,
        ...enhancedTerms.relatedTerms
      ];
      const proximityScore = calculateProximityScore(contentToSearch[field], allTerms);
      totalScore += proximityScore * (fieldWeights[field] || fieldWeights.default) * matchWeights.exact;
    }
  });

  // Normalize score
  const totalTerms = enhancedTerms.exactTerms.length + enhancedTerms.relatedTerms.length;
  const maxPossibleScore = totalTerms * Math.max(...Object.values(fieldWeights)) * matchWeights.exact;
  const normalizedScore = Math.min(1, totalScore / maxPossibleScore);

  return {
    score: normalizedScore,
    matches
  };
};

async function findRequestedEntities(searchQuery, entityName, entities) {
  try {
    if (!entities || entities.length === 0) {
      return null;
    }

    const enhancedTerms = await enhanceSearchTerms(searchQuery, entityName);
    const searchableFields = Object.keys(entities[0]).filter(key =>
      typeof entities[0][key] === 'string' ||
      typeof entities[0][key] === 'object'
    );

    const scoredEntities = entities
      .map(entity => ({
        id: entity.id,
        entity,
        ...calculateScore(entity, searchableFields, enhancedTerms)
      }))
      .sort((a, b) => b.score - a.score);

    const topMatches = scoredEntities
      .filter(entity => entity.score > 0)
      .slice(0, 3)
      .map(match => ({
        id: match.entity.id,
        model: entityName,
        confidence: match.score,
        matches: match.matches
      }));

    return topMatches.length === 0 ? [] : topMatches;
  } catch (error) {
    throw new Error('Failed to search entities: ' + error.message);
  }
}

module.exports = {
  findRequestedEntities,
};
