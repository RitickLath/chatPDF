import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { TokenTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Pinecone } from "@pinecone-database/pinecone";

export const loadPDF = async (pdfPath: string) => {
  const loader = new PDFLoader(pdfPath);
  const docs = await loader.load();
  console.log("Printing the docs");
  console.log(docs);
  return docs;
};

export const chunkData = (docs: string) => {
  try {
    const splitter = new TokenTextSplitter({
      encodingName: "cl100k_base",
      chunkSize: 100,
      chunkOverlap: 0,
    });
    const chunks = splitter.splitText(docs);
    console.log("Printing the chuncks");
    console.log(chunks);
    return chunks;
  } catch (error) {
    console.log(error);
  }
};

export const createEmbeddings = async (chunks: string[]) => {
  try {
    const embedding = new OpenAIEmbeddings({
      model: "text-embedding-3-small",
      dimensions: 1024,
    });
    const embeddingResult = await embedding.embedDocuments(chunks);
    console.log("Printing the embeddings");
    console.log(embeddingResult);
    return embeddingResult;
  } catch (error) {
    console.log(error);
  }
};

export const addToDB = async (embeddings: number[][], chunks: string[]) => {
  try {
    if (!embeddings || !chunks || embeddings.length !== chunks.length) {
      throw new Error(
        "Embeddings and chunks must be provided and have the same length",
      );
    }

    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    const index = pc.Index(process.env.PINECONE_INDEX_NAME!);

    const vectors = embeddings.map((embedding, i) => ({
      id: `vec_${i}_${Date.now()}`,
      values: embedding,
      metadata: {
        text: chunks[i]!,
        document: "Doc A", // Has to be dynamic
      },
    }));

    console.log(`Upserting ${vectors.length} vectors to Pinecone...`);

    await index.upsert(vectors);

    console.log("Successfully stored in Pinecone");
    return { success: true };
  } catch (error) {
    console.error("Error adding to DB:", error);
    throw error;
  }
};

export const queryDB = async (question: string) => {
  try {
    const embedding = await createEmbeddings([question]);
    if (!embedding || embedding.length === 0) {
      throw new Error("Failed to generate embedding for the question");
    }

    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    const index = pc.Index(process.env.PINECONE_INDEX_NAME!);

    const queryResult = await index.query({
      vector: embedding[0]!,
      topK: 5, // Increased topK for better context
      includeMetadata: true,
      filter: {
        document: "Doc A",
      },
    });
    return queryResult;
  } catch (error) {
    console.error("Query DB Error:", error);
    throw error;
  }
};
