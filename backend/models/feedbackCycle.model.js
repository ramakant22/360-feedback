
const { DataTypes, UUIDV4 } = require('sequelize');

module.exports = (sequelize) => {
  const FeedbackCycle = sequelize.define("feedback_cycle", {
    id: {
      type: DataTypes.UUID,
      defaultValue: UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    startDate: {
      type: DataTypes.DATEONLY, // Stores YYYY-MM-DD
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATEONLY, // Stores YYYY-MM-DD
      allowNull: false
    }
  });
  return FeedbackCycle;
};