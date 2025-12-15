#!/bin/bash
# Test script for OAuth endpoints

BASE_URL="http://localhost:3000"

echo "🧪 Testing OAuth Endpoints"
echo "=========================="
echo ""

# Test 1: Google OAuth Initiation
echo "1️⃣  Testing Google OAuth Initiation..."
REDIRECT_URI="http://localhost:5173/auth/callback"
STATE="test-state-123"

RESPONSE=$(curl -s "${BASE_URL}/auth/google/login?redirectUri=${REDIRECT_URI}&state=${STATE}")
echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q "authorizationUrl"; then
    echo "✅ Google OAuth initiation endpoint working"
    AUTH_URL=$(echo "$RESPONSE" | grep -o '"authorizationUrl":"[^"]*"' | cut -d'"' -f4)
    echo "   Authorization URL: $AUTH_URL"
else
    echo "❌ Google OAuth initiation failed"
fi

echo ""

# Test 2: Discord OAuth Initiation
echo "2️⃣  Testing Discord OAuth Initiation..."
RESPONSE=$(curl -s "${BASE_URL}/auth/discord/login?redirectUri=${REDIRECT_URI}&state=${STATE}")
echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q "authorizationUrl"; then
    echo "✅ Discord OAuth initiation endpoint working"
    AUTH_URL=$(echo "$RESPONSE" | grep -o '"authorizationUrl":"[^"]*"' | cut -d'"' -f4)
    echo "   Authorization URL: $AUTH_URL"
else
    echo "❌ Discord OAuth initiation failed"
fi

echo ""
echo "ℹ️  To test the full OAuth flow:"
echo "   1. Copy one of the authorization URLs above"
echo "   2. Open it in your browser"
echo "   3. Complete the OAuth flow"
echo "   4. You'll see the callback page with postMessage"
echo ""
echo "📝 Check backend logs for detailed information"
