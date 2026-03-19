import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import dotenv from 'dotenv';
import { createRetriever } from "./retriever";
import { RunnableSequence } from "@langchain/core/runnables";
import { Document } from "langchain";
import { ChatHandler, chat } from "../utils/chat";
import { BaseMessage, AIMessage, HumanMessage } from "@langchain/core/messages";

dotenv.config();

//prompt template
// add chat history to generation chain prompt , so it also aware of previous conversation
const prompt = ChatPromptTemplate.fromMessages([
    ["human",
        `You are an assistant for question-answering tasks. Use the following pieces of retrieved context to answer the question. If you don't know the answer, just say that you don't know. Use three sentences maximum and keep the answer concise.
  Context: {context}
        `,
    ],
    new MessagesPlaceholder('chat_history'),
    ['human', '{question}']
]);

//llm model legagcy TODO: install @langchain/google
const llm = new ChatGoogleGenerativeAI({
    model: process.env.MODEL!,
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
        context: retreivalChain,
        chat_history: (input) => input.chat_history
    },
    prompt,
    llm,
    outputParser
])

//system prompt to handle chat request
const qcSystemPrompt = `Given a chat history and the latest user question
which might reference context in the chat history, formulate a standalone question
which can be understood without the chat history. Do NOT answer the question,
just reformulate it if needed and otherwise return it as is.`

//query contextulization prompt template
const qcPrompt = ChatPromptTemplate.fromMessages([
    ['system', qcSystemPrompt],
    new MessagesPlaceholder('chat_history'), //placeholder for chat history
    ['human', "{question}"]
])

//query contextulization chain
const qcChain = RunnableSequence.from([qcPrompt, llm, outputParser]);

//maintain chat history, store ai message human messages
const chatHistory: BaseMessage[] = [];


// intergate chat handler on terminal
const chatHandler: ChatHandler = async (question: string) => {

    //integrate contextulized query generated from llm and pass it to the generation chain
    let contextulizedQuestion = null;

    //contextulize the query if chat history presist
    if (chatHistory.length > 0) {
        contextulizedQuestion = await qcChain.invoke({
            question,
            chat_history: chatHistory
        })

        console.log("Contextulized Question: ", contextulizedQuestion);

    }
    return {
        answer: generationChain.stream({
            question: contextulizedQuestion || question,
            chat_history: chatHistory

        }),
        //maintain chat history
        answerCallBack: async (answerText: string) => {
            chatHistory.push(new HumanMessage(contextulizedQuestion || question))
            chatHistory.push(new AIMessage(answerText))

        }
    }
}

// start chat
chat(chatHandler)