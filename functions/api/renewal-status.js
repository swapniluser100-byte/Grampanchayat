// GET /api/renewal-status?customerId=...  -> public, no auth
//
// Cloudflare Pages Function. SitePragati's public customer-info API sends no
// Access-Control-Allow-Origin header, so the browser-side renewal gate
// (assets/renewal-gate.js) can't call it directly. This runs server-side,
// where CORS doesn't apply, and relays the upstream JSON under our own origin.
// GitHub Pages and plain static hosting ignore this folder; there the gate's
// request 404s and the gate fails open.
const UPSTREAM = "https://sitepragati.in/api/public/customer-info";

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}

export async function onRequestGet({ request }) {
  const customerId = new URL(request.url).searchParams.get("customerId") || "";
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(customerId)) return json({ ok: false, error: "customerId is required" }, 400);

  try {
    const upstream = await fetch(`${UPSTREAM}?customerId=${encodeURIComponent(customerId)}`, { headers: { Accept: "application/json" } });
    if (!upstream.ok) return json({ ok: false, error: "Upstream renewal check failed" }, 502);
    const info = await upstream.json();
    return json({ ok: true, info });
  } catch {
    return json({ ok: false, error: "Upstream renewal check unreachable" }, 502);
  }
}
