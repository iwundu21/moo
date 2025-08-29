/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Initialize the Firebase Admin SDK
initializeApp();
const db = getFirestore();

/**
 * A scheduled function that runs every hour to distribute pending balances to all users.
 */
export const hourlyDistribution = onSchedule("every 1 hours", async (event) => {
  logger.info("Starting hourly distribution of pending balances for all users.", {
    timestamp: event.timestamp,
  });

  const usersRef = db.collection("userProfiles");
  const snapshot = await usersRef.get();

  if (snapshot.empty) {
    logger.info("No users found. Skipping distribution.");
    return;
  }

  const batch = db.batch();
  let processedCount = 0;

  snapshot.forEach((doc) => {
    const user = doc.data();

    // Check if the user has a pending balance to distribute
    if (user.pendingBalance && user.pendingBalance > 0) {
      const userRef = usersRef.doc(doc.id);
      
      // Atomically increment the mainBalance and reset pendingBalance
      batch.update(userRef, {
        mainBalance: FieldValue.increment(user.pendingBalance),
        pendingBalance: 0,
      });

      processedCount++;
    }
  });

  if (processedCount > 0) {
    try {
      await batch.commit();
      logger.info(`Successfully distributed balances for ${processedCount} users.`);
    } catch (error) {
      logger.error("Error committing batch for hourly distribution:", error);
    }
  } else {
    logger.info("No users with pending balances to distribute.");
  }
});
