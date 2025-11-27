const express = require("express");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const path = require("path");
const { promisify } = require("util");
const db = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;

// Promisify database methods
const dbGet = promisify(db.get).bind(db);
const dbRun = promisify(db.run).bind(db);
const dbAll = promisify(db.all).bind(db);

// Middleware
app.use(express.json());
// Serve static files from the client directory
app.use(express.static(path.join(__dirname, "../client")));

// Input validation rules
const validateUser = [
  body("username")
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters long")
    .isAlphanumeric()
    .withMessage("Username can only contain letters and numbers"),

  body("email").isEmail().normalizeEmail().withMessage("Must be a valid email address"),

  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
];

// API Routes - all prefixed with /api
app.post("/api/register", validateUser, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await dbGet("SELECT * FROM users WHERE username = ? OR email = ?", [
      username,
      email,
    ]);

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Username or email already exists",
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const result = await dbRun("INSERT INTO users (username, email, password) VALUES (?, ?, ?)", [
      username,
      email,
      hashedPassword,
    ]);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      userId: result.lastID,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get all users (for testing)
app.get("/api/users", async (req, res) => {
  try {
    const rows = await dbAll("SELECT id, username, email, created_at FROM users");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve the main page for all other routes (SPA support)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api/`);
});
