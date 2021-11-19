@echo off
pushd .
cd %~dp0
call npm install mustache
call npm install sqlite3
call npm install terser
call npm install uglify-js
call npm install html-minifier
call npm install clean-css
call npm install --save-dev electron
call npm install --save-dev electron-builder
popd