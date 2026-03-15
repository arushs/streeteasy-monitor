#!/bin/bash
# StreetEasy Monitor — health check
API="https://streeteasy-monitor.arushshankar.workers.dev"

echo "=== StreetEasy Monitor Health Check ==="
echo ""

# Worker health
echo -n "Worker:    "
health=$(curl -sS --max-time 5 "$API/health" 2>&1)
if echo "$health" | grep -q '"ok"'; then
  echo "✅ UP"
else
  echo "❌ DOWN — $health"
fi

# Listing count + latest
echo -n "Listings:  "
curl -sS --max-time 10 "$API/listings" 2>&1 | python3 -c "
import sys, json, datetime
d = json.load(sys.stdin)
print(f'{len(d)} total')
if d:
    ts = d[0].get('found_at', d[0].get('created_at', 0))
    dt = datetime.datetime.fromtimestamp(ts, tz=datetime.timezone.utc)
    age = (datetime.datetime.now(tz=datetime.timezone.utc) - dt).days
    print(f'Latest:    {dt.strftime(\"%Y-%m-%d %H:%M UTC\")} ({age}d ago)')
    active = sum(1 for l in d if l.get('status') not in ('rented','delisted','removed'))
    print(f'Active:    {active} (not rented/delisted)')
" 2>/dev/null

# Changes
echo -n "Changes:   "
curl -sS --max-time 5 "$API/changes/summary" 2>&1 | python3 -c "
import sys, json
d = json.load(sys.stdin)
changes = d.get('changes', [])
unread = d.get('unread', 0)
if changes:
    parts = [f'{c[\"count\"]} {c[\"change_type\"]}' for c in changes]
    print(f'{\" | \".join(parts)} ({unread} unread)')
else:
    print('No recent changes')
" 2>/dev/null

# Email inbox
echo -n "Inbox:     "
AGENTMAIL_KEY=$(grep AGENTMAIL_API_KEY ~/.openclaw/workspace/secrets/agentmail.env 2>/dev/null | head -1 | sed 's/.*=["]*//;s/["]*$//')
if [ -n "$AGENTMAIL_KEY" ]; then
  count=$(curl -sS --max-time 5 "https://api.agentmail.to/v0/inboxes/listings@agentmail.to/threads?limit=1" \
    -H "Authorization: Bearer $AGENTMAIL_KEY" 2>&1 | python3 -c "import sys,json; print(json.load(sys.stdin).get('count',0))" 2>/dev/null)
  if [ "$count" = "0" ]; then
    echo "📭 Empty — StreetEasy alerts may need re-enabling"
  else
    echo "📬 $count thread(s)"
  fi
else
  echo "⚠️ No AgentMail API key found"
fi

echo ""
echo "Dashboard: https://streeteasy-monitor.pages.dev"
echo "API:       $API"
