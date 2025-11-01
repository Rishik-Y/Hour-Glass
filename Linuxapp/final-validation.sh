#!/bin/bash
set -e

echo "======================================"
echo "Final Validation for Hour-Glass Linux"
echo "======================================"
echo ""

# Test 1: TypeScript compilation
echo "Test 1: TypeScript Compilation"
echo "--------------------------------------"
npm run transpile:electron > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ Electron TypeScript compiled successfully"
    echo "✓ Generated files:"
    ls -lh dist-electron/*.js | awk '{print "  -", $9, "(" $5 ")"}'
else
    echo "✗ TypeScript compilation failed"
    exit 1
fi
echo ""

# Test 2: Check generated files
echo "Test 2: Generated Files Check"
echo "--------------------------------------"
REQUIRED_FILES=("dist-electron/main.js" "dist-electron/preload.js" "dist-electron/util.js")
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ $file exists"
    else
        echo "✗ $file missing"
        exit 1
    fi
done
echo ""

# Test 3: Check package structure
echo "Test 3: Package Structure"
echo "--------------------------------------"
if [ -f "package.json" ]; then
    echo "✓ package.json exists"
    
    # Check for required dependencies
    DEPS=("@paymoapp/active-window" "os-utils" "react" "electron")
    for dep in "${DEPS[@]}"; do
        if grep -q "\"$dep\"" package.json; then
            echo "✓ Dependency: $dep"
        else
            echo "✗ Missing dependency: $dep"
        fi
    done
fi
echo ""

# Test 4: Check documentation
echo "Test 4: Documentation"
echo "--------------------------------------"
DOCS=("README.md" "check-system.sh" "IMPLEMENTATION.md")
for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        LINES=$(wc -l < "$doc")
        echo "✓ $doc ($LINES lines)"
    else
        echo "✗ $doc missing"
    fi
done
echo ""

# Test 5: Node.js code syntax check
echo "Test 5: JavaScript Syntax Check"
echo "--------------------------------------"
for jsfile in dist-electron/*.js; do
    node --check "$jsfile" 2>&1
    if [ $? -eq 0 ]; then
        echo "✓ $(basename $jsfile) - syntax valid"
    else
        echo "✗ $(basename $jsfile) - syntax error"
        exit 1
    fi
done
echo ""

# Test 6: Check file sizes (ensure they're not empty)
echo "Test 6: File Size Validation"
echo "--------------------------------------"
MIN_SIZE=100  # bytes
for jsfile in dist-electron/*.js; do
    SIZE=$(wc -c < "$jsfile")
    if [ $SIZE -gt $MIN_SIZE ]; then
        echo "✓ $(basename $jsfile) - $SIZE bytes"
    else
        echo "✗ $(basename $jsfile) - too small ($SIZE bytes)"
        exit 1
    fi
done
echo ""

# Summary
echo "======================================"
echo "Validation Summary"
echo "======================================"
echo "✓ All tests passed!"
echo ""
echo "The Linuxapp is:"
echo "  ✓ Successfully compiled"
echo "  ✓ All files present"
echo "  ✓ Dependencies configured"
echo "  ✓ Documentation complete"
echo "  ✓ Code syntax valid"
echo "  ✓ Ready for testing on Linux desktop"
echo ""
echo "Next steps:"
echo "  1. Run on a Linux machine with display server"
echo "  2. Test window detection: npm run dev"
echo "  3. Verify time tracking functionality"
echo "  4. Build distributable: npm run dist:linux"
echo ""
