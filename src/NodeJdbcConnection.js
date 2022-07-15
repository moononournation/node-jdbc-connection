"use strict";

var spawn = require('child_process').spawn;
var JSONStream = require('JSONStream');
var fs = require("fs");
var path = require("path");
var lastDbId = 0;

function NodeJdbcConnection(verboseLevel, pathToJavaBridge) {
    this.verboseLevel = verboseLevel;
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

NodeJdbcConnection.prototype.connect = function (connectionString, username, password, timezone, callback) {
    var hrstart = process.hrtime();
    var msg = {};
    msg.type = "connect";
    msg.msgId = ++this.queryCount;
    if (this.verboseLevel >= 2) {
        console.log("connect, connectionString: " + connectionString + ", queryCount: " + this.queryCount);
    } else if (this.verboseLevel >= 1) {
        console.log("connect, queryCount: " + this.queryCount);
    }
    msg.connectionString = connectionString;
    msg.username = username;
    msg.password = password;
    msg.timezone = timezone;
    msg.sentTime = (new Date()).getTime();
    var strMsg = JSON.stringify(msg).replace(/[\n]/g, '\\n');
    msg.callback = callback;
    msg.hrstart = hrstart;

    this.currentMessages[msg.msgId] = msg;

    if (this.verboseLevel >= 2) {
        console.log("strMsg: " + strMsg);
    }
    this.javaDB.stdin.write(strMsg + "\n");
};

NodeJdbcConnection.prototype.close = function (dbId, callback) {
    var hrstart = process.hrtime();
    var msg = {};
    msg.type = "close";
    msg.msgId = ++this.queryCount;
    if (this.verboseLevel >= 1) {
        console.log("close, dbId: " + dbId + " queryCount: " + this.queryCount);
    }
    msg.dbId = dbId;
    msg.sentTime = (new Date()).getTime();
    var strMsg = JSON.stringify(msg).replace(/[\n]/g, '\\n');
    msg.callback = callback;
    msg.hrstart = hrstart;

    this.currentMessages[msg.msgId] = msg;

    if (this.verboseLevel >= 2) {
        console.log("strMsg: " + strMsg);
    }
    this.javaDB.stdin.write(strMsg + "\n");
}

NodeJdbcConnection.prototype.query = function (dbId, sql, callback) {
    var hrstart = process.hrtime();
    var msg = {};
    msg.type = "query";
    msg.msgId = ++this.queryCount;
    if (this.verboseLevel >= 2) {
        console.log("query, dbId: " + dbId + ", sql: " + sql + ", queryCount: " + this.queryCount);
    } else if (this.verboseLevel >= 1) {
        console.log("query, dbId: " + dbId + ", queryCount: " + this.queryCount);
    }
    msg.dbId = dbId;
    msg.sql = sql;
    msg.sentTime = (new Date()).getTime();
    var strMsg = JSON.stringify(msg).replace(/[\n]/g, '\\n');
    msg.callback = callback;
    msg.hrstart = hrstart;

    this.currentMessages[msg.msgId] = msg;

    if (this.verboseLevel >= 2) {
        console.log("strMsg: " + strMsg);
    }
    this.javaDB.stdin.write(strMsg + "\n");
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

    if (this.verboseLevel >= 2) {
        console.log("Execution time (hr): %ds %dms dbTime: %dms dbSendTime: %d sql=%s", hrend[0], hrend[1] / 1000000, javaDuration, sendTimeMS, request.sql);
    }

    this.lastDbId = jsonMsg.dbId;
    request.callback(jsonMsg.dbId, err, result);
};

NodeJdbcConnection.prototype.onSQLError = function (data) {
    console.log(data);
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
