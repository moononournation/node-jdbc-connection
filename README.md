node-jdbc-connection
--------------------

A simple node.js wrapper around a Java application that provides easy access to databases via jdbc. The main goal is to allow easy installation without the requirements of installing and configuring odbc or freetds. You do however have to have java 1.5 or newer installed. (rewrite from https://github.com/moononournation/node-sybase-charset-tz.git)


requirements
------------

* java 1.8+

install
-------

### git

```bash
git clone https://github.com/moononournation/node-jdbc-connection.git
cd node-jdbc-connection
node-gyp configure build
```
### npm

```bash
npm install node-jdbc-connection
```

quick example
-------------

- charset: Please refer to [[Sybase webpage](https://infocenter.sybase.com/help/index.jsp?topic=/com.sybase.infocenter.dc39001.0707/html/prjdbc0707/prjdbc070731.htm)] for supported charset. Please use the value in "JDK byte converter" column
- timezone: Please refer to [[Wiki](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)] for supported TZ database name, empty string means no timezone information in datetime string format

```javascript
var NodeJdbcConnection = require('node-jdbc-connection'),
	jdbc = new NodeJdbcConnection();

jdbc.connect(
  // 'jdbc:sybase:Tds:host:port/db', // connect to Sybase DB server connect with JConnect Type 4 Driver
  // 'jdbc:jtds:sybase://host:port/db;charset=Big5_HKSCS', // connect to Sybase DB server connect with jTDS Driver
  // 'jdbc:jtds:sqlserver://host:port/db;charset=Big5_HKSCS', // connect to MS SQL DB server connect with jTDS Driver
  'connectionString',
  'username',
  'password',
  'timezone',
  function (dbId, err) {
  if (err) return console.log(err);

  console.log("Connected.");

  jdbc.query(dbId, 'select * from user where user_id = 42', function (dbId, err, result) {
    if (err) console.log(err);
    
    console.log(result);

    jdbc.close(dbId, function (dbId, err) {
      if (err) console.log(err);

      console.log("Connection closed.");
    });
  });
});
```

The java Bridge now optionally looks for a "sybaseConfig.properties" file in which you can configure jconnect properties to be included in the connection. This should allow setting properties like:
```properties
ENCRYPT_PASSWORD=true
```
