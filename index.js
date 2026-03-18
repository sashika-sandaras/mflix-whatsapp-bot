const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, Browsers, delay } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const pino = require('pino');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', async (req, res) => {
    // Session එක තාවකාලිකව තියාගන්නවා
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: Browsers.macOS('Desktop'),
        printQRInTerminal: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { qr, connection } = update;

        // QR එක ලැබුණම වෙබ් පිටුවේ පෙන්වනවා
        if (qr) {
            if (!res.writableEnded) {
                const url = await QRCode.toDataURL(qr);
                res.send(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>MFlix Bot Login</title>
                        <meta name="viewport" content="width=device-width, initial-scale=1">
                        <style>
                            body { font-family: sans-serif; text-align: center; padding-top: 50px; background: #f4f4f4; }
                            .card { background: white; padding: 30px; border-radius: 15px; display: inline-block; box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
                            img { width: 250px; height: 250px; border: 1px solid #ddd; padding: 10px; border-radius: 10px; }
                            h2 { color: #25D366; }
                        </style>
                    </head>
                    <body>
                        <div class="card">
                            <h2>MFlix WhatsApp Login</h2>
                            <p>කරුණාකර මෙම QR එක ස්කෑන් කරන්න</p>
                            <img src="${url}" />
                            <p style="color: #666; font-size: 12px;">QR එක පරණ වුණොත් පේජ් එක Refresh කරන්න.</p>
                        </div>
                        <script>setTimeout(() => { location.reload(); }, 60000);</script>
                    </body>
                    </html>
                `);
            }
        }

        if (connection === 'open') {
            console.log("✅ සාර්ථකව සම්බන්ධ වුණා!");
            if (!res.writableEnded) res.send("<h1>✅ සාර්ථකව සම්බන්ධ වුණා! දැන් බොට් වැඩ.</h1>");
        }
    });
});

// Railway එකට අත්‍යවශ්‍යම කොටස
app.listen(PORT, '0.0.0.0', () => {
    console.log(`සර්වර් එක පණගැන්වුණා පෝට් එකේ: ${PORT}`);
});
