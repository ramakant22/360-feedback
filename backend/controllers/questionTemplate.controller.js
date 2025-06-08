
const db = require("../models");
const { v4: uuidv4 } = require('uuid');
const QuestionTemplate = db.QuestionTemplate;
const FeedbackRequest = db.FeedbackRequest; // For checking if template is used

exports.create = async (req, res) => {
  try {
    const { name, description, questions } = req.body;
    if (!name || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).send({ message: "Name and a non-empty array of questions are required." });
    }
    // Ensure questions have IDs
    const processedQuestions = questions.map(q => ({ ...q, id: q.id || uuidv4() }));
    
    const template = await QuestionTemplate.create({ name, description, questions: processedQuestions });
    res.status(201).send(template);
  } catch (error) {
    res.status(500).send({ message: error.message || "Error creating QuestionTemplate." });
  }
};

exports.findAll = async (req, res) => {
  try {
    const templates = await QuestionTemplate.findAll({ order: [['name', 'ASC']] });
    res.send(templates);
  } catch (error) {
    res.status(500).send({ message: error.message || "Error retrieving QuestionTemplates." });
  }
};

exports.findOne = async (req, res) => {
  try {
    const template = await QuestionTemplate.findByPk(req.params.id);
    if (template) {
      res.send(template);
    } else {
      res.status(404).send({ message: `QuestionTemplate with id ${req.params.id} not found.` });
    }
  } catch (error) {
    res.status(500).send({ message: error.message || "Error retrieving QuestionTemplate." });
  }
};

exports.update = async (req, res) => {
  const templateId = req.params.id;
  try {
    const isUsed = await FeedbackRequest.count({ where: { templateIdOrigin: templateId } }) > 0;
    if (isUsed) {
      return res.status(400).send({ message: "This template is in use and cannot be modified." });
    }

    const { name, description, questions } = req.body;
    // Ensure questions have IDs if being updated
    const processedQuestions = questions ? questions.map(q => ({ ...q, id: q.id || uuidv4() })) : undefined;
    const updateData = { name, description };
    if (processedQuestions) updateData.questions = processedQuestions;


    const [num] = await QuestionTemplate.update(updateData, { where: { id: templateId } });
    if (num === 1) {
      const updatedTemplate = await QuestionTemplate.findByPk(templateId);
      res.send(updatedTemplate);
    } else {
      res.status(404).send({ message: `Cannot update QuestionTemplate with id=${templateId}. Not found or no change.` });
    }
  } catch (error) {
    res.status(500).send({ message: error.message || "Error updating QuestionTemplate." });
  }
};

exports.delete = async (req, res) => {
  const templateId = req.params.id;
  try {
    const isUsed = await FeedbackRequest.count({ where: { templateIdOrigin: templateId } }) > 0;
    if (isUsed) {
      return res.status(400).send({ message: "This template is in use and cannot be deleted." });
    }

    const num = await QuestionTemplate.destroy({ where: { id: templateId } });
    if (num === 1) {
      res.send({ message: "QuestionTemplate deleted successfully." });
    } else {
      res.status(404).send({ message: `Cannot delete QuestionTemplate with id=${templateId}. Not found.` });
    }
  } catch (error) {
    res.status(500).send({ message: error.message || "Error deleting QuestionTemplate." });
  }
};

exports.isUsed = async (req, res) => {
  const templateId = req.params.id;
  try {
    const count = await FeedbackRequest.count({ where: { templateIdOrigin: templateId }});
    res.send({ isUsed: count > 0 });
  } catch (error) {
    res.status(500).send({ message: error.message || "Error checking if template is used." });
  }
};