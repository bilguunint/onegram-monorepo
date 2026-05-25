const functions = require("firebase-functions");
const admin = require("firebase-admin");
const bcrypt = require("bcryptjs");

const db = admin.firestore();

module.exports = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const { currentPin, newPin, token } = req.body;

    // Log the incoming request
    console.log("changePin request received:", {
      method: req.method,
      hasCurrentPin: !!currentPin,
      hasNewPin: !!newPin,
      hasToken: !!token,
      currentPinLength: currentPin ? currentPin.length : 0,
      newPinLength: newPin ? newPin.length : 0,
      currentPinType: typeof currentPin,
      newPinType: typeof newPin,
      tokenType: typeof token,
      body: req.body,
    });

    // Validate required fields
    if (!currentPin || !newPin || !token) {
      console.log("Missing required fields:", {
        currentPin: !currentPin ? "missing" : "present",
        newPin: !newPin ? "missing" : "present",
        token: !token ? "missing" : "present",
      });
      return res.status(400).json({ 
        status: "failed", 
        msg: "Missing required fields: currentPin, newPin, token",
      });
    }

    // Validate PIN format (6 digits)
    if (currentPin.length !== 6 || newPin.length !== 6) {
      console.log("Invalid PIN length:", {
        currentPinLength: currentPin.length,
        newPinLength: newPin.length,
        currentPin: currentPin,
        newPin: newPin,
      });
      return res.status(400).json({ 
        status: "failed", 
        msg: "PIN код 6 оронтой байх ёстой",
      });
    }

    // Validate PIN contains only numbers
    if (!/^\d{6}$/.test(currentPin) || !/^\d{6}$/.test(newPin)) {
      console.log("Invalid PIN format (not numbers):", {
        currentPin: currentPin,
        newPin: newPin,
        currentPinTest: /^\d{6}$/.test(currentPin),
        newPinTest: /^\d{6}$/.test(newPin),
      });
      return res.status(400).json({ 
        status: "failed", 
        msg: "PIN код зөвхөн 6 оронтой тоо байх ёстой",
      });
    }

    // Check if new PIN is different from current PIN
    if (currentPin === newPin) {
      console.log("Same PIN provided:", {
        currentPin: currentPin,
        newPin: newPin,
      });
      return res.status(400).json({
        status: "failed", 
        msg: "Шинэ PIN код одоогийнхоос өөр байх ёстой",
      });
    }

    console.log("Starting user authentication");

    // Verify token and get user
    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(token);
      console.log("Token verification successful:", {
        uid: decoded.uid,
        email: decoded.email,
      });
    } catch (tokenError) {
      console.log("Token verification failed:", {
        error: tokenError.message,
        code: tokenError.code,
      });
      
      if (tokenError.code === 'auth/id-token-expired') {
        return res.status(401).json({ 
          status: "failed", 
          msg: "Token хугацаа дууссан",
        });
      }
      
      return res.status(401).json({ 
        status: "failed", 
        msg: "Буруу token",
      });
    }

    const uid = decoded.uid;
    if (!uid) {
      console.log("No UID found in decoded token");
      return res.status(401).json({ 
        status: "failed", 
        msg: "Invalid token - no UID",
      });
    }

    console.log("Getting user document from Firestore");

    // Get user document
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      console.log("User document not found:", { uid });
      return res.status(404).json({ 
        status: "failed", 
        msg: "Хэрэглэгч олдсонгүй",
      });
    }

    const userData = userDoc.data();
    console.log("User data retrieved:", {
      uid: uid,
      hasPinHash: !!userData.pinHash,
      pinHashType: typeof userData.pinHash,
    });

    // Check if user has a PIN set
    if (!userData.pinHash) {
      console.log("No PIN hash found for user");
      return res.status(400).json({ 
        status: "failed", 
        msg: "PIN код тохируулагдаагүй байна",
      });
    }

    console.log("Verifying current PIN");

    // Verify current PIN
    let isPinValid;
    try {
      isPinValid = await bcrypt.compare(currentPin, userData.pinHash);
      console.log("PIN comparison result:", {
        isPinValid: isPinValid,
        currentPin: currentPin,
        hasPinHash: !!userData.pinHash,
      });
    } catch (bcryptError) {
      console.log("bcrypt comparison error:", {
        error: bcryptError.message,
        currentPin: currentPin,
        pinHash: userData.pinHash ? "present" : "absent",
      });
      return res.status(500).json({ 
        status: "failed", 
        msg: "PIN шалгахад алдаа гарлаа",
      });
    }

    if (!isPinValid) {
      console.log("Current PIN is invalid");
      return res.status(400).json({ 
        status: "failed", 
        msg: "Одоогийн PIN код буруу байна",
      });
    }

    console.log("Hashing new PIN");

    // Hash new PIN
    let hashedNewPin;
    try {
      const salt = await bcrypt.genSalt(10);
      hashedNewPin = await bcrypt.hash(newPin, salt);
      console.log("New PIN hashed successfully");
    } catch (hashError) {
      console.log("PIN hashing error:", {
        error: hashError.message,
        newPin: newPin,
      });
      return res.status(500).json({ 
        status: "failed", 
        msg: "Шинэ PIN кодыг хадгалахад алдаа гарлаа",
      });
    }

    console.log("Updating user document with new PIN");

    // Update user's PIN
    try {
      await db.collection("users").doc(uid).update({
        pinHash: hashedNewPin,
        pinUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log("PIN updated successfully for user:", uid);
    } catch (updateError) {
      console.log("Database update error:", {
        error: updateError.message,
        uid: uid,
      });
      return res.status(500).json({ 
        status: "failed", 
        msg: "PIN код шинэчлэхэд алдаа гарлаа",
      });
    }

    console.log("PIN change completed successfully");
    
    return res.status(200).json({ 
      status: "success", 
      msg: "PIN код амжилттай солигдлоо",
    });
  } catch (error) {
    console.error("changePin general error:", {
      error: error.message,
      stack: error.stack,
      code: error.code,
    });
    
    // Handle specific Firebase errors
    if (error.code === 'auth/id-token-expired') {
      console.log("Token expired error");
      return res.status(401).json({ 
        status: "failed", 
        msg: "Token хугацаа дууссан",
      });
    }
    
    if (error.code === 'auth/invalid-id-token') {
      console.log("Invalid token error");
      return res.status(401).json({ 
        status: "failed", 
        msg: "Буруу token",
      });
    }

    console.log("Generic server error");
    return res.status(500).json({ 
      status: "failed", 
      msg: "Серверийн алдаа гарлаа",
    });
  }
});
