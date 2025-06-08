
const db = require("../models");
const FeedbackRequest = db.FeedbackRequest;
const { GoogleGenAI } = require("@google/genai");

const API_KEY = process.env.API_KEY;
const GEMINI_MODEL_NAME = 'gemini-2.5-flash-preview-04-17';

let ai;
if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  console.error("API_KEY for Gemini is not set in environment variables. AI features will be disabled on the backend.");
}

exports.generateAiSummary = async (req, res) => {
  const requestId = req.params.requestId;

  if (!ai) {
    return res.status(500).send({ message: "Gemini API client is not initialized on the backend. Check API_KEY." });
  }

  try {
    const request = await FeedbackRequest.findByPk(requestId);
    if (!request) {
      return res.status(404).send({ message: `FeedbackRequest with id ${requestId} not found.` });
    }

    if (!request.responses || request.responses.length === 0) {
      await FeedbackRequest.update({ aiSummaryError: "No feedback responses to analyze." }, { where: { id: requestId } });
      const updatedReq = await FeedbackRequest.findByPk(requestId);
      return res.status(200).send(updatedReq);
    }

    const textualResponses = request.responses
      .map(resp => resp.textResponse)
      .filter((text) => typeof text === 'string' && text.trim() !== '');

    if (textualResponses.length === 0) {
      await FeedbackRequest.update({ aiSummaryError: "No textual feedback available for AI summary." }, { where: { id: requestId } });
      const updatedReq = await FeedbackRequest.findByPk(requestId);
      return res.status(200).send(updatedReq);
    }

    const prompt = `You are an HR assistant. Based on the following anonymous feedback comments provided to an employee, please provide a concise summary of key strengths and areas for development. Structure your summary into 'Key Strengths' and 'Areas for Development'. Be constructive and focus on actionable insights. Do not invent information not present in the comments.

Feedback Comments:
${textualResponses.map(text => `- ${text}`).join('\n')}
`;

    const genAIResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: prompt,
      config: {
        temperature: 0.5,
      }
    });
    
    const summary = genAIResponse.text;

    await FeedbackRequest.update({ aiSummary: summary, aiSummaryError: null }, { where: { id: requestId } });
    const updatedRequestWithSummary = await FeedbackRequest.findByPk(requestId);
    res.send(updatedRequestWithSummary);

  } catch (error) {
    console.error('Error calling Gemini API from backend:', error);
    const errorMessage = error instanceof Error ? `Gemini API error: ${error.message}` : "An unknown error occurred during AI analysis.";
    try {
      await FeedbackRequest.update({ aiSummaryError: errorMessage }, { where: { id: requestId } });
      const updatedReq = await FeedbackRequest.findByPk(requestId);
      return res.status(500).send(updatedReq); // Send updated req even on error
    } catch (dbError) {
        return res.status(500).send({ message: `Error during AI analysis and updating request: ${error.message}` });
    }
  }
};