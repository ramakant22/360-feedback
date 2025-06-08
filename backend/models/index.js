
const dbConfig = require("../config/db.config.js");
const Sequelize = require("sequelize");

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  operatorsAliases: 0, // 0 instead of false for Sequelize v6+
  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle
  }
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.User = require("./user.model.js")(sequelize, Sequelize);
db.FeedbackCycle = require("./feedbackCycle.model.js")(sequelize, Sequelize);
db.QuestionTemplate = require("./questionTemplate.model.js")(sequelize, Sequelize);
db.FeedbackRequest = require("./feedbackRequest.model.js")(sequelize, Sequelize);

// Define associations

// User and FeedbackRequest (Subject)
db.User.hasMany(db.FeedbackRequest, { as: "SubjectFeedbackRequests", foreignKey: "subjectUserId" });
db.FeedbackRequest.belongsTo(db.User, { as: "SubjectUser", foreignKey: "subjectUserId" });

// User and FeedbackRequest (Reviewer)
db.User.hasMany(db.FeedbackRequest, { as: "ReviewerFeedbackRequests", foreignKey: "reviewerId" });
db.FeedbackRequest.belongsTo(db.User, { as: "Reviewer", foreignKey: "reviewerId" });

// User and FeedbackRequest (Creator)
db.User.hasMany(db.FeedbackRequest, { as: "CreatedFeedbackRequests", foreignKey: "createdById" });
db.FeedbackRequest.belongsTo(db.User, { as: "CreatedBy", foreignKey: "createdById" });

// User self-referencing for reportsTo
db.User.belongsTo(db.User, { as: 'Manager', foreignKey: 'reportsTo', targetKey: 'id', constraints: false }); // targetKey added for clarity, constraints false allows null
db.User.hasMany(db.User, { as: 'DirectReports', foreignKey: 'reportsTo', sourceKey: 'id', constraints: false });


// FeedbackCycle and FeedbackRequest
db.FeedbackCycle.hasMany(db.FeedbackRequest, { foreignKey: "cycleId" });
db.FeedbackRequest.belongsTo(db.FeedbackCycle, { foreignKey: "cycleId" });

// QuestionTemplate and FeedbackRequest
db.QuestionTemplate.hasMany(db.FeedbackRequest, { foreignKey: "templateIdOrigin" });
db.FeedbackRequest.belongsTo(db.QuestionTemplate, { as: "TemplateOrigin", foreignKey: "templateIdOrigin" });


module.exports = db;