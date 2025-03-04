const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const { authenticate } = require('../../authentication');
const { QueryError } = require('./errors');
const { identifyQueryIntent, generateConversationalResponse, enhanceQueryWithPreviousMessages } = require('./ai.service');
const { handleDatabaseQuery, handleSearchQuery, handleAnalyticsQuery } = require('./database.service');

// Authentication middleware
router.use(authenticate);

// Main route handler
router.post('/', async (req, res) => {

  console.log('Request received');
  if (req.user?.isAdmin !== 'true') {
    res.status(403).send('User is not an admin');
    return;
  }

  const { consult, previousMessages = [] } = req.body;

  if (!consult) {
    return res.status(400).json({ error: 'No consult provided' });
  }

  try {

    // First, we modify the query to identify what the user wants related to previous messages
    const enhancedQuery = await enhanceQueryWithPreviousMessages(consult, previousMessages);

    const intent = await identifyQueryIntent(enhancedQuery);

    let result;

    switch (intent) {
      case 'CONVERSATION':
        result = await generateConversationalResponse(enhancedQuery);
        break;

      case 'SEARCH_QUERY': {
        const schemaPath = path.resolve(__dirname, '../../../prisma/schema.prisma');
        const schemaContent = await fs.readFile(schemaPath, 'utf-8');
        result = await handleSearchQuery(enhancedQuery, schemaContent);
        break;
      }

      case 'DATABASE_QUERY': {
        const schemaPath = path.resolve(__dirname, '../../../prisma/schema.prisma');
        const schemaContent = await fs.readFile(schemaPath, 'utf-8');
        result = await handleDatabaseQuery(enhancedQuery, schemaContent);
        break;
      }

      default:
        throw new QueryError("Invalid query intent", "INTENT_ERROR");
    }

    res.json(result);
  } catch (error) {
    let errorResponse;
    try {
      errorResponse = await generateConversationalResponse(
        "Error handling: " + error.message
      );
    } catch {
      errorResponse = "I encountered an unexpected error. Please try again or rephrase your request.";
    }

    return res.status(error.status || 500).json({
      type: 'error',
      error: 'Request processing failed',
      message: errorResponse,
      details: error.details || {}
    });
  }
});

module.exports = {
  path: '/ai-chat',
  router,
};
