const axios = require('axios');

// Axios instance with optional token auth (strongly recommended to avoid rate limits)
const githubAPI = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Accept: 'application/vnd.github.v3+json',
    ...(process.env.GITHUB_TOKEN && {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    }),
  },
});

/**
 * Fetch a GitHub user's public profile data.
 * @param {string} username
 * @returns {object} GitHub user object
 */
const fetchUserProfile = async (username) => {
  try {
    const { data } = await githubAPI.get(`/users/${username}`);
    return data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error(`GitHub user "${username}" not found`);
    }
    if (error.response?.status === 403) {
      throw new Error(
        'GitHub API rate limit exceeded. Add a GITHUB_TOKEN in your .env to increase limits.'
      );
    }
    throw new Error(`GitHub API error: ${error.message}`);
  }
};

/**
 * Fetch up to 100 of a user's public repos.
 * @param {string} username
 * @returns {Array} array of repo objects
 */
const fetchUserRepos = async (username) => {
  try {
    const { data } = await githubAPI.get(`/users/${username}/repos`, {
      params: { per_page: 100, sort: 'updated' },
    });
    return data;
  } catch (error) {
    console.warn(`⚠️  Could not fetch repos for "${username}": ${error.message}`);
    return [];
  }
};

/**
 * Derive useful insights from a list of repos.
 * Skips forked repos for cleaner analysis.
 * @param {Array} repos
 * @returns {object} { totalStars, totalForks, topLanguages, mostStarredRepo, mostStarredRepoStars }
 */
const analyzeRepos = (repos) => {
  const languageCount = {};
  let totalStars = 0;
  let totalForks = 0;
  let mostStarredRepo = null;
  let mostStarredRepoStars = 0;

  repos.forEach((repo) => {
    if (repo.fork) return; // only own repos

    totalStars += repo.stargazers_count || 0;
    totalForks += repo.forks_count || 0;

    if (repo.language) {
      languageCount[repo.language] = (languageCount[repo.language] || 0) + 1;
    }

    if (repo.stargazers_count > mostStarredRepoStars) {
      mostStarredRepoStars = repo.stargazers_count;
      mostStarredRepo = repo.name;
    }
  });

  // Top 5 languages sorted by number of repos using them
  const topLanguages = Object.entries(languageCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([language, repos_count]) => ({ language, repos_count }));

  return { totalStars, totalForks, topLanguages, mostStarredRepo, mostStarredRepoStars };
};

module.exports = { fetchUserProfile, fetchUserRepos, analyzeRepos };
