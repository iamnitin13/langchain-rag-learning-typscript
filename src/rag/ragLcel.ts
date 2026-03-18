import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import dotenv from 'dotenv';
import { createRetriever } from "./retriever";
import { RunnableSequence } from "@langchain/core/runnables";
import { Document } from "langchain";

dotenv.config();





//prompt template
const prompt = ChatPromptTemplate.fromMessages([
    ["human", `You are an assistant for question-answering tasks. Use the following pieces of retrieved context to answer the question. If you don't know the answer, just say that you don't know. Use three sentences maximum and keep the answer concise.
Question: { question } 
Context: { context } 
Answer: `],
]);

//llm model legagcy TODO: install @langchain/google
const llm = new ChatGoogleGenerativeAI({
    model: process.env.MODEL_NAME!,
    // maxOutputTokens: 500
})


//output parser
const outputParser = new StringOutputParser();


//create retriever
const retriever = await createRetriever();


//create retriever runnable sequence chain
const retreivalChain = RunnableSequence.from([
    (input) => input.question,
    retriever,
    (docs: Document[]) => docs.map((doc) => doc.pageContent).join("\n\n"), //format return context documents to string to be passed in prompt

])

//create a generation sequence chain
const generationChain = RunnableSequence.from([
    {
        question: (input) => input.question,
        context: retreivalChain
    },
    prompt,
    llm,
    outputParser
])
