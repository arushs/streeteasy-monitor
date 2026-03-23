import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// Ingest listings from the email parser Worker.
// POST /ingest { listings: [...] }
// Auth: Bearer token from CONVEX_INGEST_SECRET env var
http.route({
  path: "/ingest",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Verify auth token
    const authHeader = request.headers.get("Authorization");
    const expectedToken = process.env.CONVEX_INGEST_SECRET;
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const listings = body.listings;

    if (!Array.isArray(listings)) {
      return new Response(
        JSON.stringify({ error: "listings must be an array" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const results = [];
    for (const listing of listings) {
      try {
        const id = await ctx.runMutation(api.listings.create, {
          streetEasyUrl: listing.streetEasyUrl || listing.street_easy_url,
          price: listing.price,
          source: "email",
          address: listing.address,
          bedrooms: listing.bedrooms,
          bathrooms: listing.bathrooms,
          sqft: listing.sqft,
          neighborhood: listing.neighborhood,
          noFee: listing.noFee ?? listing.no_fee,
          imageUrl: listing.imageUrl ?? listing.image_url,
          images: listing.images,
          emailMessageId: listing.emailMessageId ?? listing.email_message_id,
          userId: listing.userId ?? listing.user_id,
        });
        results.push({ url: listing.streetEasyUrl || listing.street_easy_url, id, status: "created" });
      } catch (e: any) {
        results.push({ url: listing.streetEasyUrl || listing.street_easy_url, error: e.message });
      }
    }

    return new Response(
      JSON.stringify({ ingested: results.length, results }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }),
});

// Health check
http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(
      JSON.stringify({ status: "ok", service: "streeteasy-convex" }),
      { headers: { "Content-Type": "application/json" } }
    );
  }),
});

export default http;
