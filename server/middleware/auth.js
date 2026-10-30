const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access Denied" });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // This contains the ID and ROLE
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid Token" });
  }
};

const authorize = (role) => {
  return (req, res, next) => {
    // Check if the role in the token matches the required role
    if (req.user.role !== role) {
      return res.status(403).json({ message: "Forbidden: Admins Only" });
    }
    next();
  };
};

module.exports = { verifyToken, authorize };
