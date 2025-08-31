
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, runTransaction } from 'firebase/firestore';

/**
 * Calculates the MOO reward for a user based on their active boosts and eligibility.
 * @param {any} userData The user's profile data from Firestore.
 * @return {number} The calculated reward amount. Returns 0 if the user is not eligible.
 */
const calculateReward = (userData: any): number => {
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


export async function POST(req: NextRequest) {
    const groupChatId = process.env.GROUP_CHAT_ID;

    if (!groupChatId) {
        console.error("Group Chat ID is not configured.");
        return NextResponse.json({ error: "Internal Server Error: Bot not configured." }, { status: 500 });
    }

    try {
        const body = await req.json();
        const message = body.message;
        
        if (!message) {
            return new NextResponse('OK: No message to process.', { status: 200 });
        }

        const chatId = message.chat.id.toString();
        const userId = message.from.id.toString();
        const messageText = message.text;

        if (chatId !== groupChatId || !messageText) {
            return new NextResponse('OK: Message ignored.', { status: 200 });
        }

        const userRef = doc(db, "userProfiles", userId);

        const rewardAmount = await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);

            if (!userDoc.exists()) {
                console.info(`User ${userId} not found in database. No reward given.`);
                return 0; // User is not in our system
            }

            const reward = calculateReward(userDoc.data());
            if (reward > 0) {
                const currentPendingBalance = userDoc.data()?.pendingBalance || 0;
                transaction.update(userRef, {
                    pendingBalance: currentPendingBalance + reward,
                });
            }
            return reward;
        });

        if (rewardAmount > 0) {
            console.info(`Rewarding user ${userId} with ${rewardAmount} MOO.`);
        }

        return NextResponse.json({ message: `Processed message for user ${userId}.` }, { status: 200 });

    } catch (error) {
        console.error("Error processing webhook:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
