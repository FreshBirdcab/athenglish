@echo off
echo ========================================
echo    AthEnglish 开发服务器重启脚本
echo ========================================
echo.

echo [1/4] 关闭现有 node 进程...
taskkill /F /IM node.exe 2>nul
echo      已关闭

echo [2/4] 清理缓存...
rmdir /S /Q ".next" 2>nul
echo      缓存已清理

echo [3/4] 启动开发服务器...
start "Next.js Dev" cmd /k "npm run dev"
echo      服务器启动中...

echo.
echo ========================================
echo    完成！请在浏览器访问 http://localhost:3000
echo ========================================
echo.
pause
