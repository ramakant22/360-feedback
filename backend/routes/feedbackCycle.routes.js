
module.exports = app => {
  const feedbackCycles = require("../controllers/feedbackCycle.controller.js");
  var router = require("express").Router();

  router.post("/", feedbackCycles.create);
  router.get("/", feedbackCycles.findAll);
  router.get("/:id", feedbackCycles.findOne);
  router.put("/:id", feedbackCycles.update);
  router.delete("/:id", feedbackCycles.delete);

  app.use('/api/feedback-cycles', router);
};