#!/bin/bash
INS_ROOTFS=rootfs
DESTDIR=${INS_ROOTFS}

make install DESTDIR=${DESTDIR} || exit 1

cp -f misc-win/node.exe ${DESTDIR} || exit 1
cp -f misc-win/install_service.bat ${DESTDIR} || exit 1
cp -f misc-win/install_service.js ${DESTDIR} || exit 1
cp -f misc-win/uninstall_service.bat ${DESTDIR} || exit 1
cp -f misc-win/uninstall_service.js ${DESTDIR} || exit 1
cp -rf build/node-windows ${DESTDIR}/node_modules || exit 1

echo "done"
