@ECHO OFF
SET ROOTDIR=%1%
CD %ROOTDIR%
node.exe install_service.js
