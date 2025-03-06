const express = require('express');
const app = express();

// Increase payload size limit globally - MUST BE BEFORE ROUTES
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ... rest of your code ... 