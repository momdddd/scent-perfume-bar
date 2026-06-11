@echo off
rem Запуск сайта локально: двойной клик по этому файлу.
rem Откроет браузер на http://localhost:8123 и поднимет сервер.
cd /d "%~dp0"
start "" "http://localhost:8123/index.html"
python -m http.server 8123
