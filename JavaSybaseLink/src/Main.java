/*
 * The idea is to recive json messages in containing
 * { "msgId" : 1, "sql" : "select * from blar"}   on standard in.
 *
 * Then on standard out send
 * { "msgId" : 1, "rows" : [{},{}]}  back on standard out where the msgId matches the sent message.
 */
import java.util.LinkedHashMap;
import java.util.Map;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;

public class Main implements SQLRequestListener {

  Map dbMap = new LinkedHashMap();
  int connectCount = 0;
  StdInputReader input;

  public static void main(String[] args) {
    Main m = new Main();
  }

  public Main() {
    input = new StdInputReader();
    input.addListener(this);

    // blocking call don't do anything under here.
    input.startReadLoop();
  }

  public void connect(ConnectRequest request) {
    JSONObject response = new JSONObject();
    response.put("msgId", request.msgId);
    MyProperties props = new MyProperties("sybaseConfig.properties");
    SybaseDB db = new SybaseDB(
      request.host,
      request.port,
      request.dbname,
      request.username,
      request.password,
      request.charset,
      request.timezone,
      props.properties
    );

    if (!db.connect()) {
      response.put("error", "connect failed");
    } else {
      connectCount++;
      dbMap.put(connectCount, db);
      response.put("result", "connected");
      response.put("dbId", connectCount);
    }
    response.put("javaStartTime", request.javaStartTime);
    long beforeParse = System.currentTimeMillis();
    response.put("javaEndTime", beforeParse);

    System.out.println(response.toJSONString());
  }

  public void sqlRequest(SQLRequest request) {
    SybaseDB db = (SybaseDB) dbMap.get(request.dbId);
    db.execSQL(request);
    //System.out.println(result);
  }

  public void close(CloseRequest request) {
    SybaseDB db = (SybaseDB) dbMap.get(request.dbId);
    db.close();
    dbMap.remove(request.dbId);
    JSONObject response = new JSONObject();
    response.put("msgId", request.msgId);
    response.put("dbId", request.dbId);
    response.put("result", "closed");
    System.out.println(response.toJSONString());
    db = null;
  }
}
