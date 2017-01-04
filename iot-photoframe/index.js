const awsIot = require('aws-iot-device-sdk');
const cmdLineProcess = require('./lib/cmdline');
const isUndefined = require('./node_modules/aws-iot-device-sdk/common/lib/is-undefined');

const imageProcessor = require("./lib/ImageProcessor.js");

const THING_NAME = "photoframe";
const thingShadow = awsIot.thingShadow;


const start = (args) => {

    const thingShadows = thingShadow({
        keyPath: args.privateKey,
        certPath: args.clientCert,
        caPath: args.caCert,
        clientId: args.clientId,
        region: args.region,
        baseReconnectTimeMs: args.baseReconnectTimeMs,
        keepalive: args.keepAlive,
        protocol: args.Protocol,
        port: args.Port,
        host: args.Host,
        debug: args.Debug
    });

    //
    // Operation timeout in milliseconds
    //
    const operationTimeout = 10000;

    const thingName = THING_NAME;

    var currentTimeout = null;

    var stack = [];

    function genericOperation(operation, state) {
        var clientToken = thingShadows[operation](thingName, state);

        if (clientToken === null) {
            //
            // The thing shadow operation can't be performed because another one
            // is pending; if no other operation is pending, reschedule it after an
            // interval which is greater than the thing shadow operation timeout.
            //
            if (currentTimeout !== null) {
                console.log('operation in progress, scheduling retry...');
                currentTimeout = setTimeout(
                    function () {
                        genericOperation(operation, state);
                    },
                    operationTimeout * 2);
            }
        } else {
            //
            // Save the client token so that we know when the operation completes.
            //
            stack.push(clientToken);
        }
    }


    function rpiConnect() {
        thingShadows.register(thingName, {
                ignoreDeltas: false
            },
            function (err, failedTopics) {
                if (isUndefined(err) && isUndefined(failedTopics)) {
                    console.log('Mobile thing registered.');
                }
            });
    }

    function handleStatus(thingName, stat, clientToken, stateObject) {
        var expectedClientToken = stack.pop();

        if (expectedClientToken === clientToken) {
            console.log('got \'' + stat + '\' status on: ' + thingName);
        } else {
            console.log('(status) client token mismtach on: ' + thingName);
        }


    }

    function handleDelta(thingName, stateObject) {
        console.log('delta on: ' + thingName + JSON.stringify(stateObject));
        imageProcessor.pipe(stateObject.state.url);
    }

    function handleTimeout(thingName, clientToken) {
        var expectedClientToken = stack.pop();

        if (expectedClientToken === clientToken) {
            console.log('timeout on: ' + thingName);
        } else {
            console.log('(timeout) client token mismtach on: ' + thingName);
        }


    }

    thingShadows.on('connect', function () {
        console.log('connected to AWS IoT');
    });

    thingShadows.on('close', function () {
        console.log('close');
        thingShadows.unregister(thingName);
    });

    thingShadows.on('reconnect', function () {
        console.log('reconnect');
    });

    thingShadows.on('offline', function () {
        //
        // If any timeout is currently pending, cancel it.
        //
        if (currentTimeout !== null) {
            clearTimeout(currentTimeout);
            currentTimeout = null;
        }
        //
        // If any operation is currently underway, cancel it.
        //
        while (stack.length) {
            stack.pop();
        }
        console.log('offline');
    });

    thingShadows.on('error', function (error) {
        console.log('error', error);
    });

    thingShadows.on('message', function (topic, payload) {
        console.log('message', topic, payload.toString());
    });

    thingShadows.on('status', function (thingName, stat, clientToken, stateObject) {
        handleStatus(thingName, stat, clientToken, stateObject);
    });

    thingShadows.on('delta', function (thingName, stateObject) {
        handleDelta(thingName, stateObject);
    });

    thingShadows.on('timeout', function (thingName, clientToken) {
        handleTimeout(thingName, clientToken);
    });


    rpiConnect();
}

cmdLineProcess('connect to the AWS IoT service and demonstrate thing shadow APIs, test modes 1-2',
    process.argv.slice(2), start);
