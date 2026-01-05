const { auth } = require("../config/firebase");

const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    console.log(`Verifying token: ${token.substring(0, 10)}...`);
    const decodedToken = await auth.verifyIdToken(token);
    console.log("Token verified successfully for UID:", decodedToken.uid);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Error verifying token:", error.message);
    console.error("Full Error:", error); // detailed debugging
    return res
      .status(403)
      .json({ message: "Invalid or expired token", error: error.message });
  }
};

module.exports = verifyToken;
