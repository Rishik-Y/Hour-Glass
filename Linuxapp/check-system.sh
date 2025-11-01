#!/bin/bash
# System compatibility checker for Hour-Glass Linux app

echo "==================================="
echo "Hour-Glass Linux Compatibility Check"
echo "==================================="
echo ""

# Check display server
echo "1. Display Server:"
if [ -n "$WAYLAND_DISPLAY" ]; then
    echo "   ✓ Wayland detected"
    DISPLAY_SERVER="wayland"
elif [ -n "$DISPLAY" ]; then
    echo "   ✓ X11 detected"
    DISPLAY_SERVER="x11"
else
    echo "   ✗ No display server detected (headless?)"
    DISPLAY_SERVER="none"
fi
echo "   Session type: ${XDG_SESSION_TYPE:-unknown}"
echo ""

# Check Node.js
echo "2. Node.js:"
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    echo "   ✓ Node.js installed: $NODE_VERSION"
    
    # Check if version is >= 18
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_MAJOR" -ge 18 ]; then
        echo "   ✓ Version is sufficient (>= v18)"
    else
        echo "   ✗ Version is too old (need >= v18)"
    fi
else
    echo "   ✗ Node.js not installed"
fi
echo ""

# Check npm
echo "3. npm:"
if command -v npm >/dev/null 2>&1; then
    NPM_VERSION=$(npm --version)
    echo "   ✓ npm installed: v$NPM_VERSION"
else
    echo "   ✗ npm not installed"
fi
echo ""

# Check X11 tools
echo "4. X11 Window Detection Tools:"
if command -v xdotool >/dev/null 2>&1; then
    echo "   ✓ xdotool installed"
else
    echo "   ✗ xdotool not installed (install: sudo apt install xdotool)"
fi

if command -v wmctrl >/dev/null 2>&1; then
    echo "   ✓ wmctrl installed"
else
    echo "   ✗ wmctrl not installed (install: sudo apt install wmctrl)"
fi
echo ""

# Check Wayland tools
echo "5. Wayland/Desktop Environment Tools:"
if command -v gdbus >/dev/null 2>&1; then
    echo "   ✓ gdbus available (GNOME Shell support)"
else
    echo "   ✗ gdbus not available"
fi

if command -v qdbus >/dev/null 2>&1; then
    echo "   ✓ qdbus available (KDE Plasma support)"
else
    echo "   ✗ qdbus not available"
fi
echo ""

# Check build tools
echo "6. Build Tools (for native addon):"
if command -v gcc >/dev/null 2>&1; then
    echo "   ✓ gcc installed"
else
    echo "   ✗ gcc not installed (install: sudo apt install build-essential)"
fi

if command -v g++ >/dev/null 2>&1; then
    echo "   ✓ g++ installed"
else
    echo "   ✗ g++ not installed (install: sudo apt install build-essential)"
fi

if command -v make >/dev/null 2>&1; then
    echo "   ✓ make installed"
else
    echo "   ✗ make not installed (install: sudo apt install build-essential)"
fi

if command -v python3 >/dev/null 2>&1; then
    echo "   ✓ python3 installed"
else
    echo "   ✗ python3 not installed (install: sudo apt install python3)"
fi
echo ""

# Summary
echo "==================================="
echo "Summary:"
echo "==================================="

READY=true

if [ "$DISPLAY_SERVER" = "none" ]; then
    echo "✗ No display server detected - app requires X11 or Wayland"
    READY=false
fi

if ! command -v node >/dev/null 2>&1; then
    echo "✗ Node.js is required"
    READY=false
fi

if [ "$DISPLAY_SERVER" = "x11" ] && ! command -v xdotool >/dev/null 2>&1 && ! command -v wmctrl >/dev/null 2>&1; then
    echo "⚠ X11 detected but no window detection tools installed"
    echo "  Install at least one: sudo apt install xdotool wmctrl"
    READY=false
fi

if [ "$DISPLAY_SERVER" = "wayland" ] && ! command -v gdbus >/dev/null 2>&1 && ! command -v qdbus >/dev/null 2>&1; then
    echo "⚠ Wayland detected but no desktop environment tools found"
    echo "  This may work depending on your compositor"
fi

if ! command -v gcc >/dev/null 2>&1 || ! command -v g++ >/dev/null 2>&1; then
    echo "⚠ Build tools not installed - native addon won't compile"
    echo "  App will still work using command-line tools"
    echo "  To install: sudo apt install build-essential python3"
fi

echo ""
if [ "$READY" = true ]; then
    echo "✓ System appears ready for Hour-Glass Linux app!"
    echo ""
    echo "Next steps:"
    echo "  1. npm install"
    echo "  2. npm run dev"
else
    echo "✗ System needs additional setup (see messages above)"
fi
echo ""
