@echo off
setlocal EnableDelayedExpansion
title LifeDoc Guard - Dev Server
cd /d "%~dp0"

echo ================================================
echo   LifeDoc Guard - เริ่มเซิร์ฟเวอร์สำหรับพัฒนา
echo ================================================
echo.

echo [1/3] ปิดเซิร์ฟเวอร์เดิมที่ค้างอยู่บนพอร์ต 5173 (ถ้ามี)...
set FOUND=0
for /f "tokens=5" %%P in ('netstat -aon ^| findstr /R /C:":5173 .*LISTENING"') do (
    echo    - พบ process PID %%P กำลังใช้พอร์ต 5173 อยู่ กำลังปิด...
    taskkill /F /PID %%P >nul 2>&1
    set FOUND=1
)
if "!FOUND!"=="0" echo    - ไม่พบเซิร์ฟเวอร์เดิมที่ค้างอยู่
echo.

echo [2/3] ติดตั้ง/อัปเดต dependencies (npm install)...
call npm install
if errorlevel 1 (
    echo.
    echo *** npm install ล้มเหลว กรุณาอ่าน error ด้านบน ***
    pause
    exit /b 1
)
echo.

echo [3/3] เริ่มเซิร์ฟเวอร์ (npm run dev)...
echo    - เปิดในเครื่องนี้:                 http://localhost:5173/
echo    - เปิดจากมือถือ (ต่อ Wi-Fi เดียวกัน):  ดูบรรทัด "Network:" ที่จะขึ้นด้านล่าง
echo    - หยุดเซิร์ฟเวอร์:                   กด Ctrl+C ในหน้าต่างนี้ แล้วพิมพ์ Y
echo.
call npm run dev

echo.
echo เซิร์ฟเวอร์หยุดทำงานแล้ว
pause
