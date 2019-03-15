#!/bin/bash
EPACK_PATH=

CURRDIR=$(cd $(dirname $0) && pwd)

if [ -z "${EPACK_PATH}" ]; then
    echo "Please define ePack path"
    exit 1
fi

cd ${EPACK_PATH} || exit 1
./clean_archive.bash || exit 1

cd ${CURRDIR} || exit 1

cp -a rootfs/* ${EPACK_PATH}/archive/rootfs  || exit 1

cp -f ePack_conf/ePack_custom.bash ${EPACK_PATH}/archive || exit 1
cp -f ePack_conf/startup_custom.bash ${EPACK_PATH}/archive || exit 1

cd ${EPACK_PATH} || exit 1
./build.bash || exit 1

echo "done"
