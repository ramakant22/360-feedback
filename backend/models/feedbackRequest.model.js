
const { DataTypes, UUIDV4 } = require('sequelize');

module.exports = (sequelize) => {
  const FeedbackRequest = sequelize.define("feedback_request", {
    id: {
      type: DataTypes.UUID,
      defaultValue: UUIDV4,
      primaryKey: true
    },
    // subjectUserId, reviewerId, cycleId, createdById, templateIdOrigin are defined by associations
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'declined'),
      allowNull: false
    },
    questions: { // Copy of questions from template at time of request
      type: DataTypes.JSON,
      allowNull: false
    },
    responses: { // Array of FeedbackResponseAnswer
      type: DataTypes.JSON
    },
    dateRequested: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    dateCompleted: {
      type: DataTypes.DATE
    },
    isAnonymous: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    aiSummary: {
      type: DataTypes.TEXT
    },
    aiSummaryError: {
      type: DataTypes.STRING(1024) // VARCHAR(1024)
    }
  });
  return FeedbackRequest;
};