export async function postJsonWithCode(url, data) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok || json.error) {
    const error = new Error(json.error || "Request failed.");
    error.code = json.code || "";
    throw error;
  }
  return json;
}
