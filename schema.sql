-- GitHub Profile Analyzer — Database Schema
-- Run this script to set up the database manually (optional; the app auto-creates it on startup)

CREATE DATABASE IF NOT EXISTS github_analyzer;
USE github_analyzer;

CREATE TABLE IF NOT EXISTS profiles (
  id                    INT AUTO_INCREMENT PRIMARY KEY,

  -- Core identity
  username              VARCHAR(100) UNIQUE NOT NULL COMMENT 'GitHub login (lowercase)',
  name                  VARCHAR(200)        COMMENT 'Display name',
  bio                   TEXT               COMMENT 'User bio',
  avatar_url            VARCHAR(500)        COMMENT 'Profile picture URL',
  github_profile_url    VARCHAR(300)        COMMENT 'Link to GitHub profile',

  -- Contact & social
  location              VARCHAR(200),
  company               VARCHAR(200),
  blog                  VARCHAR(300)        COMMENT 'Personal website or blog',
  email                 VARCHAR(200),
  twitter_username      VARCHAR(100),
  hireable              BOOLEAN DEFAULT FALSE,

  -- GitHub activity counts
  public_repos          INT DEFAULT 0       COMMENT 'Number of public repositories',
  public_gists          INT DEFAULT 0,
  followers             INT DEFAULT 0,
  following             INT DEFAULT 0,

  -- Aggregated repo insights (own repos only, forks excluded)
  total_stars           INT DEFAULT 0       COMMENT 'Total stars across all own repos',
  total_forks           INT DEFAULT 0       COMMENT 'Total forks across all own repos',
  top_languages         JSON               COMMENT 'Top 5 languages [{language, repos_count}]',
  most_starred_repo     VARCHAR(200)        COMMENT 'Name of repo with most stars',
  most_starred_repo_stars INT DEFAULT 0    COMMENT 'Star count of that repo',

  -- Account metadata
  account_age_days      INT DEFAULT 0       COMMENT 'Days since GitHub account creation',
  github_created_at     DATETIME            COMMENT 'GitHub account creation date',
  github_updated_at     DATETIME            COMMENT 'GitHub profile last updated date',

  -- Record timestamps
  analyzed_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When we first analyzed this profile',
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last re-analysis time'
);
