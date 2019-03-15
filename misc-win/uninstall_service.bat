@ECHO OFF
SET ROOTDIR=%1%
CD %ROOTDIR%
@node.exe uninstall_service.js

:remove_meta
@REM delete meta files while using node-windows

@IF EXIST daemon\snmpnms.exe (
  @DEL /Q /S /F daemon\snmpnms.exe
  goto remove_meta
)

@IF EXIST daemon\snmpnms.exe.config (
  @DEL /Q /S /F daemon\snmpnms.exe.config
  goto remove_meta
)

@rmdir /s /q daemon

exit 0
