#!/bin/bash
# Acceptance tests for Worker API
# Usage: ./scripts/acceptance-test.sh [BASE_URL]
# Example: ./scripts/acceptance-test.sh http://127.0.0.1:8787
# Or after deploy: ./scripts/acceptance-test.sh https://bazi-api.<account>.workers.dev

BASE="${1:-http://127.0.0.1:8787}"
FAIL=0

echo "=== Testing $BASE ==="

# 1. GET /content/2026?locale=en returns English JSON
echo ""
echo "[1] GET /content/2026?locale=en"
R=$(curl -s "$BASE/content/2026?locale=en")
if echo "$R" | grep -q '"ok":true' && echo "$R" | grep -q '"localeUsed":"en"' && echo "$R" | grep -q '"emperor"'; then
  echo "  PASS: ok, localeUsed=en, stars use en keys (emperor)"
else
  echo "  FAIL"
  echo "$R" | head -3
  FAIL=1
fi

# 2. GET /content/2026?locale=zh-TW returns zh-TW content
echo ""
echo "[2] GET /content/2026?locale=zh-TW"
R=$(curl -s "$BASE/content/2026?locale=zh-TW")
if echo "$R" | grep -q '"ok":true' && echo "$R" | grep -q '"命宮"' && echo "$R" | grep -q '"紫微"'; then
  echo "  PASS: ok, palaces/stars in Chinese"
else
  echo "  FAIL"
  echo "$R" | head -3
  FAIL=1
fi

# 3. POST /compute/all zh-TW: mainStars values are traditional Chinese star names
echo ""
echo "[3] POST /compute/all (language=zh-TW)"
R=$(curl -s -X POST "$BASE/compute/all" -H "Content-Type: application/json" \
  -d '{"year":1990,"month":8,"day":16,"hour":12,"minute":0,"gender":"M","language":"zh-TW"}')
if echo "$R" | grep -q '"ok":true' && echo "$R" | grep -q '"命宮"' && (echo "$R" | grep -q '紫微\|天機\|太陽\|武曲'); then
  echo "  PASS: mainStars keys Chinese, values Chinese star names"
else
  echo "  FAIL"
  echo "$R" | head -5
  FAIL=1
fi

# 4. POST /compute/all en-US: mainStars values are en keys, palace keys remain Chinese
echo ""
echo "[4] POST /compute/all (language=en-US)"
R=$(curl -s -X POST "$BASE/compute/all" -H "Content-Type: application/json" \
  -d '{"year":1990,"month":8,"day":16,"hour":12,"minute":0,"gender":"M","language":"en-US"}')
if echo "$R" | grep -q '"ok":true' && echo "$R" | grep -q '"命宮"' && (echo "$R" | grep -q 'emperor\|advisor\|sun\|general'); then
  echo "  PASS: mainStars keys Chinese, values en keys"
else
  echo "  FAIL"
  echo "$R" | head -5
  FAIL=1
fi

# 5. CORS
echo ""
echo "[5] OPTIONS (CORS)"
R=$(curl -s -X OPTIONS "$BASE/compute/all" -I 2>/dev/null | head -10)
if echo "$R" | grep -qi "Access-Control-Allow-Origin"; then
  echo "  PASS: CORS headers present"
else
  echo "  FAIL"
  FAIL=1
fi

echo ""
if [ $FAIL -eq 0 ]; then
  echo "All tests passed."
else
  echo "Some tests failed."
  exit 1
fi
