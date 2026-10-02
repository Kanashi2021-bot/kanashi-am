const express = require('express');
const serverless = require('serverless-http');
const app = express();

app.use(express.json());

app.get('/.netlify/functions/api', (req, res) => {
  res.json({
    status: 'success',
    message: 'API KanashiAm Berhasil Online di Netlify!'
  });
});

module.exports.handler = serverless(app);
