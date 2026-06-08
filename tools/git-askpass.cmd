@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0git-askpass.ps1" %*
