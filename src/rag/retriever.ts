import { VectorStoreRetriever } from "@langchain/core/vectorstores";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import dotenv from 'dotenv';

dotenv.config();



export async function createRetriever(): Promise<VectorStoreRetriever> {
    //same embedding model,vector store & vector index used for chunk embedding , will be used for retreiver

    //gemini embedding model
    const embeddingsLLM = new GoogleGenerativeAIEmbeddings({
        model: process.env.EMBEDDING_MODEL!,
    });

    //pinecone initalise & refference to pinecone vector index
    const pinecone = new Pinecone();
    const pineconeIndex = pinecone.index('langchain-docs')


    //use same exisiting pinecode vector store & pass configuration
    const vectorStore = await PineconeStore.fromExistingIndex(embeddingsLLM, {
        pineconeIndex
    })

    //return retriever from vector store
    // 1> it perform logic for generating embedding for query 
    // 2> search relevant chunks from pinecone index 
    // 3> return them as context
    return vectorStore.asRetriever();

}


//sample test of retriever
// const retriever = await createRetriever();
// const context = await retriever.invoke('What is LangChain?');
// console.log(context);
