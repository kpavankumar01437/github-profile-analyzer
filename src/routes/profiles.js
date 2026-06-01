const express = require('express');
const router = express.Router();
const {
  analyzeProfile,
  getAllProfiles,
  getProfileByUsername,
  deleteProfile,
} = require('../controllers/profileController');

// POST   /api/profiles/analyze         — fetch from GitHub + store in DB
// GET    /api/profiles                 — list all stored profiles
// GET    /api/profiles/:username       — get one profile by username
// DELETE /api/profiles/:username       — remove a profile from DB

router.post('/analyze',          analyzeProfile);
router.get('/',                  getAllProfiles);
router.get('/:username',         getProfileByUsername);
router.delete('/:username',      deleteProfile);

module.exports = router;
