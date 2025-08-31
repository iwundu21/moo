
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: NextRequest) {
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!telegramBotToken) {
        return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN is not set." }, { status: 500 });
    }
    
    // The host of the request includes the full domain, including the Vercel/Firebase preview URL.
    const host = req.headers.get('host');
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const webhookUrl = `${protocol}://${host}/api/telegram/webhook`;
    const telegramApiUrl = `https://api.telegram.org/bot${telegramBotToken}/setWebhook?url=${webhookUrl}`;

    try {
        const response = await axios.get(telegramApiUrl);
        return NextResponse.json({
            message: "Webhook set successfully!",
            url: webhookUrl,
            telegramResponse: response.data,
        }, { status: 200 });
    } catch (error: any) {
        console.error("Failed to set webhook:", error);
        return NextResponse.json({
            message: "Failed to set webhook.",
            error: error.message,
        }, { status: 500 });
    }
}
