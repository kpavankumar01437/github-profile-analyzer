const { pool } = require("../config/db");
const {
  fetchUserProfile,
  fetchUserRepos,
  analyzeRepos,
} = require("../services/githubService");

// ─── Helper ───────────────────────────────────────────────────────────────────
const parseTopLanguages = (row) => {
  if (row && typeof row.top_languages === "string") {
    try {
      row.top_languages = JSON.parse(row.top_languages);
    } catch (_) {}
  }
  return row;
};

// ─── POST /api/profiles/analyze ───────────────────────────────────────────────
const analyzeProfile = async (req, res) => {
  const { username } = req.body;

  if (!username || typeof username !== "string" || !username.trim()) {
    return res
      .status(400)
      .json({
        success: false,
        message: "username is required in the request body",
      });
  }

  const cleanUsername = username.trim().toLowerCase();

  try {
    // Fetch profile + repos in parallel for speed
    const [userProfile, repos] = await Promise.all([
      fetchUserProfile(cleanUsername),
      fetchUserRepos(cleanUsername),
    ]);

    const {
      totalStars,
      totalForks,
      topLanguages,
      mostStarredRepo,
      mostStarredRepoStars,
    } = analyzeRepos(repos);

    // Account age in days
    const accountAgeDays = Math.floor(
      (Date.now() - new Date(userProfile.created_at).getTime()) / 86_400_000,
    );

    const values = [
      userProfile.login,
      userProfile.name || null,
      userProfile.bio || null,
      userProfile.avatar_url,
      userProfile.location || null,
      userProfile.company || null,
      userProfile.blog || null,
      userProfile.email || null,
      userProfile.twitter_username || null,
      userProfile.hireable || false,
      userProfile.public_repos,
      userProfile.public_gists,
      userProfile.followers,
      userProfile.following,
      totalStars,
      totalForks,
      JSON.stringify(topLanguages),
      mostStarredRepo,
      mostStarredRepoStars,
      accountAgeDays,
      userProfile.html_url,
      userProfile.created_at
        ? new Date(userProfile.created_at)
            .toISOString()
            .slice(0, 19)
            .replace("T", " ")
        : null,
      userProfile.updated_at
        ? new Date(userProfile.updated_at)
            .toISOString()
            .slice(0, 19)
            .replace("T", " ")
        : null,
    ];

    // Upsert — re-analyzing an existing user refreshes all data
    await pool.query(
      `INSERT INTO profiles (
         username, name, bio, avatar_url, location, company, blog, email,
         twitter_username, hireable, public_repos, public_gists, followers, following,
         total_stars, total_forks, top_languages, most_starred_repo, most_starred_repo_stars,
         account_age_days, github_profile_url, github_created_at, github_updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name), bio = VALUES(bio), avatar_url = VALUES(avatar_url),
         location = VALUES(location), company = VALUES(company), blog = VALUES(blog),
         email = VALUES(email), twitter_username = VALUES(twitter_username),
         hireable = VALUES(hireable), public_repos = VALUES(public_repos),
         public_gists = VALUES(public_gists), followers = VALUES(followers),
         following = VALUES(following), total_stars = VALUES(total_stars),
         total_forks = VALUES(total_forks), top_languages = VALUES(top_languages),
         most_starred_repo = VALUES(most_starred_repo),
         most_starred_repo_stars = VALUES(most_starred_repo_stars),
         account_age_days = VALUES(account_age_days),
         github_profile_url = VALUES(github_profile_url),
         github_created_at = VALUES(github_created_at),
         github_updated_at = VALUES(github_updated_at),
         updated_at = CURRENT_TIMESTAMP`,
      values,
    );

    const [rows] = await pool.query(
      "SELECT * FROM profiles WHERE username = ?",
      [userProfile.login],
    );

    return res.status(201).json({
      success: true,
      message: `Profile "${userProfile.login}" analyzed and stored successfully`,
      data: parseTopLanguages(rows[0]),
    });
  } catch (error) {
    console.error("analyzeProfile error:", error.message);
    const status = error.message.includes("not found") ? 404 : 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};

// ─── GET /api/profiles ────────────────────────────────────────────────────────
const getAllProfiles = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM profiles ORDER BY analyzed_at DESC",
    );
    rows.forEach(parseTopLanguages);
    return res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error("getAllProfiles error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/profiles/:username ──────────────────────────────────────────────
const getProfileByUsername = async (req, res) => {
  const { username } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT * FROM profiles WHERE username = ?",
      [username.toLowerCase()],
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: `Profile "${username}" not found. Analyze it first: POST /api/profiles/analyze`,
      });
    }

    return res.json({ success: true, data: parseTopLanguages(rows[0]) });
  } catch (error) {
    console.error("getProfileByUsername error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── DELETE /api/profiles/:username ───────────────────────────────────────────
const deleteProfile = async (req, res) => {
  const { username } = req.params;
  try {
    const [result] = await pool.query(
      "DELETE FROM profiles WHERE username = ?",
      [username.toLowerCase()],
    );

    if (!result.affectedRows) {
      return res
        .status(404)
        .json({ success: false, message: `Profile "${username}" not found` });
    }

    return res.json({
      success: true,
      message: `Profile "${username}" deleted successfully`,
    });
  } catch (error) {
    console.error("deleteProfile error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  analyzeProfile,
  getAllProfiles,
  getProfileByUsername,
  deleteProfile,
};
