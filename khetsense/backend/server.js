import "dotenv/config";
import express from "express";
import cors from "cors";
import advisoryRouter from "./routes/advisory.js";

const app = express();
app.use(express.json());

const origins = (process.env.CORS_ORIGIN || "*").split(",").map((s) => s.trim());
app.use(cors({ origin: origins.includes("*") ? true : origins }));

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api", advisoryRouter);

// Catch-all error handler so unexpected throws return JSON, not HTML.
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Unexpected server error." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`KhetSense backend running on :${PORT}`));
