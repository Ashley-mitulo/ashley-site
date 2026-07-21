# 🚀 Cloudflare Tunnel 零成本 AI 接入指南

## 方案概述

**问题**：Cloudflare Pages 是纯静态的，跑不了后端 AI API（accident-kg v3.5.1 / transport v2.0）。

**解决**：
1. 你本地启动后端（3003 / 3009 端口）
2. 用 **Cloudflare Quick Tunnel**（免费！）把本地端口暴露为公网临时 URL
3. Pages Functions + KV 存储隧道地址，前端自动发现并转发请求
4. 隧道关了自动降级到静态展示，零感知切换

**成本**：0 元 ✅
**域名**：不需要 ✅
**证书**：Cloudflare 自动管 ✅
**安全**：随机 URL + 5 分钟过期 KV + 注册密钥三重保护 ✅

---

## 📋 部署步骤（只需做一次）

### 1. 安装 cloudflared

下载地址：https://github.com/cloudflare/cloudflared/releases

或者用 Windows 包管理器：
```powershell
winget install Cloudflare.cloudflared
```

### 2. 在 Cloudflare 创建 KV 命名空间

1. 登录 Cloudflare Dashboard → Workers & Pages → KV
2. 点击 **Create namespace**
3. 名称填：`ashley-site-tunnel-kv`
4. 复制生成的 **Namespace ID**（长字符串）

### 3. 绑定 KV 到 Pages 项目

1. 进入 ashley-site Pages 项目 → Settings → Functions
2. 找到 **KV namespace bindings** → Add binding
3. Variable name: `TUNNEL_KV`
4. KV namespace: 选择刚才创建的 `ashley-site-tunnel-kv`

### 4. 设置环境变量（注册密钥）

1. 在同一个 Functions 设置页，找到 **Environment variables**
2. Add variable:
   - 名称：`TUNNEL_REGISTER_SECRET`
   - 值：自己想一个强密码（比如随机 32 字符字符串）
   - ✅ 勾选 "Encrypt"（加密存储）
3. 点击 **Save and deploy**

### 5. 更新 wrangler.toml 里的 KV ID

把 `wrangler.toml` 里的：
```toml
[[kv_namespaces]]
binding = "TUNNEL_KV"
name = "ashley-site-tunnel-kv"
id = "REPLACE_WITH_YOUR_KV_ID"
preview_id = "REPLACE_WITH_YOUR_KV_ID"
```
把 `REPLACE_WITH_YOUR_KV_ID` 换成你第 2 步复制的 Namespace ID。

### 6. 提交代码，自动部署

```bash
git add .
git commit -m "feat: Cloudflare Tunnel 零成本 AI 接入"
git push origin main
```

Cloudflare Pages 会自动构建部署，约 1-2 分钟。

---

## ▶️ 日常使用（启动 AI 能力）

### 方法 A：一键启动脚本（推荐）

1. **先启动两个本地后端**：
   ```bash
   # 窗口 1：交通事故 KG
   cd /mnt/d/openclaw/workspace/shandong-traffic-accident-kg
   npm start   # 端口 3003

   # 窗口 2：交通智能体
   cd /mnt/d/openclaw/workspace/transport-agent-system
   npm start   # 端口 3009
   ```

2. **右键运行启动脚本**：
   - PowerShell 版（推荐）：`start-tunnel.ps1` → 右键 → 使用 PowerShell 运行
   - 或者批处理版：`start-tunnel.bat`

3. **脚本里的配置**：
   第一次用之前，编辑脚本开头的 `REGISTER_SECRET`，改成你第 4 步设置的那个密码。

4. **访问网站**：https://ashley-site.pages.dev

   前端会自动发现隧道，所有 AI 功能（KG 的智能问答/语义扩展/治理报告/事实质检，智能体的企业画像/车辆画像/执法质检）都自动启用！

### 方法 B：手动启动 cloudflared

```bash
# 终端 1：KG 隧道
cloudflared tunnel --url http://localhost:3003
# 复制输出的 https://xxx-xxx-xxx.trycloudflare.com

# 终端 2：Agent 隧道
cloudflared tunnel --url http://localhost:3009
# 复制输出的 https://xxx-xxx-xxx.trycloudflare.com

# 注册隧道地址
curl -X POST https://ashley-site.pages.dev/api/tunnel/register \
  -H "Content-Type: application/json" \
  -d '{"secret":"你的密钥","project":"accident-kg","url":"https://xxx-xxx-xxx.trycloudflare.com"}'

curl -X POST https://ashley-site.pages.dev/api/tunnel/register \
  -H "Content-Type: application/json" \
  -d '{"secret":"你的密钥","project":"transport","url":"https://xxx-xxx-xxx.trycloudflare.com"}'
```

---

## 🎯 效果展示

| 状态 | 前端行为 | AI 能力 |
|------|---------|---------|
| ✅ 隧道启动 + 后端运行 | 自动走隧道转发 | 全部真实 AI 能力 ✅ |
| ⚪ 隧道未启动 | 降级到静态 JSON | 提示"请启动本地后端 + 隧道" |
| 🔴 隧道中途挂了 | 下次 API 调用自动重新发现 | 暂时降级，隧道恢复后自动恢复 |

**用户体验**：完全无感，前端静默发现隧道，有隧道自动走真 AI，没隧道优雅降级。

---

## 🔒 安全说明

1. **隧道地址是随机的**：每次启动 cloudflared 都会生成新的随机子域名（`https://xxx-xxx-xxx.trycloudflare.com`），不可能被猜到。

2. **KV 存储 5 分钟过期**：注册的隧道地址在 KV 里只存 5 分钟，脚本每 4 分钟续租。就算地址泄漏了，最多 5 分钟后就失效了。

3. **注册需要密钥**：只有知道 `TUNNEL_REGISTER_SECRET` 的人才能注册隧道地址，别人就算看到 API 也改不了。

4. **Cloudflare 兜底**：Quick Tunnel 本身就有 DDoS 保护和速率限制。

---

## 📁 已修改文件清单

```
functions/api/tunnel/
  ├─ discover.js          # 前端发现隧道地址（公开）
  └─ register.js          # 后端注册隧道地址（需密钥）

public/apps/accident-kg/
  └─ static-shim.js       # v3.5.1 隧道增强版：自动发现 + 转发 + 降级

public/apps/transport/js/
  └─ agent-app.js         # v2.0 隧道增强版：自动发现 + 转发 + 降级

wrangler.toml             # 新增 KV 绑定配置
start-tunnel.bat          # Windows 一键启动脚本（批处理）
start-tunnel.ps1          # Windows 一键启动脚本（PowerShell，推荐）
TUNNEL-SETUP.md           # 本文档
```

---

## 🧪 测试清单

部署完后按以下步骤验证：

1. ✅ 访问 `/api/tunnel/discover` → 返回 JSON，两个项目都是 null
2. ✅ 启动 cloudflared + 注册 → 刷新 discover → 看到两个 URL
3. ✅ 打开 apps/accident-kg/ → 控制台看到 "发现隧道"
4. ✅ 点击"智能问答" → 能真实提问，不走降级
5. ✅ 关掉 cloudflared → 5 分钟内 discover 返回 null，前端自动降级
6. ✅ 重新启动 cloudflared + 注册 → 前端下一次 API 调用自动恢复真 AI
7. ✅ transport 项目同上验证：企业画像 / 车辆画像 / 执法质检

---

## 💡 高级用法

### 只开一个项目的隧道

脚本默认同时开两个隧道，如果你只需要一个：
- 注释掉不需要的那部分启动代码
- 或者手动启动 cloudflared 时只启一个端口

### 隧道地址手动查看

```powershell
# 查看 KG 隧道
Get-Content $env:TEMP\cloudflared-kg.log | Select-String "trycloudflare"

# 查看 Agent 隧道
Get-Content $env:TEMP\cloudflared-agent.log | Select-String "trycloudflare"
```

### 隧道保活

Quick Tunnel 是免费的，Cloudflare 可能会在闲置一段时间后断开连接。脚本已经做了 4 分钟自动续租，一般没问题。如果断开了，关闭脚本窗口重新运行就行。
