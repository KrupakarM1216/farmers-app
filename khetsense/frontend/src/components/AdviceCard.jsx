import { useState } from "react";

const CONFIDENCE_COLORS = {
  high: "#1a7f37",
  medium: "#b8860b",
  low: "#b3261e",
};

export default function AdviceCard({ result }) {
  const [showReasoning, setShowReasoning] = useState(true);
  const { recommendation, reasoning, confidence_level, weather, price, warnings } = result;

  return (
    <div className="card advice">
      <div className="advice-header">
        <h2>Advice</h2>
        <span
          className="confidence"
          style={{ background: CONFIDENCE_COLORS[confidence_level] || "#666" }}
        >
          {confidence_level} confidence
        </span>
      </div>

      <p className="recommendation">{recommendation}</p>

      <button className="link-btn" onClick={() => setShowReasoning((v) => !v)}>
        {showReasoning ? "Hide" : "Show"} full reasoning
      </button>
      {showReasoning && <p className="reasoning">{reasoning}</p>}

      <div className="context-grid">
        {weather && (
          <div className="context-box">
            <h3>Weather · {weather.location}</h3>
            <p>
              {weather.current.temp_c}°C, {weather.current.condition},{" "}
              {weather.current.humidity_pct}% humidity
            </p>
            <ul>
              {weather.forecast.map((d) => (
                <li key={d.date}>
                  {d.date}: {d.min_temp_c}–{d.max_temp_c}°C, {d.condition}
                  {d.rain_mm > 0 ? `, ${d.rain_mm}mm rain` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}

        {price && (
          <div className="context-box">
            <h3>Mandi Price · {price.commodity}</h3>
            <p>
              Avg ₹{price.avg_modal_price} {price.unit.replace("₹ per ", "/ ")} ·{" "}
              <strong className={`trend ${price.trend}`}>{price.trend}</strong>
            </p>
            <p className="muted">
              Range ₹{price.min_price}–₹{price.max_price}
            </p>
            <ul>
              {price.sample_markets.map((m, i) => (
                <li key={i}>
                  {m.market} ({m.district}): ₹{m.modal_price}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {warnings?.length > 0 && (
        <div className="warnings">
          {warnings.map((w, i) => (
            <p key={i}>⚠️ {w}</p>
          ))}
        </div>
      )}
    </div>
  );
}
