
module.exports = app => {
  const questionTemplates = require("../controllers/questionTemplate.controller.js");
  var router = require("express").Router();

  router.post("/", questionTemplates.create);
  router.get("/", questionTemplates.findAll);
  router.get("/:id", questionTemplates.findOne);
  router.put("/:id", questionTemplates.update);
  router.delete("/:id", questionTemplates.delete);
  router.get("/:id/is-used", questionTemplates.isUsed);

  app.use('/api/question-templates', router);
};