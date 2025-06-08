
const db = require("../models");
const FeedbackCycle = db.FeedbackCycle;

exports.create = async (req, res) => {
  try {
    if (!req.body.name || !req.body.startDate || !req.body.endDate) {
      return res.status(400).send({ message: "Name, startDate, and endDate are required!" });
    }
    if (new Date(req.body.startDate) >= new Date(req.body.endDate)) {
        return res.status(400).send({ message: "Start date must be before end date." });
    }
    const cycle = await FeedbackCycle.create(req.body);
    res.status(201).send(cycle);
  } catch (error) {
    res.status(500).send({ message: error.message || "Error creating FeedbackCycle." });
  }
};

exports.findAll = async (req, res) => {
  try {
    const cycles = await FeedbackCycle.findAll({ order: [['startDate', 'DESC']] });
    res.send(cycles);
  } catch (error) {
    res.status(500).send({ message: error.message || "Error retrieving FeedbackCycles." });
  }
};

exports.findOne = async (req, res) => {
  try {
    const cycle = await FeedbackCycle.findByPk(req.params.id);
    if (cycle) {
      res.send(cycle);
    } else {
      res.status(404).send({ message: `FeedbackCycle with id ${req.params.id} not found.` });
    }
  } catch (error) {
    res.status(500).send({ message: error.message || "Error retrieving FeedbackCycle." });
  }
};

exports.update = async (req, res) => {
  try {
    if (req.body.startDate && req.body.endDate && new Date(req.body.startDate) >= new Date(req.body.endDate)) {
        return res.status(400).send({ message: "Start date must be before end date." });
    }
    const [num] = await FeedbackCycle.update(req.body, { where: { id: req.params.id } });
    if (num === 1) {
      const updatedCycle = await FeedbackCycle.findByPk(req.params.id);
      res.send(updatedCycle);
    } else {
      res.status(404).send({ message: `Cannot update FeedbackCycle with id=${req.params.id}. Not found or no change.` });
    }
  } catch (error) {
    res.status(500).send({ message: error.message || "Error updating FeedbackCycle." });
  }
};

exports.delete = async (req, res) => {
  try {
    // Optional: Check if cycle is used in any feedback requests before deleting
    // const requestCount = await db.FeedbackRequest.count({ where: { cycleId: req.params.id }});
    // if (requestCount > 0) {
    //   return res.status(400).send({ message: `Cannot delete cycle. It is associated with ${requestCount} feedback requests.`});
    // }
    const num = await FeedbackCycle.destroy({ where: { id: req.params.id } });
    if (num === 1) {
      res.send({ message: "FeedbackCycle deleted successfully." });
    } else {
      res.status(404).send({ message: `Cannot delete FeedbackCycle with id=${req.params.id}. Not found.` });
    }
  } catch (error) {
    res.status(500).send({ message: error.message || "Error deleting FeedbackCycle." });
  }
};