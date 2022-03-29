import com.sybase.jdbc4.jdbc.SybDriver;
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
public class JdbcConnection {

  public static final int TYPE_TIME_STAMP = 93;
  public static final int TYPE_DATE = 91;

  public static final int NUMBER_OF_THREADS = 5;

  String connectionString;
  String username;
  String password;
  String timezone;
  Properties props;
  Connection conn;
  DateFormat df;
  ExecutorService executor = Executors.newFixedThreadPool(NUMBER_OF_THREADS);

  public JdbcConnection(
    String connectionString,
    String username,
    String password,
    String timezone
  ) {
    this(
      connectionString,
      username,
      password,
      timezone,
      new Properties()
    );
  }

  public JdbcConnection(
    String connectionString,
    String username,
    String password,
    String timezone,
    Properties props
  ) {
    this.connectionString = connectionString;
    this.username = username;
    this.password = password;
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
      // Class.forName("com.sybase.jdbc4.jdbc.SybDriver").newInstance();
      // Class.forName("net.sourceforge.jtds.jdbc.Driver").newInstance();
      conn = DriverManager.getConnection(connectionString, props);
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
