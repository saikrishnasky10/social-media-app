const nodemailer = require('nodemailer');

exports.sendEmail = async ( options ) => {

    var transporter = nodemailer.createTransport({
        host: "smtp.mailtrap.io",
        port: 2525,
        auth: {
          user: "68e84746b46a91",
          pass: "e44ee533d888b5"
        }
      });

    const mailOptions = {
        from : process.env.SMTP_MAIL,
        to : options.email,
        subject : options.subject,
        text : options.message,
    }

    await transporter.sendMail(mailOptions)
}