interface Env {
  DB: D1Database;
  API_TOKEN?: string;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function id(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function now(): number {
  return Math.floor(Date.now() / 1000);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // Auth check (optional — only enforced if API_TOKEN secret is set)
    if (env.API_TOKEN) {
      const auth = request.headers.get("Authorization");
      if (auth !== `Bearer ${env.API_TOKEN}`) {
        return json({ error: "unauthorized" }, 401);
      }
    }

    try {
      // ── Listings CRUD ──────────────────────────────────────────
      if (path === "/listings" && method === "GET") {
        let sql = "SELECT * FROM listings WHERE 1=1";
        const binds: unknown[] = [];
        const p = (k: string) => url.searchParams.get(k);

        if (p("user_id")) { sql += " AND user_id = ?"; binds.push(p("user_id")); }
        if (p("status")) { sql += " AND status = ?"; binds.push(p("status")); }
        if (p("neighborhood")) { sql += " AND neighborhood = ?"; binds.push(p("neighborhood")); }
        if (p("min_price")) { sql += " AND price >= ?"; binds.push(Number(p("min_price"))); }
        if (p("max_price")) { sql += " AND price <= ?"; binds.push(Number(p("max_price"))); }
        if (p("bedrooms")) { sql += " AND bedrooms = ?"; binds.push(Number(p("bedrooms"))); }
        if (p("bathrooms")) { sql += " AND bathrooms = ?"; binds.push(Number(p("bathrooms"))); }
        if (p("no_fee")) { sql += " AND no_fee = 1"; }
        if (p("search")) {
          sql += " AND (address LIKE ? OR street_easy_url LIKE ?)";
          binds.push(`%${p("search")}%`, `%${p("search")}%`);
        }

        sql += " ORDER BY found_at DESC";
        const r = await env.DB.prepare(sql).bind(...binds).all();
        return json(r.results);
      }

      if (path === "/listings" && method === "POST") {
        const body: any = await request.json();
        const lid = id();
        const t = now();
        await env.DB.prepare(
          "INSERT INTO listings (id, street_easy_url, price, source, status, found_at, address, bedrooms, bathrooms, sqft, neighborhood, no_fee, email_message_id, image_url, images, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ).bind(
          lid, body.street_easy_url, body.price,
          body.source || "manual", body.status || "new", body.found_at || t,
          body.address || null, body.bedrooms ?? null, body.bathrooms ?? null,
          body.sqft ?? null, body.neighborhood || null, body.no_fee ? 1 : 0,
          body.email_message_id || null, body.image_url || null,
          body.images ? JSON.stringify(body.images) : null,
          body.user_id || null, t, t
        ).run();
        return json({ id: lid });
      }

      const listingMatch = path.match(/^\/listings\/([^/]+)$/);
      if (listingMatch) {
        const lid = listingMatch[1];
        if (method === "GET") {
          const r = await env.DB.prepare("SELECT * FROM listings WHERE id = ?").bind(lid).first();
          if (!r) return json({ error: "not found" }, 404);
          return json(r);
        }
        if (method === "PATCH") {
          const body: any = await request.json();
          const fields: string[] = [];
          const values: unknown[] = [];
          for (const key of ["street_easy_url", "price", "source", "status", "found_at", "address", "bedrooms", "bathrooms", "sqft", "neighborhood", "no_fee", "email_message_id", "image_url", "images", "user_id"]) {
            if (body[key] !== undefined) {
              fields.push(`${key} = ?`);
              if (key === "images") values.push(JSON.stringify(body[key]));
              else if (key === "no_fee") values.push(body[key] ? 1 : 0);
              else values.push(body[key]);
            }
          }
          if (fields.length === 0) return json({ error: "no fields" }, 400);
          fields.push("updated_at = ?"); values.push(now()); values.push(lid);
          await env.DB.prepare(`UPDATE listings SET ${fields.join(", ")} WHERE id = ?`).bind(...values).run();
          return json({ ok: true });
        }
        if (method === "DELETE") {
          await env.DB.prepare("DELETE FROM listings WHERE id = ?").bind(lid).run();
          return json({ ok: true });
        }
      }

      // ── Contacts CRUD ──────────────────────────────────────────
      if (path === "/contacts" && method === "GET") {
        let sql = "SELECT * FROM contacts WHERE 1=1";
        const binds: unknown[] = [];
        if (url.searchParams.get("user_id")) { sql += " AND user_id = ?"; binds.push(url.searchParams.get("user_id")); }
        if (url.searchParams.get("listing_id")) { sql += " AND listing_id = ?"; binds.push(url.searchParams.get("listing_id")); }
        sql += " ORDER BY created_at DESC";
        const r = await env.DB.prepare(sql).bind(...binds).all();
        return json(r.results);
      }

      if (path === "/contacts" && method === "POST") {
        const body: any = await request.json();
        const cid = id();
        const t = now();
        await env.DB.prepare(
          "INSERT INTO contacts (id, name, email, phone, role, notes, listing_id, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ).bind(cid, body.name, body.email || null, body.phone || null, body.role || null, body.notes || null, body.listing_id || null, body.user_id || null, t, t).run();
        return json({ id: cid });
      }

      const contactMatch = path.match(/^\/contacts\/([^/]+)$/);
      if (contactMatch) {
        const cid = contactMatch[1];
        if (method === "GET") {
          const r = await env.DB.prepare("SELECT * FROM contacts WHERE id = ?").bind(cid).first();
          if (!r) return json({ error: "not found" }, 404);
          return json(r);
        }
        if (method === "PATCH") {
          const body: any = await request.json();
          const fields: string[] = [];
          const values: unknown[] = [];
          for (const key of ["name", "email", "phone", "role", "notes", "listing_id", "user_id"]) {
            if (body[key] !== undefined) {
              fields.push(`${key} = ?`); values.push(body[key]);
            }
          }
          if (fields.length === 0) return json({ error: "no fields" }, 400);
          fields.push("updated_at = ?"); values.push(now()); values.push(cid);
          await env.DB.prepare(`UPDATE contacts SET ${fields.join(", ")} WHERE id = ?`).bind(...values).run();
          return json({ ok: true });
        }
        if (method === "DELETE") {
          await env.DB.prepare("DELETE FROM contacts WHERE id = ?").bind(cid).run();
          return json({ ok: true });
        }
      }

      // ── Settings CRUD ──────────────────────────────────────────
      if (path === "/settings" && method === "GET") {
        let sql = "SELECT * FROM settings WHERE 1=1";
        const binds: unknown[] = [];
        if (url.searchParams.get("user_id")) { sql += " AND user_id = ?"; binds.push(url.searchParams.get("user_id")); }
        if (url.searchParams.get("key")) { sql += " AND key = ?"; binds.push(url.searchParams.get("key")); }
        sql += " ORDER BY key ASC";
        const r = await env.DB.prepare(sql).bind(...binds).all();
        return json(r.results);
      }

      if (path === "/settings" && method === "POST") {
        const body: any = await request.json();
        const sid = id();
        const t = now();
        await env.DB.prepare(
          "INSERT INTO settings (id, key, value, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
        ).bind(sid, body.key, typeof body.value === "string" ? body.value : JSON.stringify(body.value), body.user_id || null, t, t).run();
        return json({ id: sid });
      }

      const settingMatch = path.match(/^\/settings\/([^/]+)$/);
      if (settingMatch) {
        const sid = settingMatch[1];
        if (method === "GET") {
          const r = await env.DB.prepare("SELECT * FROM settings WHERE id = ?").bind(sid).first();
          if (!r) return json({ error: "not found" }, 404);
          return json(r);
        }
        if (method === "PATCH") {
          const body: any = await request.json();
          const fields: string[] = [];
          const values: unknown[] = [];
          for (const key of ["key", "value", "user_id"]) {
            if (body[key] !== undefined) {
              fields.push(`${key} = ?`);
              values.push(typeof body[key] === "string" ? body[key] : JSON.stringify(body[key]));
            }
          }
          if (fields.length === 0) return json({ error: "no fields" }, 400);
          fields.push("updated_at = ?"); values.push(now()); values.push(sid);
          await env.DB.prepare(`UPDATE settings SET ${fields.join(", ")} WHERE id = ?`).bind(...values).run();
          return json({ ok: true });
        }
        if (method === "DELETE") {
          await env.DB.prepare("DELETE FROM settings WHERE id = ?").bind(sid).run();
          return json({ ok: true });
        }
      }

      // ── User Emails CRUD ───────────────────────────────────────
      if (path === "/user-emails" && method === "GET") {
        let sql = "SELECT * FROM user_emails WHERE 1=1";
        const binds: unknown[] = [];
        if (url.searchParams.get("user_id")) { sql += " AND user_id = ?"; binds.push(url.searchParams.get("user_id")); }
        if (url.searchParams.get("email")) { sql += " AND email = ?"; binds.push(url.searchParams.get("email")); }
        const r = await env.DB.prepare(sql).bind(...binds).all();
        return json(r.results);
      }

      if (path === "/user-emails" && method === "POST") {
        const body: any = await request.json();
        const eid = id();
        const t = now();
        await env.DB.prepare(
          "INSERT INTO user_emails (id, user_id, email, verified, created_at) VALUES (?, ?, ?, ?, ?)"
        ).bind(eid, body.user_id, body.email, body.verified ? 1 : 0, t).run();
        return json({ id: eid });
      }

      const emailMatch = path.match(/^\/user-emails\/([^/]+)$/);
      if (emailMatch) {
        const eid = emailMatch[1];
        if (method === "DELETE") {
          await env.DB.prepare("DELETE FROM user_emails WHERE id = ?").bind(eid).run();
          return json({ ok: true });
        }
      }

      // ── Health ─────────────────────────────────────────────────
      if (path === "/" || path === "/health") {
        return json({ status: "ok", service: "streeteasy-monitor" });
      }

      return json({ error: "not found" }, 404);
    } catch (e: any) {
      return json({ error: e.message }, 500);
    }
  },
};
