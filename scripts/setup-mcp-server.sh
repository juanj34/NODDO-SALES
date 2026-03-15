#!/bin/bash

# Setup script for NODDO MCP Server
# This makes Hugo AI integration super easy

set -e

echo "🚀 NODDO MCP Server Setup"
echo "=========================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: Run this script from the NODDO root directory"
  exit 1
fi

# Step 1: Install MCP server dependencies
echo "📦 Installing MCP server dependencies..."
cd mcp-server
npm install
cd ..

# Step 2: Copy environment variables
echo "🔧 Configurando variables de entorno..."

if [ ! -f ".env.local" ]; then
  echo "❌ Error: .env.local not found in root directory"
  exit 1
fi

# Extract Supabase credentials from root .env.local
SUPABASE_URL=$(grep "NEXT_PUBLIC_SUPABASE_URL=" .env.local | cut -d '=' -f2)
SUPABASE_SERVICE_KEY=$(grep "SUPABASE_SERVICE_ROLE_KEY=" .env.local | cut -d '=' -f2)

# Create mcp-server/.env
cat > mcp-server/.env << EOF
# Supabase credentials (copied from root .env.local)
NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_KEY}

# MCP Server Port (optional, for HTTP mode)
MCP_PORT=3001
EOF

echo "✅ Environment variables configured"

# Step 3: Build the MCP server
echo "🔨 Building MCP server..."
cd mcp-server
npm run build
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Start the MCP server:"
echo "   cd mcp-server && npm run dev"
echo ""
echo "2. In another terminal, create a public tunnel:"
echo "   npx cloudflared tunnel --url http://localhost:3001"
echo ""
echo "3. Copy the tunnel URL (https://xxx.trycloudflare.com)"
echo ""
echo "4. Configure in Hugo:"
echo "   Crisp → AI Agent → Automate → MCP & Integrations"
echo "   → External MCP servers → Paste URL"
echo ""
echo "🎉 Hugo will now have access to NODDO data in real-time!"
