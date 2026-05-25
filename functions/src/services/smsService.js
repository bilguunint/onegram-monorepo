const axios = require("axios");
const { logger } = require("firebase-functions");


// SMS Service Configuration
const SMS_CONFIG = {
  apiKey: "e15b92d6da557174aeb74b29f5243f77",
  apiUrl: "https://api-text.callpro.mn/v1/sms/send",
  timeout: 3000,
};

// Special numbers pool
const SPECIAL_NUMBERS = [
  "72887388", "72887380", "72887381", "72887383", "72887384", "72887385", "72887387",
  "72887389", "72887391", "72887392", "72705104", "72705106", "72705107", "72705108",
  "72705202", "72705203", "72705204", "72705403", "72887300", "72887301", "72887302",
  "72887303", "72887304", "72887305", "72887306", "72887307", "72887308", "72887309",
  "72887310", "72887311", "72887312", "72887313", "72887314", "72887315", "72887316",
  "72887317", "72887318", "72887319", "72887320", "72887321", "72887322", "72887323",
  "72887324", "72887325", "72887326", "72887327", "72887328", "72887329", "72887330",
  "72887331", "72887332", "72887334", "72887335", "72887336", "72887399", "72887397", "72887396",
  "72887395", "72887393", "72887379", "72887377", "72887376", "72887375", "72887372",
  "72887371", "72887369", "72887368", "72887367", "72887365", "72887364", "72887363",
  "72887361", "72887360", "72887359", "72273997", "72273998", "72273995", "72273994",
  "72273992", "72273991", "72273990", "72273989", "72273988", "72273987", "72273986",
  "72273985", "72273984", "72273983", "72273982", "72273981", "72273980", "72273979",
  "72273977", "72273978",
];

function getRandomSpecialNumber() {
  return SPECIAL_NUMBERS[Math.floor(Math.random() * SPECIAL_NUMBERS.length)];
}

/**
 * Normalize phone number to Mongolia format (8 digits without country code)
 * @param {string} phone - Phone number in various formats
 * @return {string|null} - Normalized 8-digit phone number or null if invalid
 */
function normalizePhoneForSMS(phone) {
  if (!phone) return null;

  // Remove all non-digit characters
  const digits = String(phone).replace(/\D/g, "");

  // Handle different formats
  if (digits.startsWith("976") && digits.length === 11) {
    // +976XXXXXXXX format
    return digits.substring(3);
  } else if (digits.length === 8) {
    // Already 8 digits
    return digits;
  }

  return null;
}

/**
 * Send SMS using MessagePro API
 * @param {string} phone - Phone number (can be +976XXXXXXXX or XXXXXXXX format)
 * @param {string} message - SMS message content
 * @return {Promise<boolean>} - true if SMS sent successfully, false otherwise
 */
async function sendSMS(phone, message) {
  try {
    const normalizedPhone = normalizePhoneForSMS(phone);
    if (!normalizedPhone) {
      logger.error("Invalid phone number format", { phone });
      return false;
    }

    const smsPayload = {
      from: getRandomSpecialNumber(),
      to: normalizedPhone,
      text: message,
    };

    logger.info("Sending SMS", {
      to: normalizedPhone,
      messageLength: message.length,
      from: smsPayload.from,
    });

    const response = await axios.post(SMS_CONFIG.apiUrl, smsPayload, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": SMS_CONFIG.apiKey,
      },
      timeout: SMS_CONFIG.timeout,
    });

    if (response.status === 200) {
      logger.info("SMS sent successfully", {
        to: normalizedPhone,
        status: response.data?.status || "unknown",
        messageId: response.data?.message_id || "unknown",
      });
      return true;
    }

    logger.error("SMS API returned unexpected status", {
      to: normalizedPhone,
      status: response.status,
      response: response.data,
    });
    return false;
  } catch (error) {
    logger.error("SMS sending failed", {
      phone: phone,
      message: error.message,
      status: error.response?.status,
      response: error.response?.data,
    });
    return false;
  }
}

/**
 * Send OTP SMS
 * @param {string} phone - Phone number
 * @param {string} otp - OTP code
 * @return {Promise<boolean>} - true if SMS sent successfully
 */
async function sendOTP(phone, otp) {
  const message = `Таны баталгаажуулах код: ${otp}`;
  return await sendSMS(phone, message);
}

/**
 * Send gift notification SMS
 * @param {string} phone - Receiver's phone number
 * @param {string} senderName - Sender's formatted name (e.g., "Н.Билгүүн")
 * @param {number} quantity - Gift quantity
 * @param {string} metalName - Metal name ("алт" or "мөнгө")
 * @return {Promise<boolean>} - true if SMS sent successfully
 */
async function sendGiftNotification(phone, senderName, quantity, metalName) {
  const message = `Танд ${senderName} хэрэглэгчээс ${quantity}гр ${metalName}ыг бэлэг болгон илгээж байна. Onegram апп-аа татаад бэлгээ хүлээн авна уу.`;
  return await sendSMS(phone, message);
}

/**
 * Send withdraw verification code SMS
 * @param {string} phone - Phone number
 * @param {string} verificationCode - Verification code
 * @param {number} quantity - Withdraw quantity
 * @param {string} metalName - Metal name ("алт" or "мөнгө")
 * @return {Promise<boolean>} - true if SMS sent successfully
 */
async function sendWithdrawVerification(phone, verificationCode, quantity, metalName) {
  const message = `Таны ${quantity}гр ${metalName} авах хүсэлтийн баталгаажуулах код: ${verificationCode}. 10 минутын дотор ашиглана уу.`;
  return await sendSMS(phone, message);
}

/**
 * Send custom SMS message
 * @param {string} phone - Phone number
 * @param {string} message - Custom message
 * @return {Promise<boolean>} - true if SMS sent successfully
 */
async function sendCustomMessage(phone, message) {
  return await sendSMS(phone, message);
}

module.exports = {
  sendSMS,
  sendOTP,
  sendGiftNotification,
  sendWithdrawVerification,
  sendCustomMessage,
  normalizePhoneForSMS,
};
