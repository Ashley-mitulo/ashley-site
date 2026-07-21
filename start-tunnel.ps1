# Ashley Site - Cloudflare Tunnel 启动器 (PowerShell 版)
# 用法：右键 → 使用 PowerShell 运行

$ErrorActionPreference = "Continue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   Ashley 个人网站 - Cloudflare Tunnel 一键启动器" -ForegroundColor Cyan
Write-Host "   项目：交通事故 KG (3003) + 交通智能体 (3009)" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# ========== 配置项 ==========
$SITE_URL = "https://ashley-site.pages.dev"
$REGISTER_SECRET = "Ashley2026!Tunnel1234567890"
$KG_PORT = 3003
$AGENT_PORT = 3009
# =================================================

# 检查 cloudflared
Write-Host "[1/5] 检查 cloudflared 是否安装..." -ForegroundColor Yellow
try {
    $null = Get-Command cloudflared -ErrorAction Stop
    Write-Host "[OK] cloudflared 已安装" -ForegroundColor Green
} catch {
    Write-Host "[错误] 未找到 cloudflared，请先安装：" -ForegroundColor Red
    Write-Host "  下载地址：https://github.com/cloudflare/cloudflared/releases"
    Write-Host "  或者用：winget install Cloudflare.cloudflared"
    Read-Host "按回车退出"
    exit 1
}
Write-Host ""

# 清理旧文件
$kgLog = "$env:TEMP\cloudflared-kg.log"
$agentLog = "$env:TEMP\cloudflared-agent.log"
Remove-Item $kgLog -ErrorAction SilentlyContinue
Remove-Item $agentLog -ErrorAction SilentlyContinue

# 启动 KG 隧道
Write-Host "[2/5] 启动交通事故 KG 隧道 (端口 $KG_PORT)..." -ForegroundColor Yellow
Start-Process -FilePath "cloudflared" -ArgumentList "tunnel", "--url", "http://localhost:$KG_PORT" `
    -RedirectStandardOutput $kgLog -NoNewWindow
Start-Sleep -Seconds 6

# 提取 KG URL
$kgUrl = $null
$lines = Get-Content $kgLog -ErrorAction SilentlyContinue
foreach ($line in $lines) {
    if ($line -match 'https://[a-z0-9-]+\.trycloudflare\.com') {
        $kgUrl = $matches[0]
        break
    }
}
if ($kgUrl) {
    Write-Host "[OK] KG 隧道地址：$kgUrl" -ForegroundColor Green
} else {
    Write-Host "[警告] 未能获取 KG 隧道 URL，稍后重试..." -ForegroundColor Yellow
}
Write-Host ""

# 启动 Agent 隧道
Write-Host "[3/5] 启动交通智能体隧道 (端口 $AGENT_PORT)..." -ForegroundColor Yellow
Start-Process -FilePath "cloudflared" -ArgumentList "tunnel", "--url", "http://localhost:$AGENT_PORT" `
    -RedirectStandardOutput $agentLog -NoNewWindow
Start-Sleep -Seconds 6

# 提取 Agent URL
$agentUrl = $null
$lines = Get-Content $agentLog -ErrorAction SilentlyContinue
foreach ($line in $lines) {
    if ($line -match 'https://[a-z0-9-]+\.trycloudflare\.com') {
        $agentUrl = $matches[0]
        break
    }
}
if ($agentUrl) {
    Write-Host "[OK] Agent 隧道地址：$agentUrl" -ForegroundColor Green
} else {
    Write-Host "[警告] 未能获取 Agent 隧道 URL，稍后重试..." -ForegroundColor Yellow
}
Write-Host ""

# 注册隧道
Write-Host "[4/5] 注册隧道地址到 Cloudflare KV..." -ForegroundColor Yellow

function Register-Tunnel {
    param($project, $url)
    if (-not $url) { return $false }
    try {
        $body = @{ secret = $REGISTER_SECRET; project = $project; url = $url } | ConvertTo-Json
        $null = Invoke-RestMethod -Uri "$SITE_URL/api/tunnel/register" -Method Post -Body $body `
            -ContentType "application/json" -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

if ($kgUrl) {
    $r = Register-Tunnel "accident-kg" $kgUrl
    if ($r) { Write-Host "  [OK] accident-kg 注册成功" -ForegroundColor Green }
    else { Write-Host "  [失败] accident-kg 注册失败" -ForegroundColor Red }
}
if ($agentUrl) {
    $r = Register-Tunnel "transport" $agentUrl
    if ($r) { Write-Host "  [OK] transport 注册成功" -ForegroundColor Green }
    else { Write-Host "  [失败] transport 注册失败" -ForegroundColor Red }
}
Write-Host ""

Write-Host "================================================================" -ForegroundColor Green
Write-Host "   ✅ 隧道启动完成！" -ForegroundColor Green
Write-Host ""
Write-Host "   网站访问：$SITE_URL" -ForegroundColor Cyan
Write-Host ""
if ($kgUrl) { Write-Host "   交通事故 KG：$kgUrl" }
if ($agentUrl) { Write-Host "   交通智能体：  $agentUrl" }
Write-Host ""
Write-Host "   每 4 分钟自动重新注册（KV 5 分钟过期）"
Write-Host "   关闭此窗口停止所有隧道"
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""

# 循环重新注册
while ($true) {
    Start-Sleep -Seconds 240
    $time = Get-Date -Format "HH:mm:ss"
    Write-Host "[$time] 重新注册隧道地址..." -ForegroundColor Gray

    # 重新提取 URL
    $lines = Get-Content $kgLog -ErrorAction SilentlyContinue
    foreach ($line in $lines) {
        if ($line -match 'https://[a-z0-9-]+\.trycloudflare\.com') {
            $kgUrl = $matches[0]
            break
        }
    }
    $lines = Get-Content $agentLog -ErrorAction SilentlyContinue
    foreach ($line in $lines) {
        if ($line -match 'https://[a-z0-9-]+\.trycloudflare\.com') {
            $agentUrl = $matches[0]
            break
        }
    }

    if ($kgUrl) {
        $r = Register-Tunnel "accident-kg" $kgUrl
        if ($r) { Write-Host "  KG: OK" -ForegroundColor Gray }
    }
    if ($agentUrl) {
        $r = Register-Tunnel "transport" $agentUrl
        if ($r) { Write-Host "  Agent: OK" -ForegroundColor Gray }
    }
}
