#!/bin/bash
# StreetEasy Monitor — quick health check
# Usage: ./health-check.sh

API="https://streeteasy-monitor.arushshankar.workers.dev"

echo "=== StreetEasy Monitor Health Check ==="
echo ""

# 1. Worker health
echo -n "Worker:    "
health=$(curl -sS --max-time 5 "$API/health" 2>&1)
if echo "$health" | grep -q '"ok"'; then
  echo "✅ UP"
else
  echo "❌ DOWN — $health"
fi

# 2. Listing count
echo -n "Listings:  "
count=$(curl -sS --max-time 10 "$API/listings" 2>&1 | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null)
if [ -n "$count" ]; then
  echo "$count total"
else
  echo "❌ Failed to query"
fi

# 3. Latest listing
echo -n "Latest:    "
latest=$(curl -sS --max-time 10 "$API/listings" 2>&1 | python3 -c "
import sys, json, datetime
d = json.load(sys.stdin)
if d:
    ts = d[0].get('found_at', d[0].get('created_at', 0))
    dt = datetime.datetime.fromtimestamp(ts, tz=datetime.timezone.utc)
    age = (datetime.datetime.now(tz=datetime.timezone.utc) - dt).days
    print(f'{dt.strftime(\"%Y-%m-%d %H:%M UTC\")} ({age}d ago)')
else:
    print('No listings')
" 2>/dev/null)
echo "${latest:-❌ Failed}"

echo ""
echo "Dashboard: https://streeteasy-monitor.pages.dev"
echo "API:       $API"
