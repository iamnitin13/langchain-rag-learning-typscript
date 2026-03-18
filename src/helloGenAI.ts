import dotenv from "dotenv";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

dotenv.config();

// For Google Gemini model, Please ensure GOOGLE_API_KEY env variable is set in .env file

const llm = new ChatGoogleGenerativeAI({
  model: process.env.MODEL!, // if this model is not available anymore then please check another available model from google gemini api documentation
});

const response = await llm.invoke(
  "Describe the importance of learning generative AI for javascript developers in 50 words.",
);

console.log(response);
