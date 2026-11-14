const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

const serviceAccountPath =
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
  path.join(__dirname, "..", "serviceAccountKey.json");

let firebaseInitError = null;

if (!fs.existsSync(serviceAccountPath)) {
  firebaseInitError = `Missing Firebase service account at ${serviceAccountPath}`;
  console.error(`${firebaseInitError}. Copy serviceAccountKey.json.example or set FIREBASE_SERVICE_ACCOUNT_PATH.`);
} else {
  try {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase Admin initialized");
  } catch (error) {
    firebaseInitError = error.message;
    console.error("Failed to initialize Firebase Admin:", error.message);
  }
}

const isAuthReady = () => admin.apps.length > 0;

const protect = async (req, res, next) => {
  if (!isAuthReady()) {
    return res.status(503).json({
      error: "Authentication is not configured on the server.",
      code: "AUTH_UNAVAILABLE",
    });
  }

  const header = req.headers.authorization || "";
  const match = /^Bearer\s+(\S+)$/i.exec(header);
  if (!match) {
    return res.status(401).json({ error: "Not authorized, no token" });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(match[1]);
    req.user = decodedToken;
    return next();
  } catch (error) {
    console.error("Token verification failed:", error.code || error.message);
    return res.status(401).json({ error: "Not authorized, token failed" });
  }
};

/**
 * Like `protect`, but never rejects: attaches req.user when a valid token is
 * present and continues anonymously otherwise. Used by execution routes that
 * must keep working for guests (Run) while still attributing submissions.
 */
const optionalProtect = async (req, _res, next) => {
  const match = /^Bearer\s+(\S+)$/i.exec(req.headers.authorization || "");
  if (!isAuthReady() || !match) return next();

  try {
    req.user = await admin.auth().verifyIdToken(match[1]);
  } catch {
    // Ignore invalid tokens on optional routes.
  }
  return next();
};

module.exports = { protect, optionalProtect, isAuthReady, firebaseInitError };
