#!/usr/bin/env node
/**
 * StreetEasy Listing Change Detector
 * 
 * Checks tracked listings for price drops, delistings, and status changes.
 * Scrapes StreetEasy listing pages and compares against stored D1 data.
 * Records changes via the /changes API endpoint.
 * 
 * Usage: node check-changes.js [--dry-run] [--limit N]
 */

const fs = require('fs');
const path = require('path');

const D1_API = 'https://streeteasy-monitor.arushshankar.workers.dev';

// Rate limit: be gentle with StreetEasy
const DELAY_MS = 2000;
const DEFAULT_LIMIT = 50; // max listings to check per run

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const limitArg = args.find(a => a.startsWith('--limit'));
const LIMIT = limitArg ? parseInt(args[args.indexOf(limitArg) + 1]) : DEFAULT_LIMIT;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/**
 * Scrape a StreetEasy listing page for current data
 */
async function scrapeListing(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });

    if (res.status === 404 || res.status === 410) {
      return { available: false, reason: 'removed' };
    }

    if (res.status === 301 || res.status === 302) {
      return { available: false, reason: 'redirected' };
    }

    if (!res.ok) {
      return { error: `HTTP ${res.status}` };
    }

    const html = await res.text();

    // Check if listing is no longer available
    if (html.includes('This listing is no longer available') ||
        html.includes('listing has been removed') ||
        html.includes('no longer on the market')) {
      return { available: false, reason: 'delisted' };
    }

    // Check for rental status
    if (html.includes('Rented') || html.includes('Off Market')) {
      return { available: false, reason: 'rented' };
    }

    // Extract current price
    let price = null;
    const priceMatch = html.match(/\$([0-9,]+)\s*(?:\/mo|per month|base rent)/i) ||
                       html.match(/"price"\s*:\s*"?\$?([0-9,]+)"?/i) ||
                       html.match(/class="[^"]*price[^"]*"[^>]*>\s*\$([0-9,]+)/i);
    if (priceMatch) {
      price = parseInt(priceMatch[1].replace(/,/g, ''));
    }

    // Extract no-fee status
    const noFee = /no\s*fee/i.test(html);

    // Extract beds/baths from structured data
    const bedsMatch = html.match(/"numberOfBedrooms"\s*:\s*"?(\d+)"?/i) ||
                      html.match(/(\d+)\s*(?:Bed|BR)/i);
    const bathsMatch = html.match(/"numberOfBathroomsTotal"\s*:\s*"?(\d+)"?/i) ||
                       html.match(/(\d+)\s*(?:Bath|BA)/i);

    return {
      available: true,
      price,
      noFee,
      bedrooms: bedsMatch ? parseInt(bedsMatch[1]) : null,
      bathrooms: bathsMatch ? parseInt(bathsMatch[1]) : null,
    };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Record a change in D1
 */
async function recordChange(listingId, changeType, oldValue, newValue) {
  if (DRY_RUN) {
    console.log(`   [DRY RUN] Would record: ${changeType} ${oldValue} → ${newValue}`);
    return { id: 'dry-run' };
  }
  const res = await fetch(`${D1_API}/changes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ listing_id: listingId, change_type: changeType, old_value: String(oldValue), new_value: String(newValue) }),
  });
  return res.json();
}

/**
 * Update a listing in D1
 */
async function updateListing(id, updates) {
  if (DRY_RUN) return;
  await fetch(`${D1_API}/listings/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
}

async function main() {
  console.log('🔍 StreetEasy Listing Change Detector');
  console.log('======================================');
  if (DRY_RUN) console.log('🧪 DRY RUN — no changes will be saved\n');

  // Get active listings (not archived/removed)
  const res = await fetch(`${D1_API}/listings`);
  if (!res.ok) {
    console.error(`Failed to fetch listings: ${res.status}`);
    process.exit(1);
  }

  let listings = await res.json();
  
  // Filter to only active listings (not already marked as removed/rented)
  listings = listings.filter(l => !['removed', 'rented', 'delisted'].includes(l.status));
  
  // Sort by oldest checked first (prioritize stale data)
  listings.sort((a, b) => (a.last_checked_at || 0) - (b.last_checked_at || 0));
  
  // Limit
  listings = listings.slice(0, LIMIT);

  console.log(`Checking ${listings.length} active listings...\n`);

  const changes = [];
  let checked = 0, errors = 0;

  for (const listing of listings) {
    const shortUrl = listing.street_easy_url.replace('https://streeteasy.com/rental/', '#');
    process.stdout.write(`[${++checked}/${listings.length}] ${shortUrl} ($${listing.price}) `);

    const current = await scrapeListing(listing.street_easy_url);

    if (current.error) {
      console.log(`⚠️ ${current.error}`);
      errors++;
      await sleep(DELAY_MS);
      continue;
    }

    // ── Delisted / Rented ──
    if (current.available === false) {
      console.log(`🚫 ${current.reason}`);
      changes.push({ listing, type: current.reason, old: listing.status, new: current.reason });
      await recordChange(listing.id, current.reason, listing.status, current.reason);
      await updateListing(listing.id, { status: current.reason, last_checked_at: Math.floor(Date.now() / 1000) });
      await sleep(DELAY_MS);
      continue;
    }

    // ── Price change ──
    if (current.price && current.price !== listing.price) {
      const direction = current.price < listing.price ? 'price_drop' : 'price_increase';
      const diff = current.price - listing.price;
      const pct = ((diff / listing.price) * 100).toFixed(1);
      console.log(`💰 ${direction}: $${listing.price} → $${current.price} (${diff > 0 ? '+' : ''}${pct}%)`);
      changes.push({ listing, type: direction, old: listing.price, new: current.price, pct });
      await recordChange(listing.id, direction, String(listing.price), String(current.price));
      await updateListing(listing.id, {
        previous_price: listing.price,
        price: current.price,
        last_checked_at: Math.floor(Date.now() / 1000),
      });
      await sleep(DELAY_MS);
      continue;
    }

    // ── No-fee change ──
    if (current.noFee !== undefined && current.noFee !== Boolean(listing.no_fee)) {
      const changeType = current.noFee ? 'became_no_fee' : 'lost_no_fee';
      console.log(`🏷️ ${changeType}`);
      changes.push({ listing, type: changeType });
      await recordChange(listing.id, changeType, String(listing.no_fee), String(current.noFee ? 1 : 0));
      await updateListing(listing.id, { no_fee: current.noFee ? 1 : 0, last_checked_at: Math.floor(Date.now() / 1000) });
      await sleep(DELAY_MS);
      continue;
    }

    // No changes
    console.log('✓ no change');
    await updateListing(listing.id, { last_checked_at: Math.floor(Date.now() / 1000) });
    await sleep(DELAY_MS);
  }

  // ── Summary ──
  console.log('\n📊 Summary');
  console.log(`   Checked: ${checked}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Changes found: ${changes.length}`);

  if (changes.length > 0) {
    console.log('\n📋 Changes:');
    for (const c of changes) {
      const addr = c.listing.address || c.listing.neighborhood || c.listing.street_easy_url;
      if (c.type === 'price_drop') {
        console.log(`   💰 PRICE DROP: ${addr} — $${c.old} → $${c.new} (${c.pct}%)`);
      } else if (c.type === 'price_increase') {
        console.log(`   📈 Price up: ${addr} — $${c.old} → $${c.new} (${c.pct}%)`);
      } else if (c.type === 'rented' || c.type === 'delisted' || c.type === 'removed') {
        console.log(`   🚫 ${c.type.toUpperCase()}: ${addr}`);
      } else {
        console.log(`   🏷️ ${c.type}: ${addr}`);
      }
    }
  }

  console.log('\n✅ Done!');
  
  // Return changes for caller to use (e.g. for notifications)
  return changes;
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
