@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ================================================
echo   LifeDoc Guard - อัปโหลดขึ้น GitHub
echo ================================================
echo.
git add -A
git commit -m "Update %date% %time%"
echo.
echo กำลัง push ขึ้น GitHub...
git push
if errorlevel 1 (
  echo.
  echo *** push ไม่สำเร็จ กรุณาตรวจสอบข้อความ error ด้านบน ***
  pause
  exit /b 1
)
echo.
echo เสร็จแล้ว - Netlify จะ build และอัปเดตเว็บให้อัตโนมัติภายในไม่กี่นาที
pause
