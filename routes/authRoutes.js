const express = require("express");
const {
  loginUser,
  registerUser,
  getUserProfile,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
router.post("/login", loginUser);

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
router.post("/register", registerUser);

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
router.get("/profile", protect, getUserProfile);

module.exports = router;
