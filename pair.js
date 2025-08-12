const express = require('express');
const fs = require('fs');
const path = require('path');
let router = express.Router();
const pino = require("pino");
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore
} = require("baileys");

// Ensure sessions directory exists
const sessionsDir = './sessions';
if (!fs.existsSync(sessionsDir)) {
    fs.mkdirSync(sessionsDir, { recursive: true });
}

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

// Define version information
const version = [2, 3000, 1015901307];

router.get('/', async (req, res) => {
    let num = req.query.number;
    // Generate unique session path for each request
    const sessionId = `session_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const sessionPath = path.join(sessionsDir, sessionId);

    async function PairCode() {
        const {
            state,
            saveCreds
        } = await useMultiFileAuthState(sessionPath);

        try {
            let sock = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                browser: ["Ubuntu", "Chrome", "20.0.04"],
            });

            sock.ev.on('creds.update', saveCreds);
            
            // Handle pairing code request
            if (!sock.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                const code = await sock.requestPairingCode(num);

                if (!res.headersSent) {
                    res.send({ code, version });
                }
            }

            sock.ev.on("connection.update", async (update) => {
                const { connection, lastDisconnect, qr } = update;

                // Handle QR code generation if needed
                if (qr) {
                    console.log("QR received, but pairing code should be used");
                }

                if (connection === "open") {
                    // Wait a moment to ensure session is fully established
                    await delay(2000);
                    
                    // Use in-memory credentials
                    const sessionsock = JSON.stringify(state.creds);
                    
                    // Send session credentials to user
                    const sockses = await sock.sendMessage(sock.user.id, {
                        text: sessionsock
                    });
                    
                    // Send success message
                    await sock.sendMessage(sock.user.id, {
                        text: `✅ *SESSION ID OBTAINED SUCCESSFULLY!*  
📁 Upload SESSION_ID (creds.json) on session folder or add it to your .env file: SESSION_ID=

📢 *Stay Updated — Follow Our Channels:*

➊ *WhatsApp Channel*  
https://whatsapp.com/channel/0029VaXaqHII1rcmdDBBsd3g

➋ *Telegram*  
https://t.me/elitepro_md

➌ *YouTube*  
https://youtube.com/@eliteprotechs

🚫 *Do NOT share your session ID or creds.json with anyone.*

🌐 *Explore more tools on our website:*  
https://eliteprotech.zone.id`,
                        contextInfo: {
                            externalAdReply: {
                                title: 'ELITEPROTECH SESSION-ID GENERATOR',
                                body: 'Join our official channel for more updates',
                                thumbnailUrl: 'http://elitepro-url-clouds.onrender.com/18c0e09bc35e16fae8fe7a34647a5c82.jpg',
                                sourceUrl: 'https://whatsapp.com/channel/0029VaXaqHII1rcmdDBBsd3g',
                                mediaType: 1,
                                renderLargerThumbnail: true
                            }
                        }
                    }, { quoted: sockses });

                    // Add delay before cleanup
                    await delay(3000);
                    
                    // Close connection gracefully
                    await sock.end();
                    
                    // Clean up session files
                    removeFile(sessionPath);
                }

                if (connection === "close") {
                    if (lastDisconnect.error && lastDisconnect.error.output.statusCode !== 401) {
                        // Add delay before reconnecting
                        await delay(2000);
                        removeFile(sessionPath);
                    }
                }
            });
        } catch (err) {
            console.log("Error occurred:", err);
            removeFile(sessionPath);
            if (!res.headersSent) {
                res.send({ code: "Service Unavailable", version });
            }
        }
    }

    return PairCode();
});

process.on('uncaughtException', function (err) {
    let e = String(err);
    if (e.includes("conflict")) return;
    if (e.includes("Socket connection timeout")) return;
    if (e.includes("not-authorized")) return;
    if (e.includes("rate-overlimit")) return;
    if (e.includes("Connection Closed")) return;
    if (e.includes("Timed Out")) return;
    if (e.includes("Value not found")) return;
    console.log('Caught exception: ', err);
});

module.exports = router;
