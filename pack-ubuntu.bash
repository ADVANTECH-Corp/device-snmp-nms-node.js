#!/bin/bash
INS_ROOTFS=rootfs
DESTDIR=${INS_ROOTFS}/usr/local/EdgeSense/SNMP-NMS

make install DESTDIR=${DESTDIR} || exit 1

mkdir -p ${INS_ROOTFS}/etc/systemd/system || exit 1
cp -f misc-ubuntu/SNMP-NMS.service ${INS_ROOTFS}/etc/systemd/system || exit 1
cp -f misc-ubuntu/uninstall.bash ${DESTDIR} || exit 1
cp -f /usr/bin/node ${DESTDIR} || exit 1

echo "done"
