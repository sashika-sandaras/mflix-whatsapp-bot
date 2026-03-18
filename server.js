const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, Browsers } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', async (req, res) => {
    // Session එක තාවකාලිකව තියාගන්නවා
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const sock = makeWASocket({
        auth: state,
        logger: require('pino')({ level: 'silent' }),
        browser: Browsers.macOS('Desktop')
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { qr, connection } = update;
        
        // QR එක ලැබුණම ඒක Image එකක් විදිහට වෙබ් පේජ් එකේ පෙන්වනවා
        if (qr) {
            QRCode.toDataURL(qr, (err, url) => {
                if (!res.writableEnded) {
                    res.send(`
                        <html>
                            <body style="text-align:center; font-family:Arial; padding-top:50px;">
                                <h1>MFlix Bot Login</h1>
                                <p>කරුණාකර පහත QR එක WhatsApp එකෙන් Scan කරන්න.</p>
                                <img src="${url}" width="300" height="300" />
                                <p>QR එක පරණ වුණොත් පේජ් එක <b>Refresh</b> කරන්න.</p>
                                <script>
                                    // විනාඩියකින් පේජ් එක ඔටෝ රීෆ්‍රෙෂ් වෙලා අලුත් QR එකක් ගනියි
                                    setTimeout(() => { location.reload(); }, 60000);
                                </script>
                            </body>
                        </html>
                    `);
                }
            });
        }

        if (connection === 'open') {
            console.log("✅ CONNECTED!");
            if (!res.writableEnded) res.send("<h1>✅ සාර්ථකව සම්බන්ධ වුණා! දැන් බොට් වැඩ.</h1>");
        }
    });
});

app.listen(port, () => console.log(`සර්වර් එක වැඩ: http://localhost:${port}`));
