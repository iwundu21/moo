
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
    
    // Pass the webhook URL as a query parameter, which is a more robust method.
    const telegramApiUrl = `https://api.telegram.org/bot${telegramBotToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}&allowed_updates=${encodeURIComponent(JSON.stringify(["message"]))}`;

    try {
        // Use a simple GET request now that all parameters are in the URL.
        const response = await axios.get(telegramApiUrl);

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
