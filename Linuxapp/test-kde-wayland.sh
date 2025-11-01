#!/bin/bash
echo "Testing KDE Wayland window detection methods..."
echo ""

# Test 1: Check if qdbus is available
echo "1. Checking qdbus availability:"
if command -v qdbus >/dev/null 2>&1; then
    echo "   ✓ qdbus found"
else
    echo "   ✗ qdbus not found"
    exit 1
fi

# Test 2: List KWin D-Bus services
echo ""
echo "2. Available KWin D-Bus services:"
qdbus org.kde.KWin 2>/dev/null | grep -i window | head -10

# Test 3: Check for active window methods
echo ""
echo "3. Checking KWin scripting API:"
qdbus org.kde.KWin /Scripting 2>/dev/null

# Test 4: Try to get active window using KWin scripting
echo ""
echo "4. Testing KWin scripting for active window:"
# KWin uses a scripting engine, we need to load a script

# Test 5: Alternative - use xprop on XWayland
echo ""
echo "5. Alternative methods:"
echo "   - Check if running on XWayland"
echo "   WAYLAND_DISPLAY: ${WAYLAND_DISPLAY}"
echo "   DISPLAY: ${DISPLAY}"

echo ""
echo "Recommended approach for KDE Wayland:"
echo "KDE on Wayland doesn't provide easy access to active window info"
echo "You may need to use KWin scripts or XWayland compatibility"
