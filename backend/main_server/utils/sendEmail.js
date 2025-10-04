import nodemailer from 'nodemailer';

export default async function sendEmail({ email, subject, message }) {
  // Create a test account
  const testAccount = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false, 
    auth: {
      user: testAccount.user, 
      pass: testAccount.pass, 
    },
  });

  const info = await transporter.sendMail({
    from: '"LabRooms" <noreply@labrooms.com>',
    to: email,
    subject: subject,
    text: message,
    html: `<p>${message}</p>`,
  });

  console.log('Message sent: %s', info.messageId);
  console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  
  return info;
}
