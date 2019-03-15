try{
    var path = require("path");
    var initAdvLog = require('advlog');
    // Init AdvLog-Node.js
    var logfilepath = path.resolve("./config/log.json");
    initAdvLog(logfilepath);
    }catch(e){
};

var utility = require('../lib/utility.js');
var dataMgt = require('../lib/AdvDataMgt.js');
var snmp = require ("net-snmp");

var snmp_config = require('../config/snmp_config.json');

var gSNMPInterval = 20;

// 0. Plugin Name
var g_strPluginName = 'SNMP_NMS';

// 1. Basic Information of Plugin 
var g_jPluginInfo ={
    type:"Protocol",
    name:g_strPluginName,
    description:"This is a SNMP Manager service",
    version:"v1.0.0",
};

var dataMgt = new dataMgt();
dataMgt.initialize(g_strPluginName,g_jPluginInfo);

function BeautyJson (msg) {
    var jsonPretty = JSON.stringify(JSON.parse(msg),null,2);
    return jsonPretty;
}

function getDevInfo (devname)
{
    var info = {};
    info.ip = 'undefined';
    info.port = '161';
    info.community = 'public';
    info.snmpver = '2c';

    snmp_config.devicelist.forEach(element => {
        if (element.devid === devname) {
            info.ip = element.ip;
            info.port = element.port;
            info.community = element.community;
            info.snmpver = element.snmpver;
            return;
        }
    });
    return info;
}

function genDeviceRootPath (deviceName) {
    var path = g_strPluginName + '/' + deviceName;
    return path;
}

function genSensorPath (deviceName, sensorName) {
    var path = g_strPluginName + '/' + deviceName + '/' + sensorName;
    return path;
}

function Connection_Sensor_add (deviceName) {
    var rootpath = genDeviceRootPath (deviceName);
    var key = genSensorPath (deviceName, "ConnectionStatus");
    var sendata = {};
    sendata.n = "ConnectionStatus";
    sendata.v = 0;
    sendata.asm = 'r';
    sendata.min = 0;
    sendata.max = 1;
    dataMgt.addSensor (rootpath, sendata, key);
}

function Connection_Sensor_update (deviceName, value) {
    var key = genSensorPath (deviceName, "ConnectionStatus");
    dataMgt.updatebyKey (key, value);
}

function updateSNMPObj (key, varbinds)
{
    console.log ("updateSNMPObj : " + key + " : " + varbinds.oid + "[" + varbinds.type + "] = " + varbinds.value);

    switch (varbinds.type)
    {
        case snmp.ObjectType.OctetString:
            dataMgt.updatebyKey (key, varbinds.value.toString());
            break;
        case snmp.ObjectType.Integer:
        case snmp.ObjectType.Integer32:
        case snmp.ObjectType.Unsigned32:
            dataMgt.updatebyKey (key, varbinds.value);
            break;
    }
}

function pollAllObj()
{
    console.log ("pollAllObj ... start");
    var ret = [];
    if ( dataMgt.getAllKey( ret ) === true )
    {
        //console.log( 'Number of all key: ' + ret.length + ' result = ' + JSON.stringify( ret ));

        ret.forEach(element => {
            //console.log ("key :" + element.key);
            //console.log ("path:" + element.path);

            var layers = element.key.split('/');
            /* for debug
            for(var i=0; i<layers.length; i++) {
                console.log ("layers:" + layers[i]);
            }
            */

            //var objid = layers[2];
            var oriobjid = layers[2];
            var objid = layers[2];
            var devname = layers[1];
            var devinfo = getDevInfo (devname);
            //console.log ("device ip is " + devinfo.ip + ":" + devinfo.port + " snmpver:" + devinfo.snmpver);
            //console.log ("objid is " + objid);

            //skip key that is not object id
            if (objid === "ConnectionStatus")
            {
                return;
            }

            // Default options
            var options = {
                port: devinfo.port,
                retries: 2,
                timeout: 5000,
                transport: "udp4",
                trapPort: 162,
                version: snmp.Version1,
                idBitsSize: 16
            };

            if (devinfo.snmpver === "1")
                options.version = snmp.Version1;
            else if (devinfo.snmpver === "2c")
                options.version = snmp.Version2c;

            var session = snmp.createSession (devinfo.ip, devinfo.community, options);
            //var oids = ["1.3.6.1.4.1.10297.101.1.2.1.1.3.1"];
            var oids = [objid];
            session.get (oids, function (error, varbinds) {

                //console.log ("ip : " + devinfo.ip);

                if (error)
                {
                    console.error (error);
                    //console.error ("\x1b[31m%s\x1b[0m", error);
                    if (error.toString().trim() === 'RequestTimedOutError: Request timed out')
                    {
                        //console.error ("\x1b[33m!!! time out , device=[%s] oid=[%s]\x1b[0m", devname, oriobjid);
                        Connection_Sensor_update (devname, 0);
                    }
                }
                else
                {
                    for (var i = 0; i < varbinds.length; i++)
                    {
                        if (snmp.isVarbindError (varbinds[i]))
                            console.error (snmp.varbindError (varbinds[i]));
                            //console.error ("\x1b[32m%s\x1b[0m", snmp.varbindError (varbinds[i]));
                        else
                        {
                            console.log (varbinds[i].oid + "[" + varbinds[i].type + "] = " + varbinds[i].value);
                            var key = genSensorPath (devname, oriobjid);
                            updateSNMPObj (key, varbinds[i]);
                            Connection_Sensor_update (devname, 1);
                        }
                    }
                }
                session.close ();
              });

            //console.log (" ");
        });

    }

    console.log ("pollAllObj ... exit");
}

// ***********  Internal Function  *******************



var InitPlugin = function()
{
    // 3. Initialize
    InitTest();      
}

var UnInitPlugin = function()
{
    // - Uninitialize
}



var AutoReport = function() 
{
    var jsMsg = {};
    console.log('AutoReport');   
    AutoUpdateTest(); // 3. Auto Report
}


var MonitorReport = function()
{
    var jsMsg = {};
    console.log('MonitorReport');  
    MonitorUpdateTest();  
}

// Test Function


function readMIBJSONToWISE_JSONMsg (DeviceID, strMIB)
{
    var strPrefix = genDeviceRootPath (DeviceID);
    var mib_file = '../config/'+strMIB;
    var mib_config = require(mib_file);
    var senKey = strPrefix;
    var sendata = {};
    var asm = 'r';
    //console.log('MIN file= ' +  JSON.stringify(mib_config));

    Connection_Sensor_add (DeviceID);

    for (key in mib_config) {
        if (mib_config.hasOwnProperty(key)) {
            //console.log('load obj - ' +  JSON.stringify(key));

            // check if have name
            if( typeof mib_config[key].name === 'undefined')
                continue;

            // check if have oid
            if( typeof mib_config[key].oid === 'undefined')
                continue;

            // check if have syntax
            if( typeof mib_config[key].syntax === 'undefined')
                continue;

            // check if have type
            if( typeof mib_config[key].syntax.type === 'undefined')
                continue;

            sendata = {};
            sendata.n = mib_config[key].name;
            sendata.oid = mib_config[key].oid;
            if( mib_config[key].syntax.type === 'OCTET STRING') 
                sendata.sv = '';
            else if ( mib_config[key].syntax.type === 'Integer32')
                sendata.v = 0;
            else if ( mib_config[key].syntax.type === 'Integer')
                sendata.v = 0;
            else if ( mib_config[key].syntax.type === 'INTEGER')
                sendata.v = 0;
            else if ( mib_config[key].syntax.type === 'Unsigned32')
                sendata.v = 0;
            else
                continue;

            if(mib_config[key].maxaccess === 'read-only')
                sendata.asm = 'r';
            else if(mib_config[key].maxaccess === 'read-write')            
                sendata.asm = 'rw';
            else if(mib_config[key].maxaccess === 'write')            
                sendata.asm = 'w';

            if( typeof mib_config[key].syntax.constraints !== 'undefined')
            {
                if( typeof mib_config[key].syntax.constraints.size !== 'undefined')
                {
                    if( typeof mib_config[key].syntax.constraints.size[0].min !== 'undefined')
                        sendata.min = mib_config[key].syntax.constraints.size[0].min;
                    if( typeof mib_config[key].syntax.constraints.size[0].max !== 'undefined')
                        sendata.max = mib_config[key].syntax.constraints.size[0].max;
                }
                else if( typeof mib_config[key].syntax.constraints.range !== 'undefined')
                {
                    if( typeof mib_config[key].syntax.constraints.range[0].min !== 'undefined')
                        sendata.min = mib_config[key].syntax.constraints.range[0].min;
                    if( typeof mib_config[key].syntax.constraints.range[0].max !== 'undefined')
                        sendata.max = mib_config[key].syntax.constraints.range[0].max;
                }
            }

            senkey = strPrefix + '/' + mib_config[key].oid;
            
            //console.log('sen= ' +sendata);

            /* for debug
            console.log ("");
            console.log ("strPrefix = " + strPrefix);
            console.log ("sendata = " + sendata);
            console.log ("senkey = " + senkey);
            console.log ("");
            */

            dataMgt.addSensor(strPrefix,sendata,senkey);
            console.log('add obj : ' + DeviceID + ' - ' +  JSON.stringify(key));
        }
    }  

}

function readConfigToWISE_JSONMsg ()
{
    var devlist = snmp_config.devicelist;

    gSNMPInterval = snmp_config.interval;
    if (gSNMPInterval < 5 || gSNMPInterval > 600)
        gSNMPInterval = 20;
    console.log('interval - ' + gSNMPInterval);

    var prefix = '';
    snmp_config.devicelist.forEach(element => {
        if (element.snmpver === "1" || element.snmpver === "2c")
        {
            readMIBJSONToWISE_JSONMsg (element.devid, element.objectfile);
        }
        else
        {
            console.error ("Not support SNMP Ver " + element.snmpver + " assigned in " + element.objectfile);
        }
    });
}

function InitTest() {

    /*
    {
        "SNMP_Handler":{
            "SenData":{"e":[{"n":"Temperature","u":"Cel","v":26.5,"min":-100,"max":200,"asm":"r"},{"n":"Count","u":"","bv":false, "asm":"rw"}],"bn":"SenData"},
               "Info":{"e":[{"n":"Name","sv":"SenHub","asm":"rw"},{"n":"sw","sv":"1.0.0","asm":"r"}],"bn":"Info"},
                "Net":{"e":[{"n":"sw","sv":"3.0.1","asm":"r"},{"n":"Health","v":100.000000,"asm":"r"}],"bn":"Net"}
            }
    }
    */

   readConfigToWISE_JSONMsg();

   pollAllObj ();
   setInterval (pollAllObj, gSNMPInterval*1000);
   //process.exit(5);

   //console.log('capability= '+ JSON.stringify(dataMgt.getCapability()));
   console.log('capability= \r\n'+ BeautyJson (JSON.stringify(dataMgt.getCapability())));

   console.log('***************************');
   var ret = [];
   if ( dataMgt.getAllKey( ret ) === true )
       console.log( 'Number of all key: ' + ret.length + ' result = ' + JSON.stringify( ret ));

    console.log('***************************');
    ret = [];
    if( dataMgt.getAllPath( ret ) === true )
        console.log( 'Number of all Path: ' + ret.length + ' result = ' + JSON.stringify( ret ));
}

function getSenseData( iCmdid, strSessoinid, jsRequest )
{
       
    var uri = jsRequest[0].n;
    var result = [];    
    var sensor = {};   
    sensor.n = uri;
    sensor.StatusCode = 404; // NOT Found

    console.log( 'uri is ' + uri );
    var jsSensor = queryAdvJSONbyPath( uri , dataMgt.getCapability() );
    if( jsSensor !== 'undefined' ) {

        if( getSensorValue( jsSensor, sensor ) == true ) {        
            sensor.StatusCode = 200;    
            console.log('getSensorTest Value is ' + JSON.stringify(sensor) );
        }
    }
    
    result.push(sensor);

    g_sendcbf(iCmdid,strSessoinid, true, result /* [{"n":"SenHub","sv":"test","StatusCode":200}]*/);
}

function StartMonitorData( iCmdid, strSessionid, jsMsg )
{
    console.log('StartMonitorDataTest');  

    g_nMonitorInterval = jsMsg['susiCommData']['autoUploadIntervalMs'];
    g_nMonitorTimeout = jsMsg['susiCommData']['autoUploadTimeoutMs'];

	if (g_pMonitorHandle != 0) {
		clearInterval(g_pMonitorHandle);
		g_pMonitorHandle = 0;
 	}
    console.log('interval ' + g_nMonitorInterval + 'timeout ' + g_nMonitorTimeout);

	g_pMonitorHandle = setInterval(function () {
		MonitorUpdate();
    }, g_nMonitorInterval );
}

function setSenseData( iCmdid, strSessoinid, jsRequest )
{
    console.log('getSensorTest ' + JSON.stringify(jsRequest) );    
    var result = [{n:'Info/Name', sv:"SenHub1", "StatusCode":200}];    
    g_sendcbf(iCmdid,strSessoinid, true, result);
}


function AutoUpdateTest()
{
    console.log('Autoupdate = ' + JSON.stringify(dataMgt.getCapability()) + "\r\n");

	g_sendreportcbf(g_strPluginName, dataMgt.getCapability());
}

function MonitorUpdate()
{
    console.log('MonitorUpdate');
    
    //jsMsg = {"SNMP_Handler":{"SenData":{"e":[{"n":"Temperature","v":66},{"n":"GPIO1","bv":true}],"bn":"SenData"},"ver":1}};

    g_nMonitorTime += g_nMonitorInterval;
    if( g_nMonitorTime >= g_nMonitorTimeout ) {
        MonitorStop();
        g_nMonitorTime = 0;
    }

    g_sendreplytopiccbf( g_strPluginName, dataMgt.getCapability() );
}

var MonitorStop = function()
{
    console.log('MonitorStop'); 

	if (g_pMonitorHandle != 0) {
		clearInterval(g_pMonitorHandle);
		g_pMonitorHandle = 0;
	}      
}

var ProcRecvMsg = function( stTopic, strMsg )
{
    /*{"susiCommData":{"commCmd":251,"catalogID":4,"requestID":10}}*/
    console.log('get/set cmd '+stTopic + ' msg ' + strMsg );
    var cmdid = Cmd.wise_unknown_cmd;
    var root = JSON.parse(strMsg);
    var cmd = root['susiCommData']['commCmd'];
    var strSessionID = root['susiCommData']['sessionID'];
  
    switch( cmd )
    {
        case Cmd.wise_get_sensor_data_req:
            getSenseData( Cmd.wise_get_sensor_data_rep, strSessionID, root['susiCommData']['sensorIDList']['e']);
        break;
        case Cmd.wise_set_sensor_data_req:
            setSenseData( Cmd.wise_set_sensor_data_rep, strSessionID, root['susiCommData']['sensorIDList']['e']);
        break;
        case Cmd.wise_monitor_data_req: // Monitor
            StartMonitorData( Cmd.wise_monitor_data_req, strSessionID, root );
        break;
        default:
            console.log('Unknow command '+ cmd);
            g_sendcbf(Cmd.wise_unknown_cmd,strSessionID, false, '{Unknown cmd!}');
        break;
    }

    return;
}


/******************** Internal Variables ( NOT Modify ) *******************/

var g_sendcbf           = "undefined"; // reply action
var g_sendreportcbf     = "undefined"; // auto report
var g_sendcapabilitycbf = "undefined"; // send capability
var g_sendeventcbf      = "undefined"; // send event
var g_sendreplytopiccbf = "undefined"; // send update data by reply action topic

var g_pReportHandle     = 0;     //the Handle to clear report data interval.

// Monitor
var g_pMonitorHandle    = 0;     // Monitor to clear monitor data interval
var g_nMonitorInterval  = 1000; // 1 sec
var g_nMonitorTimeout   = 30000; // 30 sec
var g_nMonitorTime      = 0;


var Cmd = {
	wise_unknown_cmd: 0,
	wise_get_sensor_data_req: 523,
	wise_get_sensor_data_rep: 524,
	wise_set_sensor_data_req: 525,
    wise_set_sensor_data_rep: 526,
    wise_monitor_data_req:    533, 	// monitor page will send this command to start a thread to auto report a period of time    
};


/*************** External Function points *********** */



var Handler_Initialize  = function( param /**/)
{
    var ret = true;
    console.log('Handler_Initialize');
	g_sendcbf           = param.sendcbf;
	g_sendreportcbf     = param.sendreportcbf;
	g_sendcapabilitycbf = param.sendcapabilitycbf;
    g_sendeventcbf      = param.sendeventcbf;    
    g_sendreplytopiccbf = param.sendreplytopiccbf;
  
    InitPlugin();
    return ret;
}

var Handler_Uninitialize = function( param )
{
    console.log('Handler_Uninitialize');    
    var ret = true;

    Handler_AutoReportStop();
    UnInitPlugin();    
    return ret;    
}

var Handler_AutoReportStart = function( interval ) 
{
    console.log('Handler_AutoReportStart');  

	if (g_pReportHandle != 0) {
		clearInterval(g_pReportHandle);
		g_pReportHandle = 0;
	}

	g_pReportHandle = setInterval(function () {
		AutoReport();
    }, interval * 1000);
}

var Handler_AutoReportStop = function()
{
    console.log('Handler_AutoReportStop'); 
	clearInterval(g_pReportHandle);
	g_pReportHandle = 0;    
}

var Handler_Get_Capability = function()
{
    console.log('Handler_Get_Capability');     
    return dataMgt.getCapability();
}

var Handler_Recv = function(strTopic, strMsg )
{
    console.log('Handler_Recv');     
    ProcRecvMsg(strTopic, strMsg);
    return;
}

module.exports = {
    init: Handler_Initialize,
    uninit: Handler_Uninitialize,
    startReport: Handler_AutoReportStart,
    stopReport: Handler_AutoReportStop,
    getCapability: Handler_Get_Capability,
    recvCmd: Handler_Recv,
};


