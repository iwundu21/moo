
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: NextRequest) {
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!telegramBotToken) {
        return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN is not set in the environment variables." }, { status: 500 });
    }
    
    const host = req.headers.get('host');
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const webhookUrl = `${protocol}://${host}/api/telegram/webhook`;
    
    const telegramApiUrl = `https://api.telegram.org/bot${telegramBotToken}/setWebhook`;

    try {
        const response = await axios.post(telegramApiUrl, {
            url: webhookUrl,
            allowed_updates: ["message"]
        });

        if (response.data.ok) {
            return NextResponse.json({
                message: "Webhook set successfully!",
                url: webhookUrl,
                telegramResponse: response.data,
            }, { status: 200 });
        } else {
             console.error("Telegram API error on setWebhook:", response.data);
             return NextResponse.json({
                message: `Failed to set webhook. Telegram says: ${response.data.description}`,
                error_code: response.data.error_code,
            }, { status: 400 });
        }
    } catch (error: any) {
        console.error("Failed to set webhook:", error.response ? error.response.data : error.message);
        return NextResponse.json({
            message: "Failed to set webhook.",
            error: error.message || "An unknown error occurred.",
        }, { status: 500 });
    }
}
