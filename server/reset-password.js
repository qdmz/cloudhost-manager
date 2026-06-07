const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

(async () => {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "cloudhost123",
    database: "cloudhost"
  });

  const hash = await bcrypt.hash("Admin123!@#", 10);
  console.log("New hash:", hash);

  const [rows] = await connection.execute(
    "UPDATE users SET password = ? WHERE username = ?",
    [hash, "admin"]
  );
  console.log("Rows affected:", rows);

  const [users] = await connection.execute("SELECT id, username, password FROM users WHERE username = ?", ["admin"]);
  console.log("Updated user:", JSON.stringify(users[0]));

  await connection.end();
  console.log("Done!");
})();
