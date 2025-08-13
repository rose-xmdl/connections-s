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

function removeFile(FilePath) {
    try {
        if (!fs.existsSync(FilePath)) return false;
        fs.rmSync(FilePath, { recursive: true, force: true });
        return true;
    } catch (err) {
        console.error('Error removing file:', err);
        return false;
    }
}

// Define version information
const version = [2, 3000, 1015901307];

router.get('/', async (req, res) => {
    let num = req.query.number;
    if (!num) {
        return res.status(400).send({ error: "Number parameter is required", version });
    }

    async function PairCode() {
        const sessionDir = path.join(__dirname, 'session');
        
        try {
            // Ensure session directory exists
            if (!fs.existsSync(sessionDir)) {
                fs.mkdirSync(sessionDir, { recursive: true });
            }

            const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

            let sock;
            try {
                sock = makeWASocket({
                    auth: {
                        creds: state.creds,
                        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                    },
                    printQRInTerminal: false,
                    logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                    browser: ["Ubuntu", "Chrome", "20.0.04"],
                });
            } catch (err) {
                console.error("Socket creation error:", err);
                await removeFile(sessionDir);
                if (!res.headersSent) {
                    return res.send({ code: "Service Unavailable", version });
                }
                return;
            }

            if (!sock.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                try {
                    const code = await sock.requestPairingCode(num);
                    if (!res.headersSent) {
                        res.send({ code, version });
                    }
                } catch (err) {
                    console.error("Pairing error:", err);
                    if (!res.headersSent) {
                        res.send({ code: "Pairing Failed", version });
                    }
                    return;
                }
            }

            sock.ev.on('creds.update', saveCreds);
            
            sock.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;

                if (connection === "open") {
                    try {
                        await delay(10000);
                        const credsPath = path.join(sessionDir, 'creds.json');
                        const sessionsock = fs.readFileSync(credsPath, 'utf8');
                        
                        const sockses = await sock.sendMessage(sock.user.id, {
                            text: sessionsock
                        });
                        
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

                        await delay(100);
                        await removeFile(sessionDir);
                    } catch (err) {
                        console.error("Session file error:", err);
                    }
                }

                if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode != 401) {
                    await delay(10000);
                    PairCode().catch(err => console.error("Reconnection error:", err));
                }
            });
        } catch (err) {
            console.error("Main error:", err);
            await removeFile(sessionDir);
            if (!res.headersSent) {
                res.send({ code: "Service Unavailable", version });
            }
        }
    }

    try {
        await PairCode();
    } catch (err) {
        console.error("Outer error:", err);
        if (!res.headersSent) {
            res.status(500).send({ code: "Internal Server Error", version });
        }
    }
});

process.on('uncaughtException', function (err) {
    const e = String(err);
    const ignorableErrors = [
        "conflict",
        "Socket connection timeout",
        "not-authorized",
        "rate-overlimit",
        "Connection Closed",
        "Timed Out",
        "Value not found"
    ];
    
    if (!ignorableErrors.some(error => e.includes(error))) {
        console.log('Caught exception: ', err);
    }
});

module.exports = router;
