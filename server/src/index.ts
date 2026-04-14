import express, { type Application } from "express";
import multer from "multer";
import cors from "cors";
import {
  addToDB,
  chunkData,
  createEmbeddings,
  loadPDF,
} from "./controller/indexing.js";
import "dotenv/config";
import path from "node:path";
const app: Application = express();

app.use(express.json());
app.use(cors());

const upload = multer({ dest: "uploads/" });
app.post("/upload", upload.single("file"), async (req, res) => {
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
  const store = await addToDB(embeddings, chunks);
  console.log(store);

  res.json({
    message: "File uploaded successfully",
    docs,
    chunks,
    embeddings,
  });
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
