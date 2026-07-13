// Gemini reasoning service. Combines the farmer's question with weather + price
// context and forces a structured JSON answer via a response schema.
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ApiError } from "./weather.js";

const LANGUAGES = {
  en: "English",
  hi: "Hindi (हिन्दी)",
  kn: "Kannada (ಕನ್ನಡ)",
};

// Enforce shape at the API level so we never have to parse free text.
const responseSchema = {
  type: "object",
  properties: {
    recommendation: { type: "string" },
    reasoning: { type: "string" },
    confidence_level: { type: "string", enum: ["low", "medium", "high"] },
  },
  required: ["recommendation", "reasoning", "confidence_level"],
};

function buildPrompt({ crop, location, question, language, weather, price }) {
  const langName = LANGUAGES[language] || LANGUAGES.en;
  return `You are KhetSense, a trusted agricultural advisor for small Indian farmers.
Answer in ${langName}, using simple, plain words a farmer with no technical
background can understand. Be practical and specific. Do not invent data — rely
only on the weather and price information provided below.

FARMER'S DETAILS
- Crop: ${crop}
- Location: ${location}
- Question: "${question}"

WEATHER DATA
${JSON.stringify(weather, null, 2)}

MANDI PRICE DATA (${price.unit})
${JSON.stringify(price, null, 2)}

INSTRUCTIONS
- "recommendation": one or two clear sentences telling the farmer what to do.
- "reasoning": a short plain-language explanation of WHY, referring to the
  weather and price figures above (e.g. rain expected, prices rising/falling).
- "confidence_level": "low", "medium" or "high" based on how clear the data is.
- Write BOTH recommendation and reasoning in ${langName}.`;
}

export async function getAdvice(input) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new ApiError("ai", "GEMINI_API_KEY is not configured");

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.4,
    },
  });

  let text;
  try {
    const result = await model.generateContent(buildPrompt(input));
    text = result.response.text();
  } catch (err) {
    throw new ApiError("ai", `Gemini request failed: ${err.message}`);
  }

  try {
    const parsed = JSON.parse(text);
    return {
      recommendation: parsed.recommendation,
      reasoning: parsed.reasoning,
      confidence_level: parsed.confidence_level,
    };
  } catch {
    throw new ApiError("ai", "Gemini returned an unparseable response");
  }
}
