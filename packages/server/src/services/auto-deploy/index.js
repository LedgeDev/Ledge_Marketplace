const express = require("express");
const router = express.Router();
const { exec } = require('child_process');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

router.post('/', (req, res) => {
  const secret = process.env.STAGING_SERVER_AUTO_DEPLOY_SECRET;
  const signature = req.headers['x-hub-signature-256'];
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex');

  if (signature !== digest) {
    return res.status(401).send('Invalid signature');
  }

  if (req.body.ref === 'refs/heads/development') {
    exec('./auto-deploy.sh', (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return res.status(500).send('Deployment failed');
      }
      console.log(`stdout: ${stdout}`);
      console.error(`stderr: ${stderr}`);
      res.status(200).send('Deployment triggered');
    });
  } else {
    res.status(200).send('Ignored event');
  }
});

module.exports = {
  path: "/auto-deploy",
  router,
};
