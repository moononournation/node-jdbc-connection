import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Properties;
import java.util.TimeZone;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import net.sourceforge.jtds.jdbc.Driver;

/**
 *
 * @author rod
 */
public class SybaseDB {

  public static final int TYPE_TIME_STAMP = 93;
  public static final int TYPE_DATE = 91;

  public static final int NUMBER_OF_THREADS = 5;

  String host;
  Integer port;
  String dbname;
  String username;
  String password;
  String charset;
  String timezone;
  Properties props;
  Connection conn;
  DateFormat df;
  ExecutorService executor = Executors.newFixedThreadPool(NUMBER_OF_THREADS);

  public SybaseDB(
    String host,
    Integer port,
    String dbname,
    String username,
    String password,
    String charset,
    String timezone
  ) {
    this(
      host,
      port,
      dbname,
      username,
      password,
      charset,
      timezone,
      new Properties()
    );
  }

  public SybaseDB(
    String host,
    Integer port,
    String dbname,
    String username,
    String password,
    String charset,
    String timezone,
    Properties props
  ) {
    this.host = host;
    this.port = port;
    this.dbname = dbname;
    this.username = username;
    this.password = password;
    this.charset = charset;
    this.timezone = timezone;
    this.props = props;
    this.props.put("USER", username);
    this.props.put("PASSWORD", password);
    if (timezone.isEmpty()) {
      df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS");
    } else {
      df = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSZ");
      df.setTimeZone(TimeZone.getTimeZone(timezone));
    }
  }

  public boolean connect() {
    try {
      Class.forName("net.sourceforge.jtds.jdbc.Driver").newInstance();
      conn =
        DriverManager.getConnection(
          "jdbc:jtds:sybase://" +
          host +
          ":" +
          port +
          "/" +
          dbname +
          ";charset=" +
          charset,
          props
        );
      return true;
    } catch (Exception ex) {
      ex.printStackTrace(System.err);
      return false;
    }
  }

  public void execSQL(SQLRequest request) {
    Future f = executor.submit(new ExecSQLCallable(conn, df, request));
    // prints to system.out its self.
  }

  public boolean close() {
    try {
      conn.close();
      return true;
    } catch (Exception ex) {
      ex.printStackTrace(System.err);
      return false;
    }
  }
}
