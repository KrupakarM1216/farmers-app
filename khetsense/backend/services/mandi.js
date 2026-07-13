// Mandi price service: queries the data.gov.in "Current Daily Price of Various
// Commodities" resource, filters by commodity, and computes a simple price trend.
import { ApiError } from "./weather.js";

// Public resource id for daily mandi prices on data.gov.in.
const RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";
const BASE = `https://api.data.gov.in/resource/${RESOURCE_ID}`;

export async function getMandiPrices(crop, location) {
  const key = process.env.DATA_GOV_API_KEY;
  if (!key) throw new ApiError("price", "DATA_GOV_API_KEY is not configured");

  // The dataset filters on commodity + optional district. We try district first,
  // then fall back to commodity-only so we still return something useful.
  const attempts = [
    { "filters[commodity]": crop, "filters[district]": location },
    { "filters[commodity]": crop },
  ];

  let records = [];
  for (const filters of attempts) {
    const params = new URLSearchParams({
      "api-key": key,
      format: "json",
      limit: "50",
      ...filters,
    });
    const res = await fetch(`${BASE}?${params}`);
    if (!res.ok) throw new ApiError("price", `Mandi price API failed (${res.status})`);
    const data = await res.json();
    if (data.records?.length) {
      records = data.records;
      break;
    }
  }

  if (!records.length) {
    throw new ApiError("price", `No mandi price data found for "${crop}" near "${location}"`);
  }

  // Modal price = the most common transacted price; the field is a string.
  const priced = records
    .map((r) => ({
      market: r.market,
      district: r.district,
      state: r.state,
      date: r.arrival_date,
      modal_price: Number(r.modal_price),
      min_price: Number(r.min_price),
      max_price: Number(r.max_price),
    }))
    .filter((r) => Number.isFinite(r.modal_price));

  const prices = priced.map((r) => r.modal_price);
  const avg = Math.round(prices.reduce((s, p) => s + p, 0) / prices.length);
  const min = Math.min(...prices);
  const max = Math.max(...prices);

  // Rough trend: compare the newest half of records against the oldest half.
  // Needs at least 2 records, otherwise there's no "older" half to compare.
  let trend = "stable";
  if (priced.length >= 2) {
    const half = Math.floor(priced.length / 2);
    const recentAvg = avg2(priced.slice(0, half));
    const olderAvg = avg2(priced.slice(half));
    if (recentAvg > olderAvg * 1.05) trend = "rising";
    else if (recentAvg < olderAvg * 0.95) trend = "falling";
  }

  return {
    commodity: crop,
    unit: "₹ per quintal",
    avg_modal_price: avg,
    min_price: min,
    max_price: max,
    trend,
    sample_markets: priced.slice(0, 5),
  };
}

function avg2(rows) {
  if (!rows.length) return 0;
  return rows.reduce((s, r) => s + r.modal_price, 0) / rows.length;
}
