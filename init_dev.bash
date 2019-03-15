#!/bin/bash
mkdir -p build || exit 1
cd build || exit 1
git clone http://advgitlab.eastasia.cloudapp.azure.com/EdgeSense/AgentLite-Node.js.git || exit 1

cd AgentLite-Node.js || exit 1

echo "npm install"
npm install || exit 1

echo "npm install net-snmp"
npm install net-snmp || exit 1

echo "done"
