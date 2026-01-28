const express = require("express");
import { Request, Response } from "express";

const app = express();
const PORT = 3001;

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Hi there!");
});

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
