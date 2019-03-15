all:
	echo "nothing"

install:
	mkdir -p $(DESTDIR)
	cp -rf build/AgentLite-Node.js/* ${DESTDIR} 
	rm -f ${DESTDIR}/README.md
	cp -f src/device_snmp-nms.js ${DESTDIR}
	mkdir -p ${DESTDIR}/module
	mkdir -p ${DESTDIR}/config
	cp -rf src/module/* ${DESTDIR}/module
	cp -rf src/config/* ${DESTDIR}/config
