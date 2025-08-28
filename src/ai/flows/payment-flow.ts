'use server';
/**
 * @fileOverview A flow for creating Telegram payment invoices using Telegram Stars.
 *
 * - createPayment - A function that handles the payment invoice creation process.
 * - CreatePaymentInput - The input type for the createPayment function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Load environment variables for local development if needed, but secrets should be set in production environment
import 'dotenv/config';

const CreatePaymentInputSchema = z.object({
  userId: z.string().describe("The user's Telegram ID."),
  boostId: z.string().describe('The ID of the boost being purchased.'),
  price: z.number().describe('The price of the item in Telegram Stars (XTR).'),
});
export type CreatePaymentInput = z.infer<typeof CreatePaymentInputSchema>;


export async function createPayment(input: CreatePaymentInput): Promise<string> {
    return createPaymentFlow(input);
}


const createPaymentFlow = ai.defineFlow(
  {
    name: 'createPaymentFlow',
    inputSchema: CreatePaymentInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

    if (!TELEGRAM_BOT_TOKEN) {
      console.error('TELEGRAM_BOT_TOKEN is not configured.');
      throw new Error('Payment system is not configured. Please contact support.');
    }

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/createInvoiceLink`;

    const payload = {
        title: `MOO Boost ${input.boostId}`,
        description: `Purchase a ${input.boostId} boost for your MOO mining.`,
        payload: `boost-${input.boostId}-${input.userId}`,
        provider_token: '', // Must be empty for Telegram Stars
        currency: 'XTR', // Use XTR for Telegram Stars
        prices: [{ label: `${input.boostId} Boost`, amount: input.price }] // Price in the smallest units of the currency (i.e., number of stars)
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!data.ok) {
            console.error('Telegram API Error:', data);
            throw new Error(`Failed to create invoice link: ${data.description || 'Unknown error from Telegram API'}`);
        }

        return data.result;
    } catch (error) {
        console.error("Error calling Telegram API:", error);
        throw new Error("Could not connect to the payment service.");
    }
  }
);
    
