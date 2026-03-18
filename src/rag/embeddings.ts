import dotenv from "dotenv";
import {GoogleGenerativeAIEmbeddings} from "@langchain/google-genai";

dotenv.config();


const embeddingsLLM = new GoogleGenerativeAIEmbeddings({
    model: process.env.EMBEDDING_MODEL!,
});

const embeddings = await embeddingsLLM.embedQuery("What is vector embedding?");

console.log(embeddings);

console.log("Array Length: ", embeddings.length);
