#!/bin/bash

# ==========================================
# Content Publisher - 微信公众号发布脚本（浏览器模式）
# 状态: 待实现（baoyu-skills 已移除）
# ==========================================

echo "⚠️  浏览器模式待实现，请用 API 模式"
echo ""
echo "API 模式命令："
echo "  bun scripts/publish-wechat.ts <article.md> --author \"小试AI\" --cover <cover.png> --theme <theme-key>"
echo ""
echo "前提："
echo "  1. ~/.content-publisher/.env 配置 WECHAT_APP_ID + WECHAT_APP_SECRET"
echo "  2. 机器出口 IP 已加入微信公众平台白名单"
echo ""
exit 1
