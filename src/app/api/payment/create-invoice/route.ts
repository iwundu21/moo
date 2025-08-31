
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: NextRequest) {
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramProviderToken = process.env.TELEGRAM_PROVIDER_TOKEN;

    if (!telegramBotToken || !telegramProviderToken) {
        console.error("Telegram Bot Token or Provider Token is not configured.");
        return NextResponse.json({ error: "The payment system is not configured on the server." }, { status: 500 });
    }

    try {
        const { amount, payload, title, description } = await req.json();

        if (!amount || !payload || !title || !description) {
            return NextResponse.json({ error: "Missing required invoice parameters." }, { status: 400 });
        }

        const telegramApiUrl = `https://api.telegram.org/bot${telegramBotToken}/createInvoiceLink`;
        const response = await axios.post(telegramApiUrl, {
            provider_token: telegramProviderToken,
            title,
            description,
            payload,
            currency: "XTR", // Currency for Telegram Stars
            prices: [{ label: title, amount }],
        });

        if (response.data.ok) {
            return NextResponse.json({ invoiceUrl: response.data.result });
        } else {
            console.error("Telegram API error:", response.data.description);
            return NextResponse.json({ error: response.data.description || "Failed to create invoice link." }, { status: 500 });
        }
    } catch (error) {
        console.error("Error creating Telegram invoice:", error);
        return NextResponse.json({ error: "Could not create payment invoice." }, { status: 500 });
    }
}
