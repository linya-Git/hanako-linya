@echo off
set "HANA_ROOT=%~dp0"
set "HANA_SERVER_ENTRY=%~dp0bundle\index.js"
"%~dp0hana-server.exe" "%~dp0bootstrap.js" %*
