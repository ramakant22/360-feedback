
module.exports = app => {
  const feedbackRequests = require("../controllers/feedbackRequest.controller.js");
  var router = require("express").Router();

  // Route for creating multiple requests (e.g., when one subject has multiple reviewers)
  router.post("/", feedbackRequests.createMultiple); 
  router.get("/", feedbackRequests.findAll);
  router.get("/:id", feedbackRequests.findOne);
  router.put("/:id/submit", feedbackRequests.submitResponse); // Specific route for submitting response

  app.use('/api/feedback-requests', router);
};