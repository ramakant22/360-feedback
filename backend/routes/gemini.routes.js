
module.exports = app => {
  const geminiController = require("../controllers/gemini.controller.js");
  var router = require("express").Router();

  // POST to trigger AI summary for a specific feedback request
  router.post("/feedback-requests/:requestId/summarize", geminiController.generateAiSummary);

  app.use('/api', router); // Base path /api, full path will be /api/feedback-requests/:requestId/summarize
};