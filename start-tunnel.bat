@echo off
chcp 65001 >nul
title Ashley Site - Cloudflare Tunnel 启动器
color 0A

echo ================================================================
echo    Ashley 个人网站 - Cloudflare Tunnel 一键启动器
echo    项目：交通事故 KG (3003) + 交通智能体 (3009)
echo ================================================================
echo.

REM ========== 配置项（根据你的情况修改）==========
set SITE_URL=https://ashley-site.pages.dev
set REGISTER_SECRET=Ashley2026!Tunnel1234567890
set KG_PORT=3003
set AGENT_PORT=3009
REM =================================================

echo [1/5] 检查 cloudflared 是否安装...
where cloudflared >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 cloudflared，请先安装：
    echo   下载地址：https://github.com/cloudflare/cloudflared/releases
    echo   或者用 winget install Cloudflare.cloudflared
    echo.
    pause
    exit /b 1
)
echo [OK] cloudflared 已安装
echo.

echo [2/5] 启动交通事故 KG 隧道 (端口 %KG_PORT%)...
start /B cmd /c "cloudflared tunnel --url http://localhost:%KG_PORT% 2>&1 | findstr /C:".trycloudflare.com" > %TEMP%\cloudflared-kg-url.txt"
timeout /t 5 /nobreak >nul

REM 提取 KG 隧道 URL
set KG_URL=
for /f "usebackq tokens=*" %%i in (`type %TEMP%\cloudflared-kg-url.txt 2^>nul ^| findstr /C:"https://"`) do (
    for /f "tokens=2" %%j in ("%%i") do set KG_URL=%%j
)
if "%KG_URL%"=="" (
    echo [警告] 未能自动获取 KG 隧道 URL，稍后会重试...
) else (
    echo [OK] KG 隧道地址：%KG_URL%
)
echo.

echo [3/5] 启动交通智能体隧道 (端口 %AGENT_PORT%)...
start /B cmd /c "cloudflared tunnel --url http://localhost:%AGENT_PORT% 2>&1 | findstr /C:".trycloudflare.com" > %TEMP%\cloudflared-agent-url.txt"
timeout /t 5 /nobreak >nul

REM 提取 Agent 隧道 URL
set AGENT_URL=
for /f "usebackq tokens=*" %%i in (`type %TEMP%\cloudflared-agent-url.txt 2^>nul ^| findstr /C:"https://"`) do (
    for /f "tokens=2" %%j in ("%%i") do set AGENT_URL=%%j
)
if "%AGENT_URL%"=="" (
    echo [警告] 未能自动获取 Agent 隧道 URL，稍后会重试...
) else (
    echo [OK] Agent 隧道地址：%AGENT_URL%
)
echo.

echo [4/5] 注册隧道地址到 Cloudflare KV...
if not "%KG_URL%"=="" (
    curl -s -X POST "%SITE_URL%/api/tunnel/register" ^
        -H "Content-Type: application/json" ^
        -d "{\"secret\":\"%REGISTER_SECRET%\",\"project\":\"accident-kg\",\"url\":\"%KG_URL%\"}"
    echo.
)
if not "%AGENT_URL%"=="" (
    curl -s -X POST "%SITE_URL%/api/tunnel/register" ^
        -H "Content-Type: application/json" ^
        -d "{\"secret\":\"%REGISTER_SECRET%\",\"project\":\"transport\",\"url\":\"%AGENT_URL%\"}"
    echo.
)
echo.

echo ================================================================
echo    ✅ 隧道启动完成！
echo.
echo    访问：%SITE_URL%
echo.
echo    交通事故 KG：%KG_URL%
echo    交通智能体：  %AGENT_URL%
echo.
echo    每 4 分钟自动重新注册（隧道地址 5 分钟过期）
echo    按 Ctrl+C 停止所有隧道
echo ================================================================
echo.

REM 后台循环：每 4 分钟重新注册一次
:LOOP
timeout /t 240 /nobreak >nul
echo [%date% %time%] 重新注册隧道地址...

REM 重新获取 URL（可能变了）
for /f "usebackq tokens=*" %%i in (`type %TEMP%\cloudflared-kg-url.txt 2^>nul ^| findstr /C:"https://"`) do (
    for /f "tokens=2" %%j in ("%%i") do set KG_URL=%%j
)
for /f "usebackq tokens=*" %%i in (`type %TEMP%\cloudflared-agent-url.txt 2^>nul ^| findstr /C:"https://"`) do (
    for /f "tokens=2" %%j in ("%%i") do set AGENT_URL=%%j
)

if not "%KG_URL%"=="" (
    curl -s -X POST "%SITE_URL%/api/tunnel/register" ^
        -H "Content-Type: application/json" ^
        -d "{\"secret\":\"%REGISTER_SECRET%\",\"project\":\"accident-kg\",\"url\":\"%KG_URL%\"}" >nul
    echo   KG: OK
)
if not "%AGENT_URL%"=="" (
    curl -s -X POST "%SITE_URL%/api/tunnel/register" ^
        -H "Content-Type: application/json" ^
        -d "{\"secret\":\"%REGISTER_SECRET%\",\"project\":\"transport\",\"url\":\"%AGENT_URL%\"}" >nul
    echo   Agent: OK
)

goto LOOP
