#!/bin/bash

# Maintenance Mode Debug Script
# Run this to diagnose why users can still login during maintenance

echo "=== Maintenance Mode Debug ==="
echo ""

API_BASE="http://localhost:5000/api"

# Step 1: Check debug endpoint
echo "1. Checking actual database values:"
echo "   GET /debug/maintenance-value"
curl -s "$API_BASE/debug/maintenance-value" | jq '.'
echo ""

# Step 2: Check system status endpoint
echo "2. Checking system status endpoint:"
echo "   GET /public/system-status"
curl -s "$API_BASE/public/system-status" | jq '.'
echo ""

# Step 3: Try normal user login
echo "3. Attempting normal user login:"
echo "   POST /auth/login"
echo "   Email: student@example.com"
curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com","password":"Password123"}' | jq '.'
echo ""

# Step 4: Try admin login
echo "4. Attempting admin login:"
echo "   POST /auth/login"
echo "   Email: admin@moneytransfer.com"
curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@moneytransfer.com","password":"Admin@123"}' | jq '.'
echo ""

echo "=== Check your server logs for [Login] messages ==="
