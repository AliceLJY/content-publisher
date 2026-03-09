#!/bin/bash

echo "🚀 Content Publisher Setup Wizard"
echo "================================"
echo ""

# Step 1: Check if Bun is installed
echo "Step 1: Checking Bun..."
if ! command -v bun &> /dev/null; then
    echo "   Bun not found. Installing..."
    curl -fsSL https://bun.sh/install | bash
    echo "   ✅ Bun installed"
    echo "   ⚠️  Please restart your terminal and run this script again"
    exit 0
else
    echo "   ✅ Bun already installed"
fi

# Step 2: Install npm dependencies
echo ""
echo "Step 2: Installing dependencies..."
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"
bun install
echo "   ✅ Dependencies installed"

# Step 3: Setup Chrome alias
echo ""
echo "Step 3: Setting up Chrome debug alias..."
SHELL_RC="$HOME/.zshrc"
if [ -n "$BASH_VERSION" ]; then
    SHELL_RC="$HOME/.bashrc"
fi

ALIAS_LINE='alias chrome-debug="/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222 --user-data-dir=\"\$HOME/chrome-debug-profile\" &"'

if grep -q "chrome-debug" "$SHELL_RC"; then
    echo "   ✅ Alias already exists in $SHELL_RC"
else
    echo "   Add this line to $SHELL_RC if you need Chrome debug mode:"
    echo "   $ALIAS_LINE"
fi

# Step 4: Create directories
echo ""
echo "Step 4: Creating work directories..."
mkdir -p scripts/themes
echo "   ✅ Directories created"

# Step 5: Create config template
echo ""
echo "Step 5: Checking WeChat config..."
if [ ! -f "$HOME/.content-publisher/.env" ]; then
    mkdir -p "$HOME/.content-publisher"
    echo "# WeChat Official Account API credentials" > "$HOME/.content-publisher/.env"
    echo "WECHAT_APP_ID=" >> "$HOME/.content-publisher/.env"
    echo "WECHAT_APP_SECRET=" >> "$HOME/.content-publisher/.env"
    echo "GOOGLE_API_KEY=" >> "$HOME/.content-publisher/.env"
    echo "   ⚠️  Created ~/.content-publisher/.env — please fill in your credentials"
else
    echo "   ✅ Config file exists"
fi

echo ""
echo "================================"
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Fill in ~/.content-publisher/.env with your credentials"
echo "   2. Restart terminal (or run: source $SHELL_RC)"
echo "   3. Run: chrome-debug"
echo "   4. Login to WeChat Official Accounts Platform"
echo "   5. Test: ./scripts/doctor.sh"
