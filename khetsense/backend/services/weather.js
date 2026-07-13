// Weather service: geocode a village/district name, then fetch current + 5-day forecast
// from OpenWeatherMap. Returns a compact, model-friendly summary.
const GEO_URL = "https://api.openweathermap.org/geo/1.0/direct";
const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";

export class ApiError extends Error {
  constructor(source, message) {
    super(message);
    this.source = source; // "weather" | "price" | "ai"
  }
}

async function geocode(location, key) {
  const url = `${GEO_URL}?q=${encodeURIComponent(location + ",IN")}&limit=1&appid=${key}`;
  const res = await fetch(url);
  if (!res.ok) throw new ApiError("weather", `Geocoding failed (${res.status})`);
  const data = await res.json();
  if (!data.length) throw new ApiError("weather", `Could not find location "${location}"`);
  return { lat: data[0].lat, lon: data[0].lon, resolvedName: data[0].name };
}

// OpenWeather free forecast returns 3-hourly points; collapse into daily summaries.
function summariseForecast(list) {
  const byDay = {};
  for (const p of list) {
    const day = p.dt_txt.split(" ")[0];
    (byDay[day] ||= []).push(p);
  }
  return Object.entries(byDay)
    .slice(0, 5)
    .map(([day, points]) => {
      const temps = points.map((p) => p.main.temp);
      const rain = points.reduce((s, p) => s + (p.rain?.["3h"] || 0), 0);
      const conditions = points.map((p) => p.weather[0].main);
      const dominant = conditions
        .sort((a, b) =>
          conditions.filter((c) => c === a).length - conditions.filter((c) => c === b).length
        )
        .pop();
      return {
        date: day,
        min_temp_c: Math.round(Math.min(...temps)),
        max_temp_c: Math.round(Math.max(...temps)),
        rain_mm: Math.round(rain * 10) / 10,
        condition: dominant,
      };
    });
}

export async function getWeather(location) {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) throw new ApiError("weather", "OPENWEATHER_API_KEY is not configured");

  const { lat, lon, resolvedName } = await geocode(location, key);
  const url = `${FORECAST_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${key}`;
  const res = await fetch(url);
  if (!res.ok) throw new ApiError("weather", `Weather forecast failed (${res.status})`);
  const data = await res.json();

  const now = data.list[0];
  return {
    location: resolvedName,
    current: {
      temp_c: Math.round(now.main.temp),
      humidity_pct: now.main.humidity,
      condition: now.weather[0].description,
      wind_kmh: Math.round(now.wind.speed * 3.6),
    },
    forecast: summariseForecast(data.list),
  };
}
