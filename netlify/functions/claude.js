exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "API-Key nicht konfiguriert. Bitte ANTHROPIC_API_KEY in Netlify setzen." }),
    };
  }
  try {
    const body = JSON.parse(event.body);
    body.model = "claude-haiku-4-5-20251001";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 24000);
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const data = await response.json();
    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: data?.error?.message || "API-Fehler" }),
      };
    }
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(data),
    };
  } catch (err) {
    const isTimeout = err.name === "AbortError";
    return {
      statusCode: isTimeout ? 504 : 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: isTimeout ? "Die Anfrage hat zu lange gedauert. Bitte versuche es nochmal." : "Serverfehler: " + err.message }),
    };
  }
};
