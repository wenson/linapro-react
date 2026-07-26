const backendBaseURL = (process.env.E2E_BACKEND_BASE_URL ?? "http://127.0.0.1:9120").replace(/\/$/u, "");
const apiBaseURL = process.env.E2E_API_BASE_URL ?? `${backendBaseURL}/api/v1/`;
const username = process.env.E2E_ADMIN_USER ?? "admin";
const password = process.env.E2E_ADMIN_PASS ?? "admin123";

async function readData(response, label) {
  const text = await response.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(`${label} 返回的不是 JSON，HTTP ${response.status}`);
  }
  if (!response.ok || payload?.code !== 0) {
    throw new Error(`${label}失败，HTTP ${response.status}，code=${payload?.code ?? "unknown"}`);
  }
  return payload.data;
}

function jwtTokenId(accessToken) {
  try {
    const encoded = accessToken.split(".")[1];
    if (!encoded) return "";
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    return typeof payload?.tokenId === "string"
      ? payload.tokenId
      : typeof payload?.jti === "string"
        ? payload.jti
        : "";
  } catch {
    return "";
  }
}

let accessToken = "";
try {
  const loginResponse = await fetch(new URL("auth/login", apiBaseURL), {
    body: JSON.stringify({ clientType: "web", password, username }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
    signal: AbortSignal.timeout(10_000),
  });
  const login = await readData(loginResponse, "在线会话探针登录");
  accessToken = login?.accessToken ?? "";
  if (!accessToken) throw new Error("在线会话探针登录未返回 accessToken");

  const listURL = new URL(
    "/x/linapro-monitor-online/api/v1/monitor/online/list?pageNum=1&pageSize=100",
    backendBaseURL,
  );
  const listResponse = await fetch(listURL, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(10_000),
  });
  const list = await readData(listResponse, "在线会话列表查询");
  const tokenId = jwtTokenId(accessToken);
  const observerIncluded = Boolean(
    tokenId && list?.items?.some((item) => item?.tokenId === tokenId),
  );
  const observedTotal = Number(list?.total ?? 0);
  console.log(JSON.stringify({
    baselineTotal: Math.max(0, observedTotal - (observerIncluded ? 1 : 0)),
    observedTotal,
    observerIncluded,
  }));
} finally {
  if (accessToken) {
    await fetch(new URL("auth/logout", apiBaseURL), {
      headers: { Authorization: `Bearer ${accessToken}` },
      method: "POST",
      signal: AbortSignal.timeout(5_000),
    }).catch(() => null);
  }
}
