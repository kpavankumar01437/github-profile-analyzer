const mysql = require('mysql2/promise');

const DB_NAME = process.env.MYSQL_DATABASE || process.env.DB_NAME || 'github_analyzer';

// Connection pool — used for all queries after init
const pool = mysql.createPool({
  host:     process.env.MYSQL_HOST     || process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.MYSQL_PORT || process.env.DB_PORT) || 3306,
  user:     process.env.MYSQL_USER     || process.env.DB_USER     || 'root',
  password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const initDB = async () => {
  // Step 1: Try to create DB (works locally; managed DBs like Railway already have it)
  try {
    const tempConn = await mysql.createConnection({
      host:     process.env.MYSQL_HOST     || process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.MYSQL_PORT || process.env.DB_PORT) || 3306,
      user:     process.env.MYSQL_USER     || process.env.DB_USER     || 'root',
      password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
    });
    await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
    await tempConn.end();
  } catch (err) {
    // Managed platforms (Railway) already provide the DB — this is fine
    console.log('ℹ️  Skipping DB creation (likely managed platform):', err.message);
  }

  // Step 2: Create tables using the pool
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

      -- GitHub counts
      public_repos          INT DEFAULT 0,
      public_gists          INT DEFAULT 0,
      followers             INT DEFAULT 0,
      following             INT DEFAULT 0,

      -- Aggregated repo insights (own repos only, no forks)
      total_stars           INT DEFAULT 0,
      total_forks           INT DEFAULT 0,
      top_languages         JSON,
      most_starred_repo     VARCHAR(200),
      most_starred_repo_stars INT DEFAULT 0,

      -- Account metadata
      account_age_days      INT DEFAULT 0,
      github_profile_url    VARCHAR(300),
      github_created_at     DATETIME,
      github_updated_at     DATETIME,

      -- Record timestamps
      analyzed_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ Database initialized successfully');
};

module.exports = { pool, initDB };
