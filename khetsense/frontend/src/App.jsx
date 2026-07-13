import { useState } from "react";
import { fetchAdvice } from "./api.js";
import AdviceCard from "./components/AdviceCard.jsx";

const EXAMPLES = [
  "Should I harvest this week?",
  "Is now a good time to sell?",
  "Will the weather hurt my crop?",
];

export default function App() {
  const [form, setForm] = useState({
    crop: "",
    location: "",
    question: "",
    language: "en",
  });
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    setResult(null);
    try {
      const data = await fetchAdvice(form);
      setResult(data);
      setStatus("done");
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  }

  return (
    <div className="app">
      <header>
        <h1>🌾 KhetSense</h1>
        <p className="tagline">AI crop advice for Indian farmers</p>
      </header>

      <form className="card" onSubmit={onSubmit}>
        <label>
          Crop
          <input
            value={form.crop}
            onChange={update("crop")}
            placeholder="e.g. Tomato, Onion, Paddy"
            required
          />
        </label>

        <label>
          Location (village / district)
          <input
            value={form.location}
            onChange={update("location")}
            placeholder="e.g. Kolar, Mysuru"
            required
          />
        </label>

        <label>
          Your question
          <textarea
            value={form.question}
            onChange={update("question")}
            placeholder="e.g. Should I harvest this week?"
            rows={2}
            required
          />
        </label>

        <div className="examples">
          {EXAMPLES.map((q) => (
            <button
              type="button"
              key={q}
              className="chip"
              onClick={() => setForm({ ...form, question: q })}
            >
              {q}
            </button>
          ))}
        </div>

        <label>
          Answer language
          <select value={form.language} onChange={update("language")}>
            <option value="en">English</option>
            <option value="hi">हिन्दी (Hindi)</option>
            <option value="kn">ಕನ್ನಡ (Kannada)</option>
          </select>
        </label>

        <button type="submit" className="primary" disabled={status === "loading"}>
          {status === "loading" ? "Thinking…" : "Get Advice"}
        </button>
      </form>

      {status === "loading" && (
        <div className="card loading">
          <div className="spinner" />
          <p>Fetching weather, mandi prices and asking the advisor…</p>
        </div>
      )}

      {status === "error" && (
        <div className="card error-card">
          <p>❌ {error}</p>
        </div>
      )}

      {status === "done" && result && <AdviceCard result={result} />}

      <footer>
        <p className="muted">
          Advice is guidance only. Weather via OpenWeatherMap · prices via data.gov.in
        </p>
      </footer>
    </div>
  );
}
