"use strict";

var spawn = require('child_process').spawn;
var JSONStream = require('JSONStream');
var fs = require("fs");
var path = require("path");
var lastDbId = 0;

function NodeJdbcConnection(verbose, pathToJavaBridge) {
    this.verbose = (verbose == true);
    this.encoding = "utf8";

    this.pathToJavaBridge = pathToJavaBridge;
    if (this.pathToJavaBridge === undefined) {
        this.pathToJavaBridge = path.resolve(__dirname, "..", "JdbcLink", "dist", "JdbcLink.jar");
    }

    this.queryCount = 0;
    this.currentMessages = {}; // look up msgId to message sent and call back details.

    this.jsonParser = JSONStream.parse();

    this.javaDB = spawn('java', ["-jar", this.pathToJavaBridge]);
    var that = this;
    // set up normal listeners.
    that.javaDB.stdout.setEncoding(that.encoding).pipe(that.jsonParser).on("data", function (jsonMsg) { that.onResponse.call(that, jsonMsg); });
    that.javaDB.stderr.setEncoding(that.encoding).on("data", function (err) { that.onSQLError.call(that, err); });
}

NodeJdbcConnection.prototype.log = function (msg) {
    if (this.verbose) {
        console.log(msg);
    }
}

NodeJdbcConnection.prototype.connect = function (connectionString, username, password, timezone, callback) {
    var hrstart = process.hrtime();
    var msg = {};
    msg.type = "connect";
    msg.msgId = ++this.queryCount;
    msg.connectionString = connectionString;
    msg.username = username;
    msg.password = password;
    msg.timezone = timezone;
    msg.sentTime = (new Date()).getTime();
    var strMsg = JSON.stringify(msg).replace(/[\n]/g, '\\n');
    msg.callback = callback;
    msg.hrstart = hrstart;

    this.log("this: " + this + " currentMessages: " + this.currentMessages + " this.queryCount: " + this.queryCount);

    this.currentMessages[msg.msgId] = msg;

    this.javaDB.stdin.write(strMsg + "\n");
    this.log("sql request written: " + strMsg);
};

NodeJdbcConnection.prototype.close = function (dbId, callback) {
    var hrstart = process.hrtime();
    var msg = {};
    msg.type = "close";
    msg.msgId = ++this.queryCount;
    msg.dbId = dbId;
    msg.sentTime = (new Date()).getTime();
    var strMsg = JSON.stringify(msg).replace(/[\n]/g, '\\n');
    msg.callback = callback;
    msg.hrstart = hrstart;

    this.log("this: " + this + " currentMessages: " + this.currentMessages + " this.queryCount: " + this.queryCount);

    this.currentMessages[msg.msgId] = msg;

    this.javaDB.stdin.write(strMsg + "\n");
    this.log("sql request written: " + strMsg);
}

NodeJdbcConnection.prototype.query = function (dbId, sql, callback) {
    var hrstart = process.hrtime();
    var msg = {};
    msg.type = "query";
    msg.msgId = ++this.queryCount;
    msg.dbId = dbId;
    msg.sql = sql;
    msg.sentTime = (new Date()).getTime();
    var strMsg = JSON.stringify(msg).replace(/[\n]/g, '\\n');
    msg.callback = callback;
    msg.hrstart = hrstart;

    this.log("this: " + this + " currentMessages: " + this.currentMessages + " this.queryCount: " + this.queryCount);

    this.currentMessages[msg.msgId] = msg;

    this.javaDB.stdin.write(strMsg + "\n");
    this.log("sql request written: " + strMsg);
};

NodeJdbcConnection.prototype.getLastDbId = function () {
    return this.lastDbId;
}

NodeJdbcConnection.prototype.kill = function () {
    if (this.javaDB.kill) {
        this.javaDB.kill();
    }
}

NodeJdbcConnection.prototype.onResponse = function (jsonMsg) {
    var err = jsonMsg.error;
    var request = this.currentMessages[jsonMsg.msgId];
    delete this.currentMessages[jsonMsg.msgId];

    if ((!request) || (!request.hrstart)) {
        console.log("Wrong format: ", request, jsonMsg);
    }
    var result = jsonMsg.result;

    var currentTime = (new Date()).getTime();
    var sendTimeMS = currentTime - jsonMsg.javaEndTime;
    var hrend = process.hrtime(request.hrstart);
    var javaDuration = (jsonMsg.javaEndTime - jsonMsg.javaStartTime);

    if (this.verbose) {
        console.log("Execution time (hr): %ds %dms dbTime: %dms dbSendTime: %d sql=%s", hrend[0], hrend[1] / 1000000, javaDuration, sendTimeMS, request.sql);
    }
    this.lastDbId = jsonMsg.dbId;
    request.callback(jsonMsg.dbId, err, result);
};

NodeJdbcConnection.prototype.onSQLError = function (data) {
    if (this.verbose) {
        console.log(data);
    }
    // var error = new Error(data);

    // var callBackFunctions = [];
    // for (var k in this.currentMessages) {
    //     if (this.currentMessages.hasOwnProperty(k)) {
    //         callBackFunctions.push(this.currentMessages[k].callback);
    //     }
    // }

    // // clear the current messages before calling back with the error.
    // this.currentMessages = [];
    // callBackFunctions.forEach(function (cb) {
    //     cb(error);
    // });
};

module.exports = NodeJdbcConnection;
