import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import multer from "multer";
import cors from "cors";
import {
  addToDB,
  chunkData,
  createEmbeddings,
  loadPDF,
  queryDB,
} from "./controller/indexing.js";
import "dotenv/config";
import path from "node:path";
import { ChatOpenAI } from "@langchain/openai";
const app: Application = express();

app.use(express.json());
app.use(cors());

const upload = multer({ dest: "uploads/" });
app.post("/upload", upload.single("file"), async (req, res) => {
  // Create File Path
  const filePath = path.join(
    import.meta.dirname + "/../uploads/" + req.file?.filename,
  );
  // Load the data
  const docs = await loadPDF(filePath);
  if (!docs || docs.length === 0 || !docs[0]?.pageContent) {
    return res.status(400).json({ error: "Could not extract text from PDF" });
  }

  // Chunk the data
  const chunks = await chunkData(docs[0].pageContent);
  if (!chunks || chunks.length === 0) {
    return res.status(400).json({ error: "No chunks created from PDF" });
  }

  // create Embedding
  const embeddings = await createEmbeddings(chunks);
  if (!embeddings || embeddings.length === 0) {
    return res.status(400).json({ error: "Failed to create embeddings" });
  }

  // Store to Pinecone DB
  await addToDB(embeddings, chunks);

  res.json({
    message: "File uploaded successfully",
  });
});

app.post("/chat", async (req: Request, res: Response) => {
  const { question } = req.body;

  try {
    const queryResult = await queryDB(question);

    // Extract text from metadata
    const context = queryResult?.matches
      ?.map((m) => m.metadata?.text)
      .filter(Boolean)
      .join("\n\n");

    if (!context) {
      return res.status(200).json({
        success: true,
        answer:
          "I couldn't find any relevant information in the uploaded documents to answer your question.",
      });
    }

    // LLM Call
    const model = new ChatOpenAI({ model: "gpt-4o-mini" });
    const response = await model.invoke([
      {
        role: "system",
        content: `You are a helpful assistant. Use the following context to answer the user's question accurately. 
        Context:
        ${context}`,
      },
      {
        role: "user",
        content: question,
      },
    ]);

    res.status(200).json({
      success: true,
      data: response.content,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to process question" });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
