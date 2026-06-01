# GitHub Profile Analyzer API

A backend REST API that fetches GitHub user profile data via the GitHub Public API, computes useful insights, and stores them in a MySQL database.

Built with **Node.js**, **Express.js**, **MySQL**, and the **GitHub REST API**.

---

## Features

- 🔍 Fetch any GitHub user's public profile by username
- 💾 Store rich insights in MySQL (see [Insights Stored](#insights-stored))
- 🔄 Re-analyzing a user automatically refreshes their stored data (upsert)
- 📋 List all previously analyzed profiles
- 👤 Retrieve a single profile by username
- 🗑️ Delete a profile from the database

---

## Insights Stored

| Field | Description |
|---|---|
| `username` | GitHub login handle |
| `name` | Display name |
| `bio` | Profile bio |
| `avatar_url` | Profile picture URL |
| `location` | Location |
| `company` | Company |
| `blog` | Personal website |
| `email` | Public email |
| `twitter_username` | Twitter / X handle |
| `hireable` | Whether user is open to work |
| `public_repos` | Number of public repositories |
| `public_gists` | Number of public gists |
| `followers` | Follower count |
| `following` | Following count |
| `total_stars` | Total stars across all own repos |
| `total_forks` | Total forks across all own repos |
| `top_languages` | Top 5 programming languages used (JSON) |
| `most_starred_repo` | Name of their most-starred repository |
| `most_starred_repo_stars` | Star count of that repository |
| `account_age_days` | Days since GitHub account was created |
| `github_created_at` | Account creation date |
| `github_updated_at` | Profile last-updated date |
| `analyzed_at` | When we first analyzed this profile |
| `updated_at` | When data was last refreshed |

---

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL (via `mysql2`)
- **Third-Party API**: GitHub REST API v3
- **Others**: `axios`, `dotenv`, `cors`

---

## Project Structure

```
github-profile-analyzer/
├── src/
│   ├── app.js                   # Express app + server boot
│   ├── config/
│   │   └── db.js                # MySQL connection pool + DB init
│   ├── controllers/
│   │   └── profileController.js # Business logic for all endpoints
│   ├── routes/
│   │   └── profiles.js          # Route definitions
│   └── services/
│       └── githubService.js     # GitHub API calls + repo analysis
├── .env.example                 # Environment variable template
├── .gitignore
├── package.json
├── schema.sql                   # Database schema (for reference/export)
└── README.md
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- MySQL 8.x running locally
- A GitHub account (for generating a Personal Access Token)

---

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/github-profile-analyzer.git
cd github-profile-analyzer
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
# Windows (Command Prompt)
copy .env.example .env

# Mac / Linux
cp .env.example .env
```

Now open `.env` and fill in your values:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=github_analyzer
GITHUB_TOKEN=your_github_token
```

> **How to get a GitHub Token:**
> 1. Go to https://github.com/settings/tokens
> 2. Click **Generate new token (classic)**
> 3. Give it a name, no scopes needed for public data
> 4. Copy the token into `.env`
>
> Without a token: **60 requests/hour**. With a token: **5000 requests/hour**.

### 4. Start the server

```bash
# Development (auto-restarts on file changes)
npm run dev

# Production
npm start
```

The server starts at `http://localhost:3000`.

You should see:
```
✅ Database initialized successfully
✅ Server is running on http://localhost:3000
```

> The app **auto-creates** the `github_analyzer` database and `profiles` table on first run.

---

## API Endpoints

### Base URL (local)
```
http://localhost:3000
```

---

### `GET /`
Health check — confirms the API is running.

**Response:**
```json
{
  "message": "🚀 GitHub Profile Analyzer API is running!",
  "version": "1.0.0",
  "endpoints": { ... }
}
```

---

### `POST /api/profiles/analyze`
Fetches a GitHub user's profile and stores the analyzed insights in the database.
Re-analyzing an existing user **refreshes** their data.

**Request Body:**
```json
{
  "username": "torvalds"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Profile \"torvalds\" analyzed and stored successfully",
  "data": {
    "id": 1,
    "username": "torvalds",
    "name": "Linus Torvalds",
    "public_repos": 8,
    "followers": 218000,
    "total_stars": 22300,
    "top_languages": [
      { "language": "C", "repos_count": 4 },
      { "language": "Python", "repos_count": 1 }
    ],
    "most_starred_repo": "linux",
    "account_age_days": 5600,
    ...
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "GitHub user \"xyz\" not found"
}
```

---

### `GET /api/profiles`
Returns all profiles stored in the database.

**Response (200):**
```json
{
  "success": true,
  "count": 3,
  "data": [ { ... }, { ... }, { ... } ]
}
```

---

### `GET /api/profiles/:username`
Returns stored data for a single username.

**Example:** `GET /api/profiles/torvalds`

**Response (200):**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error (404):**
```json
{
  "success": false,
  "message": "Profile \"torvalds\" not found. Analyze it first: POST /api/profiles/analyze"
}
```

---

### `DELETE /api/profiles/:username`
Removes a profile from the database.

**Example:** `DELETE /api/profiles/torvalds`

**Response (200):**
```json
{
  "success": true,
  "message": "Profile \"torvalds\" deleted successfully"
}
```

---

## Database Schema

See [`schema.sql`](./schema.sql) for the full annotated schema.

To export the schema from MySQL Workbench:
> **Server → Data Export → Select `github_analyzer` → Export to Self-Contained File**

---

## Deployment (Railway)

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/github-profile-analyzer.git
git push -u origin main
```

### Step 2: Create Railway project
1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **New Project → Deploy from GitHub repo**
3. Select your `github-profile-analyzer` repository

### Step 3: Add MySQL plugin
1. Inside your Railway project, click **+ New**
2. Select **Database → MySQL**
3. Railway auto-sets `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`

### Step 4: Add environment variables
In your Railway service → **Variables** tab, add:
```
PORT=3000
GITHUB_TOKEN=your_github_token
```
> No need to add `MYSQL_*` vars — Railway injects them automatically.

### Step 5: Deploy
Railway auto-deploys on every push to `main`. Your live API URL will appear in the Railway dashboard.

---

## Postman Collection

Import the following requests into Postman:

| Method | URL | Body |
|--------|-----|------|
| GET | `{{base_url}}/` | — |
| POST | `{{base_url}}/api/profiles/analyze` | `{"username": "torvalds"}` |
| GET | `{{base_url}}/api/profiles` | — |
| GET | `{{base_url}}/api/profiles/torvalds` | — |
| DELETE | `{{base_url}}/api/profiles/torvalds` | — |

Set `base_url` as a Postman environment variable:
- Local: `http://localhost:3000`
- Deployed: `https://your-app.railway.app`
