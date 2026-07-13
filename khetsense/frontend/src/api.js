const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function fetchAdvice(payload) {
  const res = await fetch(`${API_URL}/api/advice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

export async function fetchHistory() {
  const res = await fetch(`${API_URL}/api/history`);
  if (!res.ok) throw new Error("Could not load history.");
  const data = await res.json();
  return data.history;
}
