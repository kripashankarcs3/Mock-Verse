const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

const serviceAccountPath =
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
  path.join(__dirname, "..", "serviceAccountKey.json");

if (!fs.existsSync(serviceAccountPath)) {
  console.error(
    `Missing Firebase service account file at ${serviceAccountPath}.` +
      " Please create it from serviceAccountKey.json.example or set FIREBASE_SERVICE_ACCOUNT_PATH."
  );
} else {
  try {
    const serviceAccount = require(serviceAccountPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error.message);
    // Skip initialization
  }
}

const protect = async (req, res, next) => {
  if (!admin.apps.length) {
    return res.status(500).json({
      error:
        "Firebase Admin is not initialized (missing service account). Auth routes are unavailable.",
    });
  }

  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = decodedToken;
      return next();
    } catch (error) {
      console.error("Error while verifying token", error);
      return res.status(401).json({ error: "Not authorized, token failed" });
    }
  }

  return res.status(401).json({ error: "Not authorized, no token" });
};

module.exports = { protect };
