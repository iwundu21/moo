
/**
 * @fileOverview Firebase Cloud Functions for the MOO Telegram Mini App.
 *
 * This file contains the backend logic for handling real-time interactions
 * between the Telegram platform and the Firebase backend, such as processing
 * messages from group chats to reward users.
 */
import "dotenv/config";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

// Retrieve environment variables for Telegram
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GROUP_CHAT_ID = process.env.GROUP_CHAT_ID;

/**
 * Calculates the MOO reward for a user based on their active boosts and eligibility.
 * @param {FirebaseFirestore.DocumentSnapshot} userDoc The user's profile document from Firestore.
 * @return {number} The calculated reward amount. Returns 0 if the user is not eligible.
 */
const calculateReward = (userDoc: FirebaseFirestore.DocumentSnapshot): number => {
    const userData = userDoc.data();
    if (!userData) {
        return 0;
    }

    // Check if user is eligible to earn
    const allTasksCompleted =
        userData.completedSocialTasks?.twitter === "completed" &&
        userData.completedSocialTasks?.telegram === "completed" &&
        userData.completedSocialTasks?.community === "completed" &&
        userData.completedSocialTasks?.referral === "completed";

    if (!userData.isLicenseActive || !allTasksCompleted) {
        return 0; // Not eligible to earn
    }

    // Determine earn rate based on the highest active boost
    if (userData.purchasedBoosts?.includes("10x")) return 35;
    if (userData.purchasedBoosts?.includes("5x")) return 20;
    if (userData.purchasedBoosts?.includes("2x")) return 10;
    return 5; // Base earning rate for licensed and active users
};


/**
 * An HTTP-triggered Cloud Function that acts as a webhook for the Telegram Bot API.
 * It processes messages from a specific group chat and rewards users by updating
 * their pendingBalance in Firestore.
 */
export const telegramWebhook = functions.https.onRequest(async (req, res) => {
    if (!TELEGRAM_BOT_TOKEN || !GROUP_CHAT_ID) {
        functions.logger.error("Telegram Bot Token or Group Chat ID is not configured.");
        res.status(500).send("Internal Server Error: Bot not configured.");
        return;
    }

    // Ensure the request is from Telegram by checking for a message object
    const message = req.body.message;
    if (!message) {
        res.status(200).send("OK: No message to process.");
        return;
    }

    const chatId = message.chat.id.toString();
    const userId = message.from.id.toString();
    const messageText = message.text;

    // Ignore messages that are not from the designated group chat or have no text
    if (chatId !== GROUP_CHAT_ID || !messageText) {
        res.status(200).send("OK: Message ignored.");
        return;
    }

    try {
        const userRef = db.collection("userProfiles").doc(userId);

        // Use a transaction to safely read user data and update their balance
        const rewardAmount = await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);

            if (!userDoc.exists) {
                functions.logger.info(`User ${userId} not found in database. No reward given.`);
                return 0; // User is not in our system
            }

            const reward = calculateReward(userDoc);
            if (reward > 0) {
                const currentPendingBalance = userDoc.data()?.pendingBalance || 0;
                transaction.update(userRef, {
                    pendingBalance: currentPendingBalance + reward,
                });
            }
            return reward;
        });

        if (rewardAmount > 0) {
            functions.logger.info(`Rewarding user ${userId} with ${rewardAmount} MOO.`);
        }

        res.status(200).send(`Processed message for user ${userId}.`);
    } catch (error) {
        functions.logger.error("Error processing message:", error);
        res.status(500).send("Internal Server Error");
    }
});


/**
 * A manually-triggerable HTTP function to set the Telegram webhook.
 * Call this function once after deployment to register the webhook URL with Telegram.
 * E.g., open https://<region>-<project-id>.cloudfunctions.net/setWebhook in your browser.
 */
export const setWebhook = functions.https.onRequest(async (req, res) => {
    if (!TELEGRAM_BOT_TOKEN) {
        res.status(500).send("TELEGRAM_BOT_TOKEN is not set.");
        return;
    }

    // Construct the full webhook URL using the request's hostname.
    // The function name 'telegramWebhook' must match the exported function.
    const functionRegion = process.env.FUNCTION_REGION || "us-central1";
    const projectId = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;
    const webhookUrl = `https://${functionRegion}-${projectId}.cloudfunctions.net/telegramWebhook`;
    
    const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=${webhookUrl}`;

    try {
        const response = await axios.get(telegramApiUrl);
        res.status(200).send({
            message: "Webhook set successfully!",
            url: webhookUrl,
            telegramResponse: response.data,
        });
    } catch (error) {
        functions.logger.error("Failed to set webhook:", error);
        res.status(500).send({
            message: "Failed to set webhook.",
            error: (error as any).message,
        });
    }
});

/**
 * A callable Cloud Function to check if a user is a member of a Telegram channel.
 */
export const checkTelegramMembership = functions.https.onCall(async (data, context) => {
    // It's critical to re-read from process.env inside the function
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
        functions.logger.error("TELEGRAM_BOT_TOKEN is not set in the function's environment.");
        throw new functions.https.HttpsError("failed-precondition", "The bot is not configured on the server. Please contact support.");
    }

    const { userId, channelId } = data;
    if (!userId || !channelId) {
        throw new functions.https.HttpsError("invalid-argument", "The function must be called with 'userId' and 'channelId'.");
    }

    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${channelId}&user_id=${userId}`;

    try {
        const response = await axios.get(telegramApiUrl);
        const memberStatus = response.data?.result?.status;

        // Valid statuses for being "in" the channel/group
        const validStatuses = ["creator", "administrator", "member", "restricted"];
        
        if (validStatuses.includes(memberStatus)) {
            return { isMember: true };
        } else {
            // Log the actual status for debugging if it's not a success status
            functions.logger.warn(`User ${userId} in channel ${channelId} has status: ${memberStatus}`);
            return { isMember: false, reason: `User status is '${memberStatus}'.` };
        }
    } catch (error: any) {
        const errorData = error.response?.data;
        const errorMessage = errorData?.description || "Unknown Telegram API error.";
        functions.logger.error(`Failed to check membership for user ${userId} in channel ${channelId}:`, errorMessage, {
            errorCode: errorData?.error_code,
            requestUrl: `https://api.telegram.org/bot[REDACTED]/getChatMember?chat_id=${channelId}&user_id=${userId}`
        });

        // Check for specific, common errors to give better feedback to the user.
        if (errorData?.error_code === 400 || errorData?.error_code === 403) {
             if (errorMessage.includes("user not found")) {
                return { isMember: false, reason: "user not found" };
            }
            if (errorMessage.includes("bot is not a member") || errorMessage.includes("chat not found")) {
                 throw new functions.https.HttpsError("failed-precondition", "Verification failed: The bot is not an administrator in the target channel/group.");
            }
        }
        
        // For other errors, throw a generic but informative error back to the client.
        throw new functions.https.HttpsError("internal", `An unexpected error occurred. Please try again later. [Code: ${errorData?.error_code || 'N/A'}]`);
    }
});
