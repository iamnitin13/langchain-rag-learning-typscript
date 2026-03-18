//importing prompt template for langchain core prompt
import { PromptTemplate } from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { StringOutputParser } from "@langchain/core/output_parsers";

//import chalk
import chalk from "chalk";
const info = chalk.yellow.bold;
const response = chalk.green.underline;

//import legacy langchain
import { LLMChain } from "@langchain/classic/chains";

// import runnabelsquence
import { RunnableSequence } from "@langchain/core/runnables";

// import dotenv package to include google api key stored in dotenv file
import dotenv from "dotenv";

//load environment variable
dotenv.config();

async function personalizedPitch(
  course: string,
  role: string,
  wordLimit: number,
) {
  //create promptTemplate object, having template & inputvariables
  const promptTemplate = new PromptTemplate({
    template:
      "Describe the importance of learning {course} for a {role}. Limit the output to {wordLimit} words.",
    inputVariables: ["course", "role", "wordLimit"],
  });

  // create formattedPrompt, it is  async & return promise
  const formattedPrompt = await promptTemplate.format({
    course,
    role,
    wordLimit,
  });

  // console.log("formattedPrompt", formattedPrompt, promptTemplate);

  //llm interface
  const llm = new ChatGoogleGenerativeAI({
    model: process.env.MODEL!,
     temperature: 1,
    topP:1,
   // maxOutputTokens:100,
    // topK:1
  });

  //output parser
  const outputParser = new StringOutputParser();

  // Option 1. langchain legacy chain, take fix input prompttemplate,llm,wordlimit
  // const legacyChain = new LLMChain({
  //   prompt: promptTemplate,
  //   llm,
  //   outputParser,
  // });

  // const answer = await legacyChain.invoke({ course, role, wordLimit });

  // console.log("Answer from legacy LLM Chain:", answer);

  // option 2: LCEL chain -- build chain using component thorugh pipe
  // const lcelChain = promptTemplate.pipe(llm).pipe(outputParser);
  // const answer = await lcelChain.invoke({ course, role, wordLimit });

  // console.log("Answer from lcel chain:", answer);

  //Option 3: Runnable Sequence
  //runnablesquence use pipe internally , we can pass array of component into from method
  const runnabelsquenceLcelChain = RunnableSequence.from([
    promptTemplate,
    llm,
    outputParser,
  ]);

  const answer = await runnabelsquenceLcelChain.invoke({
    course,
    role,
    wordLimit,
  });

  console.log(
    info("Answer from Runnabel Sequence lcel chain:"),
    response(answer),
  );
}

await personalizedPitch("Nextjs", "Frontend Developer", 100);
