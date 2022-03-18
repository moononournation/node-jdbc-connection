node-sybase-charset-tz
---------

This is the revised vesion of node-sybase with some changes:
- changed to JTDS JDBC driver
- add charset parameter to support non-unicode database. The original can set it in properties file but it affect all instance, pass charset as create parameter can have different value for each instance
- add timezone parameter, also each instance can have different value

original node-sybase
---------

A simple node.js wrapper around a Java application that provides easy access to Sybase databases via jconn3. The main goal is to allow easy installation without the requirements of installing and configuring odbc or freetds. You do however have to have java 1.5 or newer installed.

requirements
------------

* java 1.5+

install
-------

### git

```bash
git clone git://github.com/rodhoward/node-sybase.git
cd node-sybase
node-gyp configure build
```
### npm

```bash
npm install sybase
```

quick example
-------------

- charset: Please refer to [[Sybase webpage](https://infocenter.sybase.com/help/index.jsp?topic=/com.sybase.infocenter.dc39001.0707/html/prjdbc0707/prjdbc070731.htm)] for supported charset. Please use the value in "JDK byte converter" column
- timezone: Please refer to [[Wiki](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)] for supported TZ database name, empty string means no timezone information in datetime string format

```javascript
var Sybase = require('sybase-charset-tz'),
	db = new Sybase();

db.connect(
  'host',
  'port',
  'dbName',
  'username',
  'password',
  'charset',
  'timezone',
  function (dbId, err) {
  if (err) return console.log(err);

  console.log("Connected.");

  db.query(dbId, 'select * from user where user_id = 42', function (dbId, err, result) {
    if (err) console.log(err);
    
    console.log(result);

    db.close(dbId, function (dbId, err) {
      if (err) console.log(err);

      console.log("Connection closed.");
    });
  });
});
```

api
-------------

The api is super simple. It makes use of standard node callbacks so that it can be easily used with promises. here is the full list of arguments:

```
new Sybase(host: string, port: int, dbName: string, username: string, password: string, charset: string, timezone: string, logTiming?: boolean, javaJarPath?: string, options?: SybaseOptions)
```
Where the SybaseOptions interface includes:
```
SybaseOptions {
  encoding: string, // defaults to "utf8"
  extraLogs: boolean // defaults to false
}
```

There is an example manually setting the java jar path:
```javascript 
var logTiming = true,
	javaJarPath = './JavaSybaseLink/dist/JavaSybaseLink.jar',
	db = new Sybase('host', port, 'dbName', 'username', 'password', 'charset', 'timezone', logTiming, javaJarPath);
```

The java Bridge now optionally looks for a "sybaseConfig.properties" file in which you can configure jconnect properties to be included in the connection. This should allow setting properties like:
```properties
ENCRYPT_PASSWORD=true
```
