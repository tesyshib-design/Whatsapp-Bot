// =================================================================
//                            app.js
//       (Versi Lengkap Final - Semua Fitur Jadi Satu)
// =================================================================

// --- 1. DEKLARASI LIBRARY ---
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, downloadMediaMessage } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const google = require('google-it');
const sharp = require('sharp');
const path = require('path');

// --- 2. MEMBACA KONFIGURASI & DATABASE ---
const configPath = './config.json';
const dbPath = './database.json';
let config = JSON.parse(fs.readFileSync(configPath));
let db = JSON.parse(fs.readFileSync(dbPath));

// --- 3. FUNGSI HELPER (PEMBANTU) ---
function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 2 }).format(number);
}
function formatLargeNumber(num) {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(num);
}

// --- FUNGSI HELPER: VIEW-ONCE ---
const isViewOnce = (message) => {
    if (!message) return false;
    if (message.viewOnceMessage || message.viewOnceMessageV2) return true;
    const mediaMessage = message.imageMessage || message.videoMessage;
    if (mediaMessage && mediaMessage.viewOnce === true) return true;
    return false;
};

// --- 4. KUMPULAN FUNGSI FITUR ---

// --- FITUR: VIEW-ONCE ---
const handleViewOnce = async (m, sock) => {
    const prefix = config.PREFIX;
    const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
    const isReaction = m.message?.reactionMessage;
    const containsEmoji = m.body && /[\p{Emoji}]/u.test(m.body);
    const isQuotedMsgViewOnce = isViewOnce(m.quoted?.message);
    const reactedToViewOnce = isReaction && isQuotedMsgViewOnce;
    const isEmojiReply = containsEmoji && isQuotedMsgViewOnce;
    const isTriggeredByCmd = cmd === 'view' && isQuotedMsgViewOnce;
    const isTriggered = isTriggeredByCmd || isEmojiReply || reactedToViewOnce;
    if (!isTriggered) return;
    if (!m.quoted) return;
    let msg = m.quoted.message;
    if (msg.viewOnceMessageV2) msg = msg.viewOnceMessageV2.message;
    else if (msg.viewOnceMessage) msg = msg.viewOnceMessage.message;
    const messageType = msg ? Object.keys(msg)[0] : null;
    const isMedia = messageType && ['imageMessage', 'videoMessage', 'audioMessage'].includes(messageType);
    if (!isMedia) return;
    try {
        const buffer = await downloadMediaMessage(m.quoted, 'buffer', {}, { logger: pino({ level: 'silent' }) });
        if (!buffer) return;
        const originalSenderJid = m.quoted.key.participant || m.quoted.key.remoteJid;
        const senderNumber = originalSenderJid.split('@')[0];
        const caption = `> *Media sekali-lihat dari ${senderNumber} berhasil dibuka.*`;
        const recipient = config.TARGET_GROUP_ID;
        if (!recipient || !recipient.endsWith('@g.us')) {
            console.error('[ERROR] Target Group ID not valid or not set.');
            m.reply('Tujuan grup belum diatur. Masuk ke grup target Anda, lalu ketik .setgroup');
            return;
        }
        if (messageType === 'imageMessage') {
            await sock.sendMessage(recipient, { image: buffer, caption: caption });
        } else if (messageType === 'videoMessage') {
            await sock.sendMessage(recipient, { video: buffer, mimetype: 'video/mp4', caption: caption });
        } else if (messageType === 'audioMessage') {
            await sock.sendMessage(recipient, { audio: buffer, mimetype: 'audio/ogg', ptt: true });
        }
        console.log(`[SUCCESS] Success bypassing view-once and sent to target group ${recipient}.`);
    } catch (error) {
        console.error('[ERROR] Failed to bypass media view-once:', error);
    }
};

// --- FITUR: MENU ---
async function showMenu(m, sock) {
    const menuText = `
╭─⬣「 *BOT-Virtech MENU* 」⬣
│
│ Halo! 👋 Saya adalah asisten bot Anda.
│ Silakan gunakan perintah di bawah ini:
│
├─⬣「 *Toko Online* 」
││◦ *\`.katalog\`*
││◦ *\`.pesan [ID produk];[jumlah]\`*
││◦ *\`.tambahproduk [nama];[harga];[stok]\`*
││◦ *\`.hapusproduk [ID produk]\`*
││◦ *\`.updatestok [ID produk];[stok baru]\`*
│└─
├─⬣「 *Utilitas Media* 」
││◦ *Buka Pesan Sekali-Lihat*
││  (Beri reaksi/balas pesan,
││   atau balas dengan \`.view\`)
│└─
├─⬣「 *Analisis Kripto* 」
││◦ *\`.crypto [nama_koin]\`*
││◦ *\`.info [nama_koin]\`*
│└─
├─⬣「 *Hiburan* 」
││◦ *\`.gambar [query]\`*
││◦ *\`.quote [teks];[author]\`*
│└─
├─⬣「 *Grup & Bot* 」
││◦ *\`.setgroup\`*
││◦ *\`.menu\`*
│└─
│
╰─⬣ © Bot Anda 2025 ⬣
`;
    await m.reply(menuText);
}

// --- FITUR: GRUP ---
async function setGroup(m, sock) {
    if (m.from.endsWith('@g.us')) {
        const newGroupId = m.from;
        config.TARGET_GROUP_ID = newGroupId;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log(`[SUCCESS] Target group has been set to: ${newGroupId}`);
        await m.reply(`✅ Berhasil! Grup ini sekarang telah ditetapkan sebagai grup target.`);
    } else {
        await m.reply('❌ Perintah ini hanya bisa digunakan di dalam grup.');
    }
}

// --- FITUR: KRIPTO ---
async function getCryptoPrice(m, sock) {
    const args = m.body.split(' ').slice(1);
    if (args.length === 0) return m.reply('❌ Contoh: `.crypto bitcoin ethereum`');
    const coinIds = args.map(arg => arg.toLowerCase()).join(',');
    const apiUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=idr`;
    try {
        await m.reply('⏳ Mengambil data harga...');
        const response = await axios.get(apiUrl);
        if (Object.keys(response.data).length === 0) return m.reply('Koin tidak ditemukan.');
        let replyText = '📈 *Harga Kripto Terkini (IDR)*\n\n';
        for (const coin in response.data) {
            replyText += `🪙 *${coin.charAt(0).toUpperCase() + coin.slice(1)}*: ${formatRupiah(response.data[coin].idr)}\n`;
        }
        await m.reply(replyText);
    } catch (error) { console.error('[ERROR] Crypto:', error); await m.reply('Maaf, terjadi kesalahan.'); }
}

async function getCoinInfo(m, sock) {
    const coinId = m.body.split(' ')[1]?.toLowerCase();
    if (!coinId) return m.reply('❌ Contoh: `.info bitcoin`');
    try {
        await m.reply(`🔍 Menganalisis *${coinId}*...`);
        const apiUrl = `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
        const response = await axios.get(apiUrl);
        const { name, symbol, market_cap_rank, image, market_data } = response.data;
        const { current_price, price_change_percentage_24h_in_currency, market_cap, total_volume, circulating_supply, ath, ath_date } = market_data;
        const athDate = new Date(ath_date.idr).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
        let replyText = `📊 *Analisis: ${name} (${symbol.toUpperCase()})*\n\n🏅 Peringkat: *#${market_cap_rank}*\n💰 Harga: *${formatRupiah(current_price.idr)}*\n📈 Perubahan 24j: *${price_change_percentage_24h_in_currency.idr.toFixed(2)}%*\n\n🏦 Kapitalisasi Pasar: *${formatRupiah(market_cap.idr)}*\n🔄 Volume 24j: *${formatRupiah(total_volume.idr)}*\n🌍 Suplai Beredar: *${formatLargeNumber(circulating_supply)} ${symbol.toUpperCase()}*\n\n🚀 ATH: *${formatRupiah(ath.idr)}* (Pada ${athDate})`;
        await sock.sendMessage(m.from, { image: { url: image.large }, caption: replyText });
    } catch (error) {
        if (error.response && error.response.status === 404) return m.reply(`Maaf, koin "${coinId}" tidak ditemukan.`);
        console.error('[ERROR] InfoCoin:', error); await m.reply('Maaf, terjadi kesalahan.');
    }
}

// --- FITUR: HIBURAN ---
async function searchGambar(m, sock) {
    const query = m.body.split(' ').slice(1).join(' ');
    if (!query) return m.reply('❌ Contoh: `.gambar kucing lucu`');
    try {
        await m.reply(`🔎 Mencari gambar: *${query}*...`);
        const results = await google({ query, type: 'image', safe: true });
        if (!results || results.length === 0) return m.reply(`Gambar "${query}" tidak ditemukan.`);
        const randomImage = results[Math.floor(Math.random() * results.length)];
        await sock.sendMessage(m.from, { image: { url: randomImage.link }, caption: `*Hasil untuk:* ${query}` });
    } catch (error) { console.error('[ERROR] Gambar:', error); await m.reply('Maaf, terjadi kesalahan.'); }
}

async function createQuoteImage(m, sock) {
    const body = m.body.slice('.quote'.length).trim();
    const parts = body.split(';');
    if (parts.length < 2 || !parts[0] || !parts[1]) return m.reply('❌ Format: `.quote [teks kutipan];[author]`');
    const quoteText = parts[0].trim();
    const authorText = `-${parts[1].trim()}`;
    try {
        await m.reply('🎨 Membuat gambar kutipan...');
        const bgDir = './backgrounds';
        const bgImages = fs.readdirSync(bgDir).filter(f => /\.(jpg|jpeg|png)$/i.test(f));
        if (bgImages.length === 0) return m.reply('❌ Tidak ada gambar di folder `backgrounds`.');
        const randomBg = path.join(bgDir, bgImages[Math.floor(Math.random() * bgImages.length)]);
        const width = 1080, height = 1080;
        const svgText = `<svg width="${width}" height="${height}"><style>.container{width:${width - 100}px;height:${height - 100}px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;color:white;font-family:'Impact',sans-serif;text-shadow:3px 3px 6px rgba(0,0,0,0.8);}.quote{font-size:80px;font-weight:900;line-height:1.2;}.author{font-size:50px;font-style:italic;margin-top:40px;}</style><foreignObject x="50" y="50" width="${width - 100}" height="${height - 100}"><div class="container" xmlns="http://www.w3.org/1999/xhtml"><div class="quote">${quoteText}</div><div class="author">${authorText}</div></div></foreignObject></svg>`;
        const imageBuffer = await sharp(randomBg).resize(width, height, { fit: 'cover' }).composite([{ input: Buffer.from(svgText), top: 0, left: 0 }]).jpeg().toBuffer();
        await sock.sendMessage(m.from, { image: imageBuffer, caption: `Kutipan oleh: ${authorText.slice(1)}` });
    } catch (error) { console.error('[ERROR] Quote:', error); await m.reply('Maaf, terjadi kesalahan.'); }
}

// --- FITUR: TOKO ONLINE ---
async function showCatalog(m, sock) {
    const currentDb = JSON.parse(fs.readFileSync(dbPath));
    if (currentDb.products.length === 0) return m.reply('Belum ada produk di katalog.');
    let catalogText = '🛍️ *Katalog Produk Toko Anda* 🛍️\n\n';
    currentDb.products.forEach(p => { catalogText += `*${p.name}*\n  - ID: \`${p.id}\`\n  - Harga: Rp ${p.price.toLocaleString('id-ID')}\n  - Stok: ${p.stock}\n\n`; });
    await m.reply(catalogText);
}
async function addProduct(m, sock) {
    const args = m.body.slice('.tambahproduk'.length).trim().split(';');
    if (args.length !== 3) return m.reply('❌ Format: `.tambahproduk [nama];[harga];[stok]`');
    const [name, price, stock] = args.map(arg => arg.trim());
    if (!name || isNaN(parseInt(price)) || isNaN(parseInt(stock))) return m.reply('❌ Input tidak valid.');
    const newProduct = { id: `PROD-${Date.now()}`, name, price: parseInt(price), stock: parseInt(stock) };
    db.products.push(newProduct);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    await m.reply(`✅ Produk *${name}* ditambahkan dengan ID \`${newProduct.id}\`.`);
}
async function deleteProduct(m, sock) {
    const productId = m.body.slice('.hapusproduk'.length).trim();
    if (!productId) return m.reply('❌ Format: `.hapusproduk [ID produk]`');
    const initialLength = db.products.length;
    db.products = db.products.filter(p => p.id !== productId);
    if (db.products.length === initialLength) return m.reply(`❌ Produk ID \`${productId}\` tidak ditemukan.`);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    await m.reply(`✅ Produk ID \`${productId}\` berhasil dihapus.`);
}
async function updateStock(m, sock) {
    const args = m.body.slice('.updatestok'.length).trim().split(';');
    if (args.length !== 2) return m.reply('❌ Format: `.updatestok [ID produk];[stok baru]`');
    const [productId, newStock] = args.map(arg => arg.trim());
    const productIndex = db.products.findIndex(p => p.id === productId);
    if (productIndex === -1) return m.reply(`❌ Produk ID \`${productId}\` tidak ditemukan.`);
    db.products[productIndex].stock = parseInt(newStock);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    await m.reply(`✅ Stok *${db.products[productIndex].name}* diubah menjadi ${newStock}.`);
}
async function placeOrder(m, sock) {
    const args = m.body.slice('.pesan'.length).trim().split(';');
    if (args.length !== 2) return m.reply('❌ Format: `.pesan [ID produk];[jumlah]`');
    const [productId, quantity] = args.map(arg => arg.trim());
    const productIndex = db.products.findIndex(p => p.id === productId);
    if (productIndex === -1) return m.reply(`❌ Produk ID \`${productId}\` tidak ditemukan.`);
    const product = db.products[productIndex];
    if (product.stock < parseInt(quantity)) return m.reply(`Maaf, stok *${product.name}* tidak cukup. Sisa: ${product.stock}.`);
    db.products[productIndex].stock -= parseInt(quantity);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    const totalPrice = product.price * parseInt(quantity);
    const customerName = m.pushName || m.sender.split('@')[0];
    await m.reply(`✅ Pesanan diterima!\n\n*Detail:*\n- Produk: *${product.name}*\n- Jumlah: ${quantity}\n- Total: Rp ${totalPrice.toLocaleString('id-ID')}\n\nTerima kasih!`);
    const ownerNotification = `🔔 *Pesanan Baru Masuk!*\n\nDari: *${customerName}*\nProduk: *${product.name}*\nJumlah: ${quantity}\nTotal: Rp ${totalPrice.toLocaleString('id-ID')}`;
    const recipient = config.TARGET_GROUP_ID;
    if (recipient) await sock.sendMessage(recipient, { text: ownerNotification });
}

// --- 5. FUNGSI UTAMA KONEKSI BOT ---
async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('session');
    const sock = makeWASocket({ logger: pino({ level: 'silent' }), auth: state, browser: ['Bot Toko', 'Chrome', '1.0.0'] });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) qrcode.generate(qr, { small: true });
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) connectToWhatsApp();
        } else if (connection === 'open') console.log('[SUCCESS] WhatsApp Connected!');
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.remoteJid === 'status@broadcast') return;

        const getBody = (message) => (message?.conversation || message?.extendedTextMessage?.text || message?.imageMessage?.caption || message?.videoMessage?.caption || message?.reactionMessage?.text || "");
        
        const simpleM = {
            ...msg, from: msg.key.remoteJid, body: getBody(msg.message),
            message: msg.message,
            quoted: msg.message?.extendedTextMessage?.contextInfo?.quotedMessage ? {
                key: { remoteJid: msg.message.extendedTextMessage.contextInfo.remoteJid, participant: msg.message.extendedTextMessage.contextInfo.participant, id: msg.message.extendedTextMessage.contextInfo.stanzaId },
                message: msg.message.extendedTextMessage.contextInfo.quotedMessage
            } : null,
            reply: (text) => sock.sendMessage(msg.key.remoteJid, { text: text }, { quoted: msg })
        };

        // Jalankan logika view-once SEBELUM memproses perintah lain
        await handleViewOnce(simpleM, sock);
        
        const prefix = config.PREFIX;
        if (!simpleM.body.startsWith(prefix)) return;
        const command = simpleM.body.slice(prefix.length).split(' ')[0].toLowerCase();

        try {
            switch (command) {
                // Grup & Bot
                case 'menu': await showMenu(simpleM, sock); break;
                case 'setgroup': await setGroup(simpleM, sock); break;
                // Kripto
                case 'crypto': await getCryptoPrice(simpleM, sock); break;
                case 'info': await getCoinInfo(simpleM, sock); break;
                // Hiburan
                case 'gambar': await searchGambar(simpleM, sock); break;
                case 'quote': await createQuoteImage(simpleM, sock); break;
                // Toko Online
                case 'katalog': await showCatalog(simpleM, sock); break;
                case 'tambahproduk': await addProduct(simpleM, sock); break;
                case 'hapusproduk': await deleteProduct(simpleM, sock); break;
                case 'updatestok': await updateStock(simpleM, sock); break;
                case 'pesan': await placeOrder(simpleM, sock); break;
            }
        } catch (e) { console.error(`[ERROR] Command '${command}':`, e); }
    });
}

// --- 6. JALANKAN BOT ---
connectToWhatsApp();
