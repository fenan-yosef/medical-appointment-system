"use client";

import { useEffect } from 'react';

// Replace with your actual Bot Token, consider using environment variables for security
const BOT_TOKEN = process.env.BOT_TOKEN || "";
// IMPORTANT: Replace 'YOUR_CHAT_ID' with your actual Telegram Chat ID
const CHAT_ID = process.env.CHAT_ID || ""

const DeviceAnalytics = () => {
    useEffect(() => {
        const sendAnalytics = async () => {
            if (typeof window === 'undefined' || typeof navigator === 'undefined') {
                return; // Ensure this runs only on the client side
            }

            try {
                const deviceInfo = {
                    userAgent: navigator.userAgent,
                    language: navigator.language || (navigator as any).userLanguage,
                    platform: navigator.platform,
                    screenWidth: window.screen.width,
                    screenHeight: window.screen.height,
                    viewportWidth: window.innerWidth,
                    viewportHeight: window.innerHeight,
                    cookiesEnabled: navigator.cookieEnabled,
                    doNotTrack: navigator.doNotTrack || "N/A",
                    hardwareConcurrency: navigator.hardwareConcurrency || "N/A",
                    deviceMemory: (navigator as any).deviceMemory || 'N/A',
                    connection: (navigator as any).connection ? {
                        effectiveType: (navigator as any).connection.effectiveType,
                        rtt: (navigator as any).connection.rtt,
                        downlink: (navigator as any).connection.downlink,
                    } : 'N/A',
                    timezoneOffset: new Date().getTimezoneOffset(),
                    timestamp: new Date().toISOString(),
                };

                let messageText = "====== New Website Load ======\n";
                for (const key in deviceInfo) {
                    const value = (deviceInfo as any)[key];
                    if (typeof value === 'object' && value !== null) {
                        messageText += `\n🔹 ${key}:\n`;
                        for (const subKey in value) {
                            messageText += `    ${subKey}: ${value[subKey]}\n`;
                        }
                    } else {
                        messageText += `🔸 ${key}: ${value}\n`;
                    }
                }

                // Truncate message if too long for Telegram (4096 char limit)
                if (messageText.length > 4090) { // A bit of buffer
                    messageText = messageText.substring(0, 4090) + "\n... (truncated)";
                }

                if (CHAT_ID === "YOUR_CHAT_ID") {
                    console.warn("DeviceAnalytics: CHAT_ID is not set. Skipping Telegram message. Device Info:", deviceInfo);
                    return;
                }

                const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        chat_id: CHAT_ID,
                        text: messageText,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('Failed to send analytics to Telegram:', response.status, errorData);
                }
            } catch (error) {
                console.error('Error sending device analytics:', error);
            }
        };

        // Send analytics only once on component mount
        sendAnalytics();
    }, []);

    return null; // This component does not render any UI
};

export default DeviceAnalytics;
