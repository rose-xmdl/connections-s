const express = require('express');
const fs = require('fs');
let router = express.Router();
const pino = require("pino");
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore
} = require("baileys");

// Remove folder utility
function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

// Define version information
const version = [2, 3000, 1015901307];

router.get('/', async (req, res) => {
    let num = req.query.number;
    if (!num) return res.status(400).send({ error: 'Number required', version });

    async function PairCode() {
        // Create a unique session folder per request
        const sessionPath = `./session_${Date.now()}`;
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

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

            // Request pairing code
            if (!sock.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                const code = await sock.requestPairingCode(num);

                if (!res.headersSent) {
                    await res.send({ code, version });
                }
            }

            sock.ev.on('creds.update', saveCreds);

            sock.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;

                if (connection == "open") {
                    await delay(10000);
                    const sessionsock = fs.readFileSync(sessionPath + '/creds.json', 'utf8');

                    const sockses = await sock.sendMessage(sock.user.id, { text: sessionsock });
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
                    removeFile(sessionPath); // delete only this session
                }

                if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output?.statusCode != 401) {
                    await delay(10000);
                    PairCode();
                }
            });
        } catch (err) {
            console.log("service restarted", err);
            removeFile(sessionPath);
            if (!res.headersSent) {
                await res.send({ code: "Service Unavailable", version });
            }
        }
    }

    return await PairCode();
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
