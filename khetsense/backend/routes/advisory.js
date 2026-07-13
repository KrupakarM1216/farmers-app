// Advisory routes: the main /advice flow plus /history.
import { Router } from "express";
import { getWeather, ApiError } from "../services/weather.js";
import { getMandiPrices } from "../services/mandi.js";
import { getAdvice } from "../services/gemini.js";
import { saveQuery, getHistory } from "../db.js";

const router = Router();

router.post("/advice", async (req, res) => {
  const { crop, location, question, language = "en" } = req.body || {};

  if (!crop || !location || !question) {
    return res.status(400).json({
      error: "Please provide crop, location and question.",
    });
  }

  // Fetch weather and price in parallel; capture partial failures so one dead
  // API doesn't sink the whole request when the other still has data.
  const [weatherRes, priceRes] = await Promise.allSettled([
    getWeather(location),
    getMandiPrices(crop, location),
  ]);

  const weather = weatherRes.status === "fulfilled" ? weatherRes.value : null;
  const price = priceRes.status === "fulfilled" ? priceRes.value : null;

  const warnings = [];
  if (!weather) warnings.push(reason(weatherRes, "weather"));
  if (!price) warnings.push(reason(priceRes, "price"));

  // Without any context, Gemini would just guess — fail clearly instead.
  if (!weather && !price) {
    return res.status(502).json({
      error: "Could not fetch weather or price data right now. Please try again.",
      warnings,
    });
  }

  let advice;
  try {
    advice = await getAdvice({
      crop,
      location,
      question,
      language,
      weather: weather || { note: "weather data unavailable" },
      price: price || { note: "price data unavailable" },
    });
  } catch (err) {
    const status = err instanceof ApiError ? 502 : 500;
    return res.status(status).json({
      error: "The AI advisor is unavailable right now. Please try again shortly.",
      detail: err.message,
      warnings,
    });
  }

  // Persist history but never let a storage hiccup break the response.
  let id = null;
  try {
    id = saveQuery({
      crop,
      location,
      question,
      language,
      recommendation: advice.recommendation,
      reasoning: advice.reasoning,
      confidence: advice.confidence_level,
      weather,
      price,
    });
  } catch (err) {
    warnings.push(`Could not save to history: ${err.message}`);
  }

  res.json({ id, ...advice, weather, price, warnings });
});

router.get("/history", (req, res) => {
  try {
    res.json({ history: getHistory(20) });
  } catch (err) {
    res.status(500).json({ error: "Could not load history.", detail: err.message });
  }
});

function reason(settled, source) {
  const msg = settled.reason?.message || `${source} data unavailable`;
  return msg;
}

export default router;
