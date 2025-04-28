const jwt = require("jsonwebtoken");
const { User } = require("../models");

// protect routes and authenticate user via JWT
const protect = async (req, res, next) => {
  let token;

  // check if token exist in header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // decoded jwt token
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // get user data from database
      req.user = await User.findByPk(decoded.id, {
        attributes: { exclude: ["password"] },
      });

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: "Invalid token" });
    }
  } else {
    res.status(401).json({ message: "No token provided" });
  }
};

module.exports = { protect };
