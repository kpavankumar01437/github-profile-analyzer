const mysql = require("mysql2/promise");

// Build connection config — supports Railway MYSQL_URL, Railway individual vars, and local .env
const getPoolConfig = () => {
  // Option 1: Railway provides MYSQL_URL or MYSQL_PRIVATE_URL (most reliable)
  const url = process.env.MYSQL_URL || process.env.MYSQL_PRIVATE_URL;
  if (url) {
    console.log("ℹ️  Using MYSQL_URL connection string");
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port) || 3306,
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.slice(1),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    };
  }

  // Option 2: Railway individual vars (MYSQLHOST) or standard (MYSQL_HOST) or local (DB_HOST)
  const config = {
    host:
      process.env.MYSQL_HOST ||
      process.env.MYSQLHOST ||
      process.env.DB_HOST ||
      "localhost",
    port:
      parseInt(
        process.env.MYSQL_PORT || process.env.MYSQLPORT || process.env.DB_PORT,
      ) || 3306,
    user:
      process.env.MYSQL_USER ||
      process.env.MYSQLUSER ||
      process.env.DB_USER ||
      "root",
    password:
      process.env.MYSQL_PASSWORD ||
      process.env.MYSQLPASSWORD ||
      process.env.DB_PASSWORD ||
      "",
    database:
      process.env.MYSQL_DATABASE ||
      process.env.MYSQLDATABASE ||
      process.env.DB_NAME ||
      "github_analyzer",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };

  console.log(
    `ℹ️  Connecting to MySQL at ${config.host}:${config.port} as ${config.user}`,
  );
  return config;
};

const pool = mysql.createPool(getPoolConfig());

const initDB = async () => {
  // Test the connection first
  try {
    await pool.query("SELECT 1");
    console.log("✅ MySQL connection successful");
  } catch (err) {
    console.error("❌ MySQL connection failed:", err.code, err.message);
    throw err;
  }

  // Create table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS profiles (
      id                    INT AUTO_INCREMENT PRIMARY KEY,
      username              VARCHAR(100) UNIQUE NOT NULL,
      name                  VARCHAR(200),
      bio                   TEXT,
      avatar_url            VARCHAR(500),
      location              VARCHAR(200),
      company               VARCHAR(200),
      blog                  VARCHAR(300),
      email                 VARCHAR(200),
      twitter_username      VARCHAR(100),
      hireable              BOOLEAN DEFAULT FALSE,
      public_repos          INT DEFAULT 0,
      public_gists          INT DEFAULT 0,
      followers             INT DEFAULT 0,
      following             INT DEFAULT 0,
      total_stars           INT DEFAULT 0,
      total_forks           INT DEFAULT 0,
      top_languages         JSON,
      most_starred_repo     VARCHAR(200),
      most_starred_repo_stars INT DEFAULT 0,
      account_age_days      INT DEFAULT 0,
      github_profile_url    VARCHAR(300),
      github_created_at     DATETIME,
      github_updated_at     DATETIME,
      analyzed_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  console.log("✅ Database initialized successfully");
};

module.exports = { pool, initDB };
