
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./models'); // Imports models and sequelize instance

const app = express();

const corsOptions = {
  origin: '*' // Allow all origins for simplicity in development. Restrict in production.
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple route for testing
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Feedback Portal backend API." });
});

// API routes
require('./routes/user.routes')(app);
require('./routes/feedbackCycle.routes')(app);
require('./routes/questionTemplate.routes')(app);
require('./routes/feedbackRequest.routes')(app);
require('./routes/gemini.routes')(app);


const PORT = process.env.PORT || 8080;

// Sync database and start server
// The server will only start listening if the database sync is successful.
db.sequelize.sync()
  .then(() => {
    console.log("Synced db.");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}.`);
    });
  })
  .catch((err) => {
    console.error("Failed to sync db: " + err.message);
    console.error("Backend server will not start due to database synchronization error. Please check database configuration and ensure MySQL server is running.");
    // process.exit(1); // Optionally, uncomment to forcefully exit if DB sync fails
  });