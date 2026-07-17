# Ashley 个人主页 + 项目展示站

> Cloudflare Pages + Pages Functions + D1 免费方案

## 目录结构

```
website-project/
├─ public/               # 静态前端（会被 CF Pages 直接托管）
│  ├─ index.html         # 首页（公开）
│  ├─ about.html         # 关于（公开）
│  ├─ login.html         # 登录
│  ├─ register.html      # 注册
│  ├─ projects.html      # 项目总览（登录后可见完整）
│  ├─ feedback.html      # Bug 反馈（需登录）
│  ├─ project/           # 三个项目详情页
│  │  ├─ accident-kg.html
│  │  ├─ elderly.html
│  │  └─ transport.html
│  ├─ apps/              # 三个项目的 mirror（下面会拷进来）
│  │  ├─ accident-kg/
│  │  ├─ elderly/
│  │  └─ transport/
│  ├─ css/style.css
│  └─ js/app.js
├─ functions/            # Cloudflare Pages Functions（后端）
│  └─ api/
│     ├─ register.js     # 注册
│     ├─ login.js        # 登录
│     ├─ me.js           # 拉取当前用户
│     ├─ logout.js
│     └─ feedback.js     # Bug 反馈提交/列表
├─ mirror/               # 三个项目的原始副本（源文件复制，不修改本地原文件）
├─ scripts/
│  ├─ init-db.sql        # D1 数据库建表
│  └─ deploy.sh          # 部署脚本
└─ wrangler.toml         # Cloudflare 配置

```

## 部署步骤（等 Cloudflare 账号就绪后）

1. `npm install -g wrangler`
2. `wrangler login`（浏览器授权一次）
3. `wrangler d1 create ashley-site` → 拿到 database_id 填进 wrangler.toml
4. `wrangler d1 execute ashley-site --file=scripts/init-db.sql` 建表
5. `wrangler pages deploy public --project-name=ashley-site`
6. 拿到 `https://ashley-site.pages.dev`

首次部署完自动创建 admin/123456 账号。
