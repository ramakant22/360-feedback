
const db = require("../models");
const FeedbackRequest = db.FeedbackRequest;
const User = db.User;
const QuestionTemplate = db.QuestionTemplate;
const FeedbackCycle = db.FeedbackCycle;

// Create and Save new FeedbackRequests
exports.createMultiple = async (req, res) => {
  const { subjectUserId, reviewerIds, isAnonymous, cycleId, questions, templateIdOrigin, createdById } = req.body;

  if (!subjectUserId || !reviewerIds || !Array.isArray(reviewerIds) || reviewerIds.length === 0 || 
      typeof isAnonymous !== 'boolean' || !cycleId || !questions || !Array.isArray(questions) || 
      questions.length === 0 || !templateIdOrigin || !createdById) {
    return res.status(400).send({ message: "Missing required fields for creating feedback requests." });
  }

  try {
    // Validate existence of related entities
    const subjectUser = await User.findByPk(subjectUserId);
    if (!subjectUser) return res.status(404).send({ message: `Subject user with id ${subjectUserId} not found.` });
    
    const creatorUser = await User.findByPk(createdById);
    if (!creatorUser) return res.status(404).send({ message: `Creator user with id ${createdById} not found.` });

    const cycle = await FeedbackCycle.findByPk(cycleId);
    if (!cycle) return res.status(404).send({ message: `Feedback cycle with id ${cycleId} not found.` });

    const template = await QuestionTemplate.findByPk(templateIdOrigin);
    if (!template) return res.status(404).send({ message: `Question template with id ${templateIdOrigin} not found.` });

    const createdRequests = [];
    for (const reviewerId of reviewerIds) {
      if (reviewerId === subjectUserId) {
          console.warn(`Skipping request creation: Reviewer ${reviewerId} is the same as Subject ${subjectUserId}`);
          continue; // Skip if reviewer is the same as subject
      }
      const reviewer = await User.findByPk(reviewerId);
      if (!reviewer) {
          console.warn(`Reviewer with id ${reviewerId} not found. Skipping this request.`);
          continue; // Skip if reviewer not found
      }

      const requestData = {
        subjectUserId,
        reviewerId,
        status: 'pending',
        questions, // Already validated to be non-empty array
        dateRequested: new Date(),
        isAnonymous,
        cycleId,
        createdById,
        templateIdOrigin
      };
      const newRequest = await FeedbackRequest.create(requestData);
      createdRequests.push(newRequest);
    }
    
    res.status(201).send(createdRequests);
  } catch (error) {
    res.status(500).send({ message: error.message || "Error creating FeedbackRequests." });
  }
};

// Retrieve all FeedbackRequests
exports.findAll = async (req, res) => {
  try {
    // Include associated data for easier use on frontend, though frontend already has users/cycles/templates
    const requests = await FeedbackRequest.findAll({
      // include: [
      //   { model: User, as: "SubjectUser", attributes: ['id', 'name'] },
      //   { model: User, as: "Reviewer", attributes: ['id', 'name'] },
      //   // Add other includes if needed (Cycle, Template)
      // ],
      order: [['dateRequested', 'DESC']]
    });
    res.send(requests);
  } catch (error) {
    res.status(500).send({ message: error.message || "Error retrieving FeedbackRequests." });
  }
};

// Find a single FeedbackRequest with an id
exports.findOne = async (req, res) => {
  try {
    const request = await FeedbackRequest.findByPk(req.params.id);
    if (request) {
      res.send(request);
    } else {
      res.status(404).send({ message: `FeedbackRequest with id ${req.params.id} not found.` });
    }
  } catch (error) {
    res.status(500).send({ message: error.message || "Error retrieving FeedbackRequest." });
  }
};

// Submit feedback response for a request
exports.submitResponse = async (req, res) => {
  const requestId = req.params.id;
  const { responses } = req.body; // Expects an array of FeedbackResponseAnswer

  if (!responses || !Array.isArray(responses)) {
    return res.status(400).send({ message: "Responses array is required." });
  }

  try {
    const request = await FeedbackRequest.findByPk(requestId);
    if (!request) {
      return res.status(404).send({ message: `FeedbackRequest with id ${requestId} not found.` });
    }
    if (request.status === 'completed') {
      return res.status(400).send({ message: "Feedback has already been submitted for this request." });
    }

    // Optional: Validate that cycle is active
    if (request.cycleId) {
        const cycle = await FeedbackCycle.findByPk(request.cycleId);
        if (cycle) {
            const now = new Date();
            const startDate = new Date(cycle.startDate + "T00:00:00Z"); // Ensure UTC for comparison
            const endDate = new Date(cycle.endDate + "T23:59:59Z"); // Ensure UTC for comparison
            if (!(startDate <= now && endDate >= now)) {
                 return res.status(400).send({ message: `The feedback cycle "${cycle.name}" is not currently active.` });
            }
        }
    }


    const [num] = await FeedbackRequest.update(
      { responses: responses, status: 'completed', dateCompleted: new Date() },
      { where: { id: requestId } }
    );

    if (num === 1) {
      const updatedRequest = await FeedbackRequest.findByPk(requestId);
      res.send(updatedRequest);
    } else {
      res.status(404).send({ message: `Cannot update FeedbackRequest with id=${requestId}. Not found or no change.` });
    }
  } catch (error) {
    res.status(500).send({ message: error.message || "Error submitting feedback response." });
  }
};

// Placeholder for delete if needed, usually feedback isn't hard deleted.
// exports.delete = (req, res) => { ... };