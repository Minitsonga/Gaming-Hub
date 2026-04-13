const endpoints = [
  { name: "gateway", url: process.env.GATEWAY_HEALTH_URL ?? "http://localhost:4000/health" },
  { name: "auth", url: process.env.AUTH_HEALTH_URL ?? "http://localhost:4001/health" },
  { name: "catalog", url: process.env.CATALOG_HEALTH_URL ?? "http://localhost:4002/health" },
  { name: "roguelike", url: process.env.ROGUELIKE_HEALTH_URL ?? "http://localhost:4003/health" },
  { name: "analytics", url: process.env.ANALYTICS_HEALTH_URL ?? "http://localhost:4004/health" },
];

async function verifyEndpoint(endpoint) {
  try {
    const response = await fetch(endpoint.url);
    if (!response.ok) {
      return { ok: false, name: endpoint.name, detail: `HTTP ${response.status}` };
    }
    const payload = await response.json();
    if (payload.status !== "ok" || typeof payload.service !== "string") {
      return { ok: false, name: endpoint.name, detail: "Invalid health response contract" };
    }
    return { ok: true, name: endpoint.name, detail: payload.service };
  } catch (error) {
    return { ok: false, name: endpoint.name, detail: error.message };
  }
}

const results = await Promise.all(endpoints.map(verifyEndpoint));
const failed = results.filter((result) => !result.ok);

for (const result of results) {
  const marker = result.ok ? "OK" : "FAIL";
  console.log(`[${marker}] ${result.name} -> ${result.detail}`);
}

if (failed.length > 0) {
  process.exitCode = 1;
}
