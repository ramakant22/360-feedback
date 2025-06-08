
const { DataTypes, UUIDV4 } = require('sequelize');

module.exports = (sequelize) => {
  const QuestionTemplate = sequelize.define("question_template", {
    id: {
      type: DataTypes.UUID,
      defaultValue: UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    questions: { // Array of FeedbackQuestion objects
      type: DataTypes.JSON,
      allowNull: false
    }
  });
  return QuestionTemplate;
};