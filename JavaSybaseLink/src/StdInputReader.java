import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import net.minidev.json.JSONObject;
import net.minidev.json.JSONValue;

/**
 *
 * @author rod
 */
public class StdInputReader {

  private List<SQLRequestListener> listeners = new ArrayList<SQLRequestListener>();
  private BufferedReader inputBuffer = new BufferedReader(
    new InputStreamReader(System.in)
  );

  public StdInputReader() {}

  public void startReadLoop() {
    String nextLine;
    try {
      while ((nextLine = inputBuffer.readLine()) != null) {
        nextLine = nextLine.replaceAll("\\n", "\n");
        sendEvent(nextLine);
      }
    } catch (IOException ex) {
      System.err.println("IO exception: " + ex);
    }
  }

  private void sendEvent(String sqlRequest) {
    long startTime = System.currentTimeMillis();
    try {
      JSONObject val = (JSONObject) JSONValue.parse(sqlRequest);
      String type = (String) val.get("type");
      if (type.equals("connect")) {
        ConnectRequest request = new ConnectRequest();
        request.msgId = (int) val.get("msgId");
        request.host = (String) val.get("host");
        request.port = Integer.parseInt((String) val.get("port"));
        request.dbname = (String) val.get("dbname");
        request.username = (String) val.get("username");
        request.password = (String) val.get("password");
        request.charset = (String) val.get("charset");
        request.timezone = (String) val.get("timezone");
        request.javaStartTime = startTime;
        for (SQLRequestListener l : listeners) l.connect(request);
      } else if (type.equals("close")) {
        CloseRequest request = new CloseRequest();
        request.msgId = (int) val.get("msgId");
        request.dbId = (int) val.get("dbId");
        for (SQLRequestListener l : listeners) l.close(request);
      } else {
        SQLRequest request = new SQLRequest();
        request.msgId = (int) val.get("msgId");
        request.dbId = (int) val.get("dbId");
        request.sql = (String) val.get("sql");
        request.javaStartTime = startTime;
        for (SQLRequestListener l : listeners) l.sqlRequest(request);
      }
    } catch (Exception e) {
      e.printStackTrace(System.err);
      System.err.println("Error parsing json not a valid SQLRequest object.");
    }
  }

  public boolean addListener(SQLRequestListener l) {
    if (listeners.contains(l)) return false;

    listeners.add(l);
    return true;
  }

  public boolean removeListener(SQLRequestListener l) {
    return listeners.remove(l);
  }
}
