
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: NextRequest) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
        console.error("TELEGRAM_BOT_TOKEN is not set in the function's environment.");
        return NextResponse.json({ error: "The bot is not configured on the server. Please contact support." }, { status: 500 });
    }

    try {
        const { userId, channelId } = await req.json();
        if (!userId || !channelId) {
            return NextResponse.json({ error: "The function must be called with 'userId' and 'channelId'." }, { status: 400 });
        }

        const telegramApiUrl = `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${channelId}&user_id=${userId}`;
        const response = await axios.get(telegramApiUrl);
        const memberStatus = response.data?.result?.status;
        
        const validStatuses = ["creator", "administrator", "member", "restricted"];

        if (validStatuses.includes(memberStatus)) {
            return NextResponse.json({ isMember: true });
        } else {
            console.warn(`User ${userId} in channel ${channelId} has status: ${memberStatus}`);
            return NextResponse.json({ isMember: false, reason: `User status is '${memberStatus}'.` });
        }
    } catch (error: any) {
        const errorData = error.response?.data;
        const errorMessage = errorData?.description || "Unknown Telegram API error.";
        
        console.error(`Failed to check membership:`, errorMessage, { errorCode: errorData?.error_code });

        if (errorData?.error_code === 400 || errorData?.error_code === 403) {
             if (errorMessage.includes("user not found")) {
                return NextResponse.json({ isMember: false, reason: "user not found" });
            }
            if (errorMessage.includes("bot is not a member") || errorMessage.includes("chat not found")) {
                 return NextResponse.json({ error: "Verification failed: The bot is not an administrator in the target channel/group." }, { status: 500 });
            }
        }
        
        return NextResponse.json({ error: `An unexpected error occurred. Please try again later. [Code: ${errorData?.error_code || 'N/A'}]` }, { status: 500 });
    }
}
