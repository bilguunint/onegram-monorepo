const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const axios = require("axios");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

const db = admin.firestore();

// SMS Campaign Configuration
const SMS_CAMPAIGN_CONFIG = {
  apiKey: "e15b92d6da557174aeb74b29f5243f77",
  apiUrl: "https://api.messagepro.mn/order-campaign",
  timeout: 30000,
  defaultFrom: "72887388", // Default special number for campaigns
};

/**
 * Create SMS Campaign
 * 
 * @example Single text to multiple numbers (isWithText=0)
 * POST /createSmsCampaign
 * {
 *   "name": "Promotional Campaign",
 *   "isWithText": 0,
 *   "text": "Your SMS message here",
 *   "begin_date": "2025-11-10",
 *   "begin_hour": "09",
 *   "begin_minute": "00",
 *   "numbers": ["99123456", "88234567", "91345678"]
 * }
 * 
 * @example Different text per number (isWithText=1)
 * POST /createSmsCampaign
 * {
 *   "name": "Personalized Campaign",
 *   "isWithText": 1,
 *   "begin_date": "2025-11-10",
 *   "begin_hour": "09",
 *   "begin_minute": "00",
 *   "numbers": [
 *     {"number": "99123456", "text": "Hello User1"},
 *     {"number": "88234567", "text": "Hello User2"}
 *   ]
 * }
 */
exports.createSmsCampaign = onRequest(
  {
    memory: "512MiB",
    timeoutSeconds: 120,
  },
  async (req, res) => {
    return cors(req, res, async () => {
      try {
        if (req.method !== "POST") {
          return res.status(405).json({ 
            error: "Method Not Allowed",
            message: "Only POST requests are allowed",
          });
        }

        const body = req.body || {};
        const {
          name,
          isWithText,
          text,
          begin_date,
          begin_hour,
          begin_minute,
          numbers,
        } = body;

        // Basic validations
        if (!name) {
          return res.status(400).json({ error: "Missing required field: name" });
        }

        if (isWithText === undefined || isWithText === null) {
          return res.status(400).json({ error: "Missing required field: isWithText (must be 0 or 1)" });
        }

        if (![0, 1].includes(Number(isWithText))) {
          return res.status(400).json({ error: "isWithText must be 0 or 1" });
        }

        if (!begin_date) {
          return res.status(400).json({ error: "Missing required field: begin_date (format: YYYY-MM-DD)" });
        }

        if (!begin_hour) {
          return res.status(400).json({ error: "Missing required field: begin_hour (format: HH)" });
        }

        if (!begin_minute) {
          return res.status(400).json({ error: "Missing required field: begin_minute (format: MM)" });
        }

        if (!numbers || !Array.isArray(numbers) || numbers.length === 0) {
          return res.status(400).json({ error: "Missing or invalid field: numbers (must be non-empty array)" });
        }

        // Validate based on isWithText
        if (Number(isWithText) === 0) {
          // Single text to multiple numbers
          if (!text) {
            return res.status(400).json({ error: "Missing required field: text (required when isWithText=0)" });
          }

          // Validate numbers array contains strings
          if (!numbers.every((num) => typeof num === "string")) {
            return res.status(400).json({ error: "numbers must be array of strings when isWithText=0" });
          }
        } else {
          // Different text per number
          // Validate numbers array contains objects with number and text
          if (!numbers.every((item) => item && typeof item === "object" && item.number && item.text)) {
            return res.status(400).json({ 
              error: "numbers must be array of objects with 'number' and 'text' fields when isWithText=1",
              example: [{"number": "99123456", "text": "Hello"}],
            });
          }
        }

        // Prepare campaign data
        const campaignData = {
          name: String(name),
          isWithText: Number(isWithText),
          begin_date: String(begin_date),
          begin_hour: String(begin_hour),
          begin_minute: String(begin_minute),
          numbers: numbers,
          from: SMS_CAMPAIGN_CONFIG.defaultFrom, // Add default special number
        };

        // Add text field only for isWithText=0
        if (Number(isWithText) === 0) {
          campaignData.text = String(text);
        }

        logger.info("Creating SMS campaign", {
          name: campaignData.name,
          isWithText: campaignData.isWithText,
          begin_date: campaignData.begin_date,
          begin_time: `${campaignData.begin_hour}:${campaignData.begin_minute}`,
          recipientsCount: numbers.length,
        });

        // Send request to MessagePro API
        const response = await axios.post(
          SMS_CAMPAIGN_CONFIG.apiUrl,
          campaignData,
          {
            headers: {
              "x-api-key": SMS_CAMPAIGN_CONFIG.apiKey,
              "Content-Type": "application/json",
            },
            timeout: SMS_CAMPAIGN_CONFIG.timeout,
          },
        );

        logger.info("SMS campaign created successfully", {
          name: campaignData.name,
          apiResponse: response.data,
          statusCode: response.status,
        });

        // Save campaign to Firestore
        const campaignDoc = {
          name: campaignData.name,
          isWithText: campaignData.isWithText,
          begin_date: campaignData.begin_date,
          begin_hour: campaignData.begin_hour,
          begin_minute: campaignData.begin_minute,
          scheduled_time: `${campaignData.begin_date} ${campaignData.begin_hour}:${campaignData.begin_minute}`,
          numbers_count: numbers.length,
          text: campaignData.isWithText === 0 ? campaignData.text : null,
          status: "scheduled",
          api_response: response.data,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
        };

        const campaignRef = await db.collection("message-campaigns").add(campaignDoc);
        
        logger.info("Campaign saved to Firestore", {
          campaign_id: campaignRef.id,
          name: campaignData.name,
        });

        return res.status(200).json({
          success: true,
          message: "SMS campaign created successfully",
          campaign_id: campaignRef.id,
          campaign: {
            name: campaignData.name,
            scheduled_time: `${campaignData.begin_date} ${campaignData.begin_hour}:${campaignData.begin_minute}`,
            recipients_count: numbers.length,
          },
          api_response: response.data,
        });
      } catch (error) {
        logger.error("Failed to create SMS campaign", {
          error: error.message,
          code: error.code,
          response: error.response && error.response.data,
          statusCode: error.response && error.response.status,
        });

        return res.status(500).json({
          error: "Failed to create SMS campaign",
          message: error.message,
          details: (error.response && error.response.data) || null,
        });
      }
    });
  },
);
