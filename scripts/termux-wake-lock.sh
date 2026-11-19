#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# PocketDev Server - Wake Lock & ColorOS Background Whitelist Helper
# ==============================================================================

if command -v termux-wake-lock >/dev/null 2>&1; then
    termux-wake-lock
    echo "[OK] Termux CPU wake lock acquired."
else
    echo "[!] termux-wake-lock command not found."
fi

echo ""
echo "=== OPPO Reno2 F (ColorOS) Background Checklist ==="
echo "1. Go to: Settings > Battery > App Battery Management > Termux"
echo "   - Enable 'Allow Background Activity'"
echo "   - Enable 'Allow Auto-startup'"
echo "2. Lock Termux in Recent Tasks:"
echo "   - Swipe up to open Recent Tasks"
echo "   - Tap the two dots menu above Termux"
echo "   - Select 'Lock'"
echo "3. In Developer Options (Optional):"
echo "   - Enable 'Keep screen awake while charging' if kept permanently plugged in"
echo "==================================================="
