const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require("cors")({ origin: true });

// Constants for news fetching
const API_URL = "https://searchbyhashtags-tavxd22z7q-uc.a.run.app";
const API_KEY = "kj8Vfcbtcx8sx8ghxuKIwH1e1qWjMHlJ";
const SEARCH_ID = "z537rgrHNvbfeK0IUBoA";
const SEARCH_HASHTAGS = ["#алт", "#gold"];

// Helper function to fetch news and save to Firestore
async function fetchAndSaveNews() {
  const db = admin.firestore();
  
  try {
    logger.info("Fetching news from external API", {
      id: SEARCH_ID,
      hashtags: SEARCH_HASHTAGS,
      url: API_URL,
    });

    const response = await axios.post(API_URL, {
      id: SEARCH_ID,
      hashtags: SEARCH_HASHTAGS,
    }, {
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 30000, // 30 seconds timeout
    });

    if (response.status !== 200) {
      throw new Error(`API returned status ${response.status}`);
    }

    const responseData = response.data;
    
    if (!responseData.success) {
      throw new Error(`API returned error: ${responseData.message || "Unknown error"}`);
    }

    const newsArticles = responseData.data || [];
    
    if (newsArticles.length === 0) {
      logger.info("No news articles found", { id: SEARCH_ID, hashtags: SEARCH_HASHTAGS });
      return {
        success: true,
        message: "No news articles found",
        saved_count: 0,
      };
    }

    logger.info(`Found ${newsArticles.length} news articles`, {
      id: SEARCH_ID,
      hashtags: SEARCH_HASHTAGS,
      count: newsArticles.length,
    });

    // Save articles to news collection
    const batch = db.batch();
    let savedCount = 0;

    for (const article of newsArticles) {
      try {
        // Use the article ID as document ID to prevent duplicates
        const newsRef = db.collection("news").doc(article.id);
        
        // Check if article already exists
        const existingDoc = await newsRef.get();
        if (existingDoc.exists) {
          logger.info(`Article already exists, skipping: ${article.id}`);
          continue;
        }

        // Prepare news document
        const newsDoc = {
          id: article.id,
          title: article.title || "",
          title_mn: article.title_mn || "",
          summary_mn: article.summary_mn || "",
          image: article.image || null,
          url: article.url || "",
          hashtags: article.hashtags || [],
          source_name: article.source_name || "",
          category: article.category || null,
          sub_category: article.sub_category || null,
          publishedAt: article.publishedAt ? admin.firestore.Timestamp.fromDate(new Date(article.publishedAt)) : null,
          createdAt: article.createdAt ? admin.firestore.Timestamp.fromDate(new Date(article.createdAt)) : admin.firestore.FieldValue.serverTimestamp(),
          view_count: article.view_count || 0,
          // Additional metadata
          fetched_at: admin.firestore.FieldValue.serverTimestamp(),
          source_hashtags: SEARCH_HASHTAGS,
          source_id: SEARCH_ID,
        };

        batch.set(newsRef, newsDoc);
        savedCount++;
        
        logger.info(`Prepared article for saving: ${article.id}`, {
          title: article.title,
          category: article.category && article.category.name ? article.category.name : "Unknown",
        });
      } catch (articleError) {
        logger.error(`Error processing article ${article.id}`, {
          error: articleError.message,
          article_id: article.id,
        });
      }
    }

    // Commit batch if there are articles to save
    if (savedCount > 0) {
      await batch.commit();
      logger.info(`Successfully saved ${savedCount} news articles to Firestore`, {
        id: SEARCH_ID,
        hashtags: SEARCH_HASHTAGS,
        saved_count: savedCount,
      });
    }

    return {
      success: true,
      message: `Successfully processed ${newsArticles.length} articles, saved ${savedCount} new articles`,
      total_found: newsArticles.length,
      saved_count: savedCount,
      skipped_count: newsArticles.length - savedCount,
    };
  } catch (error) {
    logger.error("Error fetching or saving news", {
      error: error.message,
      stack: error.stack,
      id: SEARCH_ID,
      hashtags: SEARCH_HASHTAGS,
    });
    
    throw new Error(`Failed to fetch or save news: ${error.message}`);
  }
}

// Scheduled function to run once every 24 hours (daily)
exports.fetchGoldNews = onSchedule({
  schedule: "0 9 * * *", // Every day at 9:00 AM
  timeZone: "Asia/Ulaanbaatar",
}, async (event) => {
  try {
    logger.info("Starting scheduled gold news fetch");
    
    const result = await fetchAndSaveNews();
    
    logger.info("Scheduled gold news fetch completed", result);
  } catch (error) {
    logger.error("Scheduled gold news fetch failed", {
      error: error.message,
      stack: error.stack,
    });
  }
});

// Manual trigger endpoint for testing
exports.fetchGoldNewsManual = onRequest({
  memory: "512MiB",
  timeoutSeconds: 120,
  maxInstances: 1,
}, async (req, res) => {
  return cors(req, res, async () => {
    try {
      if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
      }

      logger.info("Manual gold news fetch triggered", {
        id: SEARCH_ID,
        hashtags: SEARCH_HASHTAGS,
      });

      const result = await fetchAndSaveNews();
      
      return res.status(200).json(result);
    } catch (error) {
      logger.error("Manual gold news fetch failed", {
        error: error.message,
        stack: error.stack,
      });
      
      return res.status(500).json({
        error: error.message || "Failed to fetch gold news",
      });
    }
  });
});
