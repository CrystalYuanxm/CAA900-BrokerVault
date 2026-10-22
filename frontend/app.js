// Shared front-end helpers. Every API call carries the Static Web Apps auth cookie; the API checks the user and role.
async function api(path, opts = {}) {
  const res = await fetch(`/api/${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: "same-origin",
  });
  const type = res.headers.get("content-type") || "";
  if (res.status === 401 || res.redirected || !type.includes("application/json")) {
    if (res.status === 401 || res.redirected) { location.href = "/index.html?login=required"; throw new Error("Sign in required"); }
  }
  const data = type.includes("application/json") ? await res.json() : {};
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}
async function whoAmI() {
  const r = await fetch("/.auth/me", { credentials: "same-origin" });
  const j = await r.json();
  return j.clientPrincipal; // null when signed out
}
function show(el, text, kind) { el.textContent = text; el.className = `msg ${kind}`; }
const fmtDate = (s) => (s ? new Date(s).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" }) : "—");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
async function download(docId, clientId) {
  const q = new URLSearchParams({ doc: docId, ...(clientId ? { client: clientId } : {}) });
  const { url } = await api(`download-url?${q}`);
  location.href = url; // short-lived (5 minute) read-only link
}
