const { auth } = require("../config/firebase");

// Simple in-memory cache: { [token]: { decodedToken, expiresAt } }
const tokenCache = new Map();

const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  // Check Cache
  if (tokenCache.has(token)) {
    const cached = tokenCache.get(token);
    if (Date.now() < cached.expiresAt) {
      req.user = cached.decodedToken;
      return next();
    } else {
      tokenCache.delete(token); // Expired
    }
  }

  try {
    const decodedToken = await auth.verifyIdToken(token);

    // Cache it
    // exp is in seconds, convert to ms
    const expiresAt = decodedToken.exp * 1000;
    tokenCache.set(token, { decodedToken, expiresAt });

    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Error verifying token:", error.message);
    return res
      .status(403)
      .json({ message: "Invalid or expired token", error: error.message });
  }
};

module.exports = verifyToken;
