// Cloudflare Worker entry (Workers Builds). Static files are served straight from
// the assets binding; wrangler.jsonc routes only /api/* through this script.
// The renewal proxy itself lives in functions/api/renewal-status.js so the same
// file also works if the site is ever deployed as a Cloudflare Pages project.
import { onRequestGet as renewalStatus } from "./functions/api/renewal-status.js";

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/renewal-status") {
      if (request.method !== "GET") return new Response("Method not allowed", { status: 405, headers: { Allow: "GET" } });
      return renewalStatus({ request });
    }
    if (pathname.startsWith("/api/")) return new Response("Not found", { status: 404 });
    return env.ASSETS.fetch(request);
  }
};
