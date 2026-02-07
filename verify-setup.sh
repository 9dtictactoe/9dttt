#!/bin/bash

# Deployment Verification Script
# Run this to verify your full-stack setup is ready

echo "🚀 9DTTT Full-Stack Verification"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

passed=0
failed=0

# Test 1: Check Node.js
echo -n "✓ Node.js installed... "
if command -v node &> /dev/null; then
    version=$(node --version)
    echo -e "${GREEN}✓ $version${NC}"
    ((passed++))
else
    echo -e "${RED}✗ Not found${NC}"
    ((failed++))
fi

# Test 2: Check npm packages
echo -n "✓ Dependencies installed... "
if [ -d "node_modules" ]; then
    count=$(ls node_modules | wc -l)
    echo -e "${GREEN}✓ $count packages${NC}"
    ((passed++))
else
    echo -e "${RED}✗ Run 'npm install'${NC}"
    ((failed++))
fi

# Test 3: Check API files
echo -n "✓ API endpoints created... "
api_count=$(find ./api -name "*.js" 2>/dev/null | wc -l)
if [ $api_count -ge 6 ]; then
    echo -e "${GREEN}✓ $api_count files${NC}"
    ((passed++))
else
    echo -e "${RED}✗ Missing API files${NC}"
    ((failed++))
fi

# Test 4: Check enhanced game
echo -n "✓ Enhanced Crypto Quest... "
if [ -f "Public/js/crypto-quest-enhanced.js" ]; then
    lines=$(wc -l < Public/js/crypto-quest-enhanced.js)
    echo -e "${GREEN}✓ $lines lines${NC}"
    ((passed++))
else
    echo -e "${RED}✗ File not found${NC}"
    ((failed++))
fi

# Test 5: Check admin dashboard
echo -n "✓ Admin dashboard... "
if [ -f "Public/admin.html" ]; then
    echo -e "${GREEN}✓ Found${NC}"
    ((passed++))
else
    echo -e "${RED}✗ Not found${NC}"
    ((failed++))
fi

# Test 6: Check Vercel config
echo -n "✓ Vercel configuration... "
if [ -f "vercel.json" ]; then
    echo -e "${GREEN}✓ Found${NC}"
    ((passed++))
else
    echo -e "${RED}✗ Not found${NC}"
    ((failed++))
fi

# Test 7: Check package.json version
echo -n "✓ Package version... "
if grep -q '"version": "2.0.0"' package.json; then
    echo -e "${GREEN}✓ 2.0.0${NC}"
    ((passed++))
else
    echo -e "${YELLOW}⚠ Not updated${NC}"
    ((failed++))
fi

# Test 8: Check environment example
echo -n "✓ Environment template... "
if [ -f ".env.example" ]; then
    echo -e "${GREEN}✓ Found${NC}"
    ((passed++))
else
    echo -e "${RED}✗ Not found${NC}"
    ((failed++))
fi

# Test 9: Test health endpoint (if server is running)
echo -n "✓ API health check... "
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Server responding${NC}"
    ((passed++))
else
    echo -e "${YELLOW}⚠ Server not running (run 'npm run dev')${NC}"
fi

# Test 10: Check documentation
echo -n "✓ Documentation files... "
doc_count=0
[ -f "DEPLOYMENT_GUIDE.md" ] && ((doc_count++))
[ -f "README_DEPLOYMENT.md" ] && ((doc_count++))
[ -f "TRANSFORMATION_SUMMARY.md" ] && ((doc_count++))
if [ $doc_count -ge 3 ]; then
    echo -e "${GREEN}✓ $doc_count files${NC}"
    ((passed++))
else
    echo -e "${YELLOW}⚠ Some docs missing${NC}"
fi

echo ""
echo "================================"
echo -e "Results: ${GREEN}$passed passed${NC} | ${RED}$failed failed${NC}"
echo ""

if [ $passed -ge 8 ]; then
    echo -e "${GREEN}🎉 Ready for deployment!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. npm run dev          → Test locally"
    echo "  2. vercel login         → Login to Vercel"
    echo "  3. vercel --prod        → Deploy!"
    echo ""
    exit 0
else
    echo -e "${RED}⚠️  Setup incomplete${NC}"
    echo ""
    echo "Run these commands:"
    [ ! -d "node_modules" ] && echo "  npm install"
    [ ! -f ".env" ] && echo "  cp .env.example .env"
    echo ""
    exit 1
fi
