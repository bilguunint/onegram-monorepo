const admin = require("firebase-admin");
const serviceAccount = require("../grammgold-firebase.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  serviceAccountId: "firebase-adminsdk-iwbcv@grammgold.iam.gserviceaccount.com",
});

// Auth & payment modules
const requestOtp = require("./auth/requestOtp");
const verifyOtp = require("./auth/verifyOtp");
const setPin = require("./auth/setPin");
const verifyPin = require("./auth/verifyPin");
const changePin = require("./auth/changePin");
const resetPin = require("./auth/resetPin");
const userResetPin = require("./auth/userResetPin");
const { qpayCallback } = require("./payment/qpayCallback");
const { createOrder } = require("./payment/createOrder");
const { createInstallmentPayment } = require("./payment/createInstallmentPayment");
const { installmentCallback } = require("./payment/installmentCallback");
const { createDirectPurchase } = require("./payment/createDirectPurchase");
const { directPurchaseCallback } = require("./payment/directPurchaseCallback");
const { createInstallmentInit } = require("./payment/createInstallmentInit");
const { installmentInitCallback } = require("./payment/installmentInitCallback");
const { verifyOrder } = require("./payment/verifyOrder");
const { crawlGoldRates } = require("./crawler/crawlGoldRate");
const { fetchGoldNews, fetchGoldNewsManual } = require("./crawler/fetchGoldNews");
const { createGift } = require("./payment/createGift");
const { cancelGift } = require("./payment/cancelGift");
const { acceptGift } = require("./payment/acceptGift");
const { withdrawRequest } = require("./payment/withdrawRequest");
const { verifyWithdraw } = require("./payment/verifyWithdraw");
const makeInvest = require("./payment/makeInvest");
const closeInvestment = require("./payment/closeInvestment");
const { scheduledAutoVerifyOrders, initAutoVerifyOrders } = require("./payment/autoVerifyOrders");

// Analytics
const {
  initializeAnalytics,
  getAnalytics,
  onOrderCreated,
  onOrderUpdated,
  onUserCreated,
  refreshAnalytics,
} = require("./analytics/analyticsService");

// Daily Income Analytics
const {
  initializeDailyIncome,
  getDailyIncome,
} = require("./analytics/dailyIncomeService");

// Withdrawal triggers
const {
  onWithdrawCreated,
  onWithdrawUpdated,
} = require("./analytics/withdrawTriggers");

// Withdraw Analytics
const {
  calculateWithdrawAnalytics,
  scheduledWithdrawAnalytics,
} = require("./analytics/withdrawAnalyticsService");

// Gold Balance Distribution
const {
  initGoldBalanceDistribution,
  scheduledGoldBalanceDistribution,
} = require("./analytics/goldBalanceDistribution");

// Imports
const runImport = require("./import/batchUserImport");
const runOrderImport = require("./import/batchOrdersImport");
const runWithdrawImport = require("./import/batchWithdrawsImport");
const runOldPendingOrdersImport = require("./import/batchOrdersPendingOldImport");
const updateBalances = require("./import/updateBalances");
const checkBalances = require("./import/checkBalances");
const batchUpdateInvestments = require("./import/batchUpdateInvestment");
const runCheckInvoices = require("./import/checkInvoices");
const runGetPayments = require("./import/getQPayPayments");
const { createSmsCampaign } = require("./services/createSmsCampaign");
const { sendSavingsRemindersScheduled, sendSavingsReminders } = require("./services/savingsReminderService");
const {
  installmentReminderMorning,
  installmentReminderEvening,
  installmentReminderManual,
} = require("./services/installmentReminderService");
const { sendCustomNotification } = require("./services/customNotificationService");
const { scheduledBackup, manualBackup } = require("./services/backupService");
const { scheduledCampaignStatusUpdate } = require("./payment/lotteryService");
const backfillLotteryTickets = require("./import/backfillLotteryTickets");

if (process.env.RUN_IMPORT === "true") runImport();
if (process.env.RUN_IMPORT_ORDERS === "true") runOrderImport();
if (process.env.RUN_IMPORT_WITHDRAWS === "true") runWithdrawImport();
if (process.env.RUN_IMPORT_OLD_PENDING_ORDERS === "true") runOldPendingOrdersImport();
if (process.env.UPDATE_BALANCES === "true") updateBalances();
if (process.env.CHECK_BALANCES === "true") checkBalances();
if (process.env.UPDATE_INVESTMENTS === "true") batchUpdateInvestments();
if (process.env.RUN_CHECK_INVOICES === "true") runCheckInvoices();
if (process.env.RUN_GET_PAYMENTS === "true") runGetPayments();
if (process.env.RUN_BACKFILL_LOTTERY === "true") backfillLotteryTickets();

// Exports - core
exports.requestOtp = requestOtp;
exports.verifyOtp = verifyOtp;
exports.setPin = setPin;
exports.verifyPin = verifyPin;
exports.changePin = changePin;
exports.resetPin = resetPin;
exports.userResetPin = userResetPin;
exports.qpayCallback = qpayCallback;
exports.createOrder = createOrder;
exports.createInstallmentPayment = createInstallmentPayment;
exports.installmentCallback = installmentCallback;
exports.createDirectPurchase = createDirectPurchase;
exports.directPurchaseCallback = directPurchaseCallback;
exports.createInstallmentInit = createInstallmentInit;
exports.installmentInitCallback = installmentInitCallback;
exports.verifyOrder = verifyOrder;
exports.crawlGoldRates = crawlGoldRates;
exports.fetchGoldNews = fetchGoldNews;
exports.fetchGoldNewsManual = fetchGoldNewsManual;
exports.createGift = createGift;
exports.cancelGift = cancelGift;
exports.acceptGift = acceptGift;
exports.withdrawRequest = withdrawRequest;
exports.verifyWithdraw = verifyWithdraw;
exports.makeInvest = makeInvest;
exports.closeInvestment = closeInvestment;

// Exports - analytics
exports.initializeAnalytics = initializeAnalytics;
exports.getAnalytics = getAnalytics;
exports.onOrderCreated = onOrderCreated;
exports.onOrderUpdated = onOrderUpdated;
exports.onUserCreated = onUserCreated;
exports.refreshAnalytics = refreshAnalytics;

// Exports - daily income analytics
exports.initializeDailyIncome = initializeDailyIncome;
exports.getDailyIncome = getDailyIncome;

// Exports - withdrawal triggers
exports.onWithdrawCreated = onWithdrawCreated;
exports.onWithdrawUpdated = onWithdrawUpdated;

// Exports - withdraw analytics
exports.calculateWithdrawAnalytics = calculateWithdrawAnalytics;
exports.scheduledWithdrawAnalytics = scheduledWithdrawAnalytics;

// Exports - SMS Campaign
exports.createSmsCampaign = createSmsCampaign;

// Exports - Savings Reminder Service
exports.sendSavingsRemindersScheduled = sendSavingsRemindersScheduled;
exports.sendSavingsReminders = sendSavingsReminders;

// Exports - Installment Payment Reminder Service (10:00 + 20:00 UB time)
exports.installmentReminderMorning = installmentReminderMorning;
exports.installmentReminderEvening = installmentReminderEvening;
exports.installmentReminderManual = installmentReminderManual;

// Exports - Custom Notification Service
exports.sendCustomNotification = sendCustomNotification;

// Exports - Backup Service
exports.scheduledBackup = scheduledBackup;
exports.manualBackup = manualBackup;

// Exports - Auto Verify Orders
exports.scheduledAutoVerifyOrders = scheduledAutoVerifyOrders;
exports.initAutoVerifyOrders = initAutoVerifyOrders;

// Exports - Gold Balance Distribution
exports.initGoldBalanceDistribution = initGoldBalanceDistribution;
exports.scheduledGoldBalanceDistribution = scheduledGoldBalanceDistribution;

// Exports - Campaign Status Update
exports.scheduledCampaignStatusUpdate = scheduledCampaignStatusUpdate;
