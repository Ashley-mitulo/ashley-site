#!/bin/bash
# Ashley 个人站 - 部署脚本
# 用法：bash scripts/deploy.sh

set -e
cd "$(dirname "$0")/.."

echo "==========================================="
echo "  Ashley Lab · Cloudflare Pages 部署脚本"
echo "==========================================="
echo ""

# 1. 检查 wrangler
if ! command -v wrangler &> /dev/null; then
  echo "❌ wrangler 未安装，正在安装..."
  npm install -g wrangler
fi
echo "✅ wrangler: $(wrangler --version)"
echo ""

# 2. 登录检查
echo "📌 请确保已 wrangler login（浏览器授权）"
wrangler whoami || {
  echo "运行: wrangler login"
  exit 1
}
echo ""

# 3. 创建 D1 数据库（如果没有）
if grep -q "PLACEHOLDER_FILL_AFTER_CREATE" wrangler.toml; then
  echo "🗄️  首次部署：创建 D1 数据库..."
  DB_OUT=$(wrangler d1 create ashley-site 2>&1) || true
  echo "$DB_OUT"
  DB_ID=$(echo "$DB_OUT" | grep -oE '"[a-f0-9-]{36}"' | head -1 | tr -d '"')
  if [ -n "$DB_ID" ]; then
    sed -i "s/PLACEHOLDER_FILL_AFTER_CREATE/$DB_ID/" wrangler.toml
    echo "✅ 数据库 ID: $DB_ID 已写入 wrangler.toml"
  else
    echo "⚠️ 无法自动获取 database_id，请手动填到 wrangler.toml"
    exit 1
  fi

  echo "🗄️  初始化数据表..."
  wrangler d1 execute ashley-site --file=scripts/init-db.sql --remote
fi
echo ""

# 4. 部署
echo "🚀 部署到 Cloudflare Pages..."
wrangler pages deploy public --project-name=ashley-site --commit-dirty=true

echo ""
echo "✅ 部署完成！访问：https://ashley-site.pages.dev"
echo "💡 预设账号：admin / 123456"
