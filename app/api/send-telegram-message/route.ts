import { type NextRequest, NextResponse } from 'next/server';

// Server-side can access non-prefixed env vars directly,
// but also check NEXT_PUBLIC_ as a fallback if they were set that way.
// For security, BOT_TOKEN and CHAT_ID used by the server ideally should not be NEXT_PUBLIC_
// but if they are, this will still work.
const BOT_TOKEN = process.env.BOT_TOKEN || process.env.NEXT_PUBLIC_BOT_TOKEN || "";
const CHAT_ID = process.env.CHAT_ID || process.env.NEXT_PUBLIC_CHAT_ID || "";

export async function POST(req: NextRequest) {
    if (req.method !== 'POST') {
        return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
    }

    if (!BOT_TOKEN || !CHAT_ID || CHAT_ID === "YOUR_CHAT_ID") {
        console.error("Telegram API route: BOT_TOKEN or CHAT_ID is not configured properly on the server.");
        return NextResponse.json({ error: 'Telegram bot not configured on server.' }, { status: 500 });
    }

    try {
        const { messageText } = await req.json();

        if (!messageText) {
            return NextResponse.json({ error: 'messageText is required' }, { status: 400 });
        }

        const telegramApiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        const response = await fetch(telegramApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: messageText,
                // parse_mode: 'Markdown', // Optional: if you want to use Markdown in your messages
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Failed to send message via Telegram API:', response.status, errorData);
            return NextResponse.json({ error: 'Failed to send message to Telegram', details: errorData }, { status: response.status });
        }

        const responseData = await response.json();
        return NextResponse.json({ success: true, data: responseData }, { status: 200 });

    } catch (error) {
        console.error('Error in send-telegram-message API route:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
