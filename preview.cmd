@echo off
setlocal
rem Prefer Node on PATH, then the runtime already installed with Codex.
set "preview_node="
for /f "delims=" %%N in ('where node.exe 2^>nul') do if not defined preview_node set "preview_node=%%N"
if not defined preview_node set "preview_node=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not exist "%preview_node%" (
  echo Node.js was not found. Install Node.js 24, reopen PowerShell, and try again.
  exit /b 1
)
for %%N in ("%preview_node%") do set "PATH=%%~dpN;%PATH%"
pushd "%~dp0"
if not exist "node_modules\wrangler\bin\wrangler.js" (
  echo Project dependencies are missing. Follow the installation steps in README.md.
  popd
  exit /b 1
)
if not exist "frontend\dist\index.html" (
  echo The website has not been built. Run the build steps in README.md first.
  popd
  exit /b 1
)
echo Starting the local website at http://127.0.0.1:4321/
echo Keep this window open. Press Ctrl+C to stop the preview.
"%preview_node%" "node_modules\wrangler\bin\wrangler.js" pages dev frontend/dist --ip 127.0.0.1 --port 4321
set "preview_result=%ERRORLEVEL%"
popd
exit /b %preview_result%
