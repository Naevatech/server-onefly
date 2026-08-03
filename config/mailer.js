// server/config/mailer.js
import nodemailer from 'nodemailer'

if (!process.env.SENDER_EMAIL || !process.env.EMAIL_PASSWORD) {
  console.warn(
    'Email is not fully configured — SENDER_EMAIL/EMAIL_PASSWORD missing from .env. ' +
      'Confirmation emails will fail to send until these are set.',
  )
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SENDER_EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
})

export default transporter