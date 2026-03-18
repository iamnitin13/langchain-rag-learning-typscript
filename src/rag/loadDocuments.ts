import { Document } from "@langchain/core/documents";
import { crawlLangchainDocsUrls } from "./crawlDocuments";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import cliProgress from 'cli-progress';


//progressbar indicator
const progressBar = new cliProgress.SingleBar({});

export async function loadDocuments(): Promise<Document[]> {
    const langchainDocsUrl = await crawlLangchainDocsUrls();

    //logging
    console.log(`Starting documnet downlaod. ${langchainDocsUrl.length} total documents.`)

    //start progressbar
    progressBar.start(langchainDocsUrl.length, 0);

    const rawDocuments: Document[] = [];

    for (const url of langchainDocsUrl) {

        const loader = new CheerioWebBaseLoader(url);
        const docs = await loader.load();
        rawDocuments.push(...docs);

        //increment progressbar
        progressBar.increment()

    }

    //stop progressbar
    progressBar.stop();
    console.log(`${rawDocuments.length} documents loaded.`);
    return rawDocuments;
}

// const rawDocuments = await loadDocuments();
// console.log(rawDocuments.splice(0, 3))
