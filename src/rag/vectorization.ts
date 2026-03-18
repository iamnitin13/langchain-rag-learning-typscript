import dotenv from 'dotenv';
import { loadDocuments } from './loadDocuments';
import { splitDocuments } from './splitDocuments';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeStore } from '@langchain/pinecone';
import cliProgress from 'cli-progress';
import chalk from 'chalk';

// load env configuration; langchain api/sdk will pick model from env file
dotenv.config();


//load document
const rawDocuments = await loadDocuments();

//split into chunks
const chunkedDocuments = await splitDocuments(rawDocuments);


//gemini embedding model
const embeddingsLLM = new GoogleGenerativeAIEmbeddings({
    model: process.env.EMBEDDING_MODEL!,
});

//pinecone initalise & refference to pinecone vector index
const pinecone = new Pinecone();
const pineconeIndex = pinecone.index('langchain-docs')

console.log('Starting Vectorization...');
const progressBar = new cliProgress.SingleBar({});
progressBar.start(chunkedDocuments.length, 0);


//process chunkDocuments in batches of 100
for (let i = 0; i < chunkedDocuments.length; i = i + 100) {

    const batch = chunkedDocuments.slice(i, i + 100);

    //google gemini has rate limit of 100 requests per min for the embedding model, wait 1min before processing next batches
    if (i > 0) {
        console.log(chalk.red('Waiting 60 seconds for next batch due to API rate limit...'));
        await new Promise(resolve => setTimeout(resolve, 60001));
    }

    //loading batch in vector index
    await PineconeStore.fromDocuments(batch, embeddingsLLM, {
        pineconeIndex
    })

    //increment progress
    progressBar.increment(batch.length)
}

progressBar.stop();
console.log('Chunked documents stored in pinecone...');



