#!/bin/bash

echo "🔍 Content Publisher Environment Check"
echo "===================================="
echo ""

# Check 1: Bun
echo "📦 Checking Bun..."
if command -v bun &> /dev/null; then
    BUN_VERSION=$(bun --version)
    echo "   ✅ Bun installed: v$BUN_VERSION"
else
    echo "   ❌ Bun not found"
    echo "   → Install: curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

# Check 2: Chrome Debug Port
echo ""
echo "🌐 Checking Chrome Debug Port..."
if lsof -i :9222 &> /dev/null; then
    echo "   ✅ Chrome debug port (9222) is open"
else
    echo "   ⚠️  Chrome debug port not detected"
    echo "   → Chrome 144+ 需要非默认 user-data-dir 才能绑定调试端口"
    echo "   → 启动命令："
    echo "     /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222 --user-data-dir=\"\$HOME/chrome-debug-profile\" &"
    echo "   → 注意：必须先完全退出 Chrome（Cmd+Q），再用上述命令启动"
fi

# Check 3: Core Scripts
echo ""
echo "📚 Checking Core Scripts..."
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CORE_SCRIPTS=(
    "scripts/publish-wechat.ts"
    "scripts/format-wechat.ts"
    "scripts/gemini-image-gen.ts"
    "scripts/cdp.ts"
    "scripts/generate-layout-themes.ts"
    "scripts/simple-md-to-html.ts"
)

for script in "${CORE_SCRIPTS[@]}"; do
    if [ -f "$PROJECT_DIR/$script" ]; then
        echo "   ✅ $script"
    else
        echo "   ❌ $script missing"
    fi
done

# Check 4: Git
echo ""
echo "🔧 Checking Git..."
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    echo "   ✅ $GIT_VERSION"
else
    echo "   ❌ Git not found"
    echo "   → Install via Xcode Command Line Tools or https://git-scm.com/"
fi

# Check 5: yt-dlp (Optional)
echo ""
echo "🎬 Checking yt-dlp (optional)..."
if command -v yt-dlp &> /dev/null; then
    YTDLP_VERSION=$(yt-dlp --version)
    echo "   ✅ yt-dlp installed: v$YTDLP_VERSION"
else
    echo "   ⚠️  yt-dlp not found (optional, for YouTube subtitle extraction)"
    echo "   → Install: brew install yt-dlp"
fi

# Check 6: npm Dependencies
echo ""
echo "📦 Checking npm dependencies..."
REQUIRED_MODULES=("front-matter" "highlight.js" "reading-time" "markdown-it" "fflate" "katex" "marked")
MISSING_MODULES=()

for mod in "${REQUIRED_MODULES[@]}"; do
    if [ -d "$PROJECT_DIR/node_modules/$mod" ]; then
        echo "   ✅ $mod"
    else
        echo "   ❌ $mod missing"
        MISSING_MODULES+=("$mod")
    fi
done

if [ ${#MISSING_MODULES[@]} -gt 0 ]; then
    echo ""
    echo "   ⚠️  Missing npm dependencies! Run:"
    echo "   → cd $PROJECT_DIR && bun install"
fi

# Check 7: Project Structure
echo ""
echo "📁 Checking Project Structure..."
REQUIRED_FILES=("SKILL.md" "README.md" "scripts/format-wechat.ts" "scripts/setup.sh")
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$PROJECT_DIR/$file" ]; then
        echo "   ✅ $file"
    else
        echo "   ❌ $file missing"
    fi
done

# Check 8: WeChat Config
echo ""
echo "🔑 Checking WeChat Config..."
if [ -f "$HOME/.content-publisher/.env" ]; then
    if grep -q "WECHAT_APP_ID" "$HOME/.content-publisher/.env"; then
        echo "   ✅ ~/.content-publisher/.env has WECHAT_APP_ID"
    else
        echo "   ⚠️  ~/.content-publisher/.env exists but missing WECHAT_APP_ID"
    fi
else
    echo "   ⚠️  ~/.content-publisher/.env not found"
    echo "   → Create with WECHAT_APP_ID and WECHAT_APP_SECRET"
fi

echo ""
echo "===================================="
echo "✅ Environment check complete!"
echo ""
echo "💡 Next steps:"
echo "   1. If Chrome port is closed, run: chrome-debug"
echo "   2. Login to WeChat Official Accounts Platform"
echo "   3. Test with: publish article.md"
