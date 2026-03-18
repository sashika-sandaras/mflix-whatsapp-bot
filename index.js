const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, Browsers } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', async (req, res) => {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const sock = makeWASocket({
        auth: state,
        logger: require('pino')({ level: 'silent' }),
        browser: Browsers.macOS('Desktop')
    });

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', async (update) => {
        const { qr, connection } = update;
        if (qr) {
            QRCode.toDataURL(qr, (err, url) => {
                if (!res.writableEnded) {
                    res.send(`<html><body style="text-align:center;"><img src="${url}" /></body></html>`);
                }
            });
        }
        if (connection === 'open') res.send("<h1>CONNECTED!</h1>");
    });
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
