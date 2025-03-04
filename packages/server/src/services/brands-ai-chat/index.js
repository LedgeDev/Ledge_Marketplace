const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const { authenticate } = require('../../authentication');
const { QueryError } = require('./errors');
const { identifyQueryIntent, generateConversationalResponse, enhanceQueryWithPreviousMessages } = require('./ai.service');
const { handleDatabaseQuery, handleSearchQuery, handleAnalyticsQuery } = require('./database.service');
const { handleIntent } = require('./brands.service.js');

// Authentication middleware
router.use(authenticate);

// Main route handler
router.post('/', async (req, res) => {

  console.log('Request received');
  if (req.user?.isAdmin !== 'true') {
    res.status(403).send('User is not an admin');
    return;
  }

  const { consult, previousMessages = [], brandId } = req.body;

  if (!consult) {
    return res.status(400).json({ error: 'No consult provided' });
  }

  try {

    // First, we modify the query to identify what the user wants related to previous messages
    const enhancedQuery = await enhanceQueryWithPreviousMessages(consult, previousMessages, brandId);

    // Identify the intent of the query
    const intent = await identifyQueryIntent(enhancedQuery);

    console.log("Intent", intent);

    const result = await handleIntent(intent, enhancedQuery, brandId);

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
  path: '/brands-ai-chat',
  router,
};
