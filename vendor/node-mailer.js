const nodemailer = require('nodemailer');
const { translate } = require('@vitalets/google-translate-api');
const Configure = require('../libs/Service/Configure');
require('dotenv').config();

class NodeMailer {
    constructor() {
    }

    async sendMail(params) {
        let transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: Configure.read('mailer.user'),
                pass: Configure.read('mailer.pass'),
            },
        });

        let mailOptions = {
            from: `"${process.env.APP_NAME || 'Bislig Cultural'}" <${Configure.read('mailer.user')}>`,
            to: params.to,
            subject: params.subject,
            html: `<h1>${params.header}</h1><p>${params.content}</p>`,
            text: `${params.header}\n\n${params.content}`
        };

        if (Configure.read('mailer.mailer')) {
            try {
                let info = await transporter.sendMail(mailOptions);
                console.log('Message sent: %s', info.messageId);
            } catch (error) {
                console.error('Error sending email:', error);
            }
        }
    }
}

module.exports = NodeMailer;
