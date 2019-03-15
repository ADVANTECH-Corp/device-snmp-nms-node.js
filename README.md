# device-snmp-nms-node.js
A plug-in of WISE-PaaS agent to poll SNMP managed devices.

## Service operation
enable service
>sudo systemctl enable SNMP-NMS.service

start service
>sudo systemctl start SNMP-NMS.service

restart service
>sudo systemctl restart SNMP-NMS.service

stop service
>sudo systemctl stop SNMP-NMS.service

check service status
>sudo systemctl status SNMP-NMS.service

# Development
## Build package for ubuntu
1. run ./init_dev.bash
2. run ./pack-ubuntu.bash
3. run ./epack_build.bash

## Build package for windows
1. run ./init_dev.bash in ubuntu
2. run ./pack-win.bash in ubuntu
3. Using Advanced Installer to open installer/project/SNMP-NMS.aip

## Change Version
1. Edit src/module/SNMP-NMS-plugin.js
>version:"v1.0.2",

2. Edit ePack_conf/ePack_custom.bash
>PROJECT_VER=x.x.x

3. Using Advanced Installer to open installer/project/SNMP-NMS.aip and edit ProductVersion.
