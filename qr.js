const { makeid } = require('./gen-id');
const express = require('express');
const fs = require('fs');
let router = express.Router();
const pino = require("pino");
const { default: makeWASocket, useMultiFileAuthState, delay, Browsers, makeCacheableSignalKeyStore, getAggregateVotesInPollMessage, DisconnectReason, WA_DEFAULT_EPHEMERAL, jidNormalizedUser, proto, getDevice, generateWAMessageFromContent, fetchLatestBaileysVersion, makeInMemoryStore, getContentType, generateForwardMessageContent, downloadContentFromMessage, jidDecode } = require('baileys')

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get('/', async (req, res) => {
    const id = makeid();
    let num = req.query.number;
    async function GIFTED_MD_PAIR_CODE() {
        const {
            state,
            saveCreds
        } = await useMultiFileAuthState('./temp/' + id);
        try {
            var items = ["Safari"];
            function selectRandomItem(array) {
                var randomIndex = Math.floor(Math.random() * array.length);
                return array[randomIndex];
            }
            var randomItem = selectRandomItem(items);
            
            let sock = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                generateHighQualityLinkPreview: true,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                syncFullHistory: false,
                browser: Browsers.macOS(randomItem)
            });
            if (!sock.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                const code = await sock.requestPairingCode(num);
                if (!res.headersSent) {
                    await res.send({ code });
                }
            }
            sock.ev.on('creds.update', saveCreds);
            sock.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;
                
                if (connection == "open") {
                    await delay(5000);
                    let rf = __dirname + `/temp/${id}/creds.json`;
                    
                    try {
                        const sessionData = fs.readFileSync(rf, 'utf8');
                        let md = "NARUTO-XMD~" + sessionData;
                        let code = await sock.sendMessage(sock.user.id, { text: md });
                        let desc = `✅ *SESSION ID OBTAINED SUCCESSFULLY!*  
📁 Upload the creds.json file to your session folder.

📢 *Stay Updated — Follow Our Channels:*

➊ *WhatsApp Channel*  
https://whatsapp.com/channel/0029VaXaqHII1rcmdDBBsd3g

➋ *Telegram*  
https://t.me/elitepro_md

➌ *YouTube*  
https://youtube.com/@eliteprotechs

🚫 *Do NOT share your session ID or creds.json with anyone.*

🌐 *Explore more tools on our website:*  
https://eliteprotech.zone.id
`;
                        await sock.sendMessage(sock.user.id, {
                            text: desc,
                            contextInfo: {
                                externalAdReply: {
                                    title: "Successfully Generated Session",
                        body: 'EliteProTech Session Generator',
                        thumbnailUrl: "https://files.catbox.moe/1jquts.jpg",
                        sourceUrl: "https://whatsapp.com/channel/0029VaXaqHII1rcmdDBBsd3g",
                                    mediaType: 1,
                                    renderLargerThumbnail: true
                                }
                            }
                        }, { quoted: code });
                    } catch (e) {
                        let ddd = sock.sendMessage(sock.user.id, { text: e });
                        let desc = `✅ *SESSION ID OBTAINED SUCCESSFULLY!*  
📁 Upload the creds.json file to your session folder.

📢 *Stay Updated — Follow Our Channels:*

➊ *WhatsApp Channel*  
https://whatsapp.com/channel/0029VaXaqHII1rcmdDBBsd3g

➋ *Telegram*  
https://t.me/elitepro_md

➌ *YouTube*  
https://youtube.com/@eliteprotechs

🚫 *Do NOT share your session ID or creds.json with anyone.*

🌐 *Explore more tools on our website:*  
https://eliteprotech.zone.id
`;
                        await sock.sendMessage(sock.user.id, {
                            text: desc,
                            contextInfo: {
                                externalAdReply: {
                                    title: "Successfully Generated Session",
                        body: 'EliteProTech Session Generator',
                                    thumbnailUrl: "https://files.catbox.moe/1jquts.jpg",
                                    sourceUrl: "https://whatsapp.com/channel/0029VaXaqHII1rcmdDBBsd3g",
                                    mediaType: 2,
                                    renderLargerThumbnail: true,
                                    showAdAttribution: true
                                }
                            }
                        }, { quoted: ddd });
                    }
                    await delay(10);
                    await sock.ws.close();
                    await removeFile('./temp/' + id);
                    console.log(`👤 ${sock.user.id} 𝗖𝗼𝗻𝗻𝗲𝗰𝘁𝗲𝗱 ✅ 𝗥𝗲𝘀𝘁𝗮𝗿𝘁𝗶𝗻𝗴 𝗽𝗿𝗼𝗰𝗲𝘀𝘀...`);
                    await delay(10);
                    process.exit();
                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode != 401) {
                    await delay(10);
                    GIFTED_MD_PAIR_CODE();
                }
            });
        } catch (err) {
            console.log("service restated");
            await removeFile('./temp/' + id);
            if (!res.headersSent) {
                await res.send({ code: "❗ Service Unavailable" });
            }
        }
    }
    return await GIFTED_MD_PAIR_CODE();
});

module.exports = router;
