import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT) || 587,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

async function testMail() {
  try {
    console.log("Attempting to connect to SMTP...");
    console.log("Host:", process.env.EMAIL_SERVER_HOST);
    console.log("Port:", process.env.EMAIL_SERVER_PORT);
    console.log("User:", process.env.EMAIL_SERVER_USER);
    
    const result = await transporter.sendMail({
      from: process.env.EMAIL_FROM || "EMEC Lab Material System <lab-system@company.com>",
      to: "test@emec.co",
      subject: "Test",
      html: "Test",
    });
    console.log("✅ Email sent successfully:", result);
  } catch (error) {
    console.error("❌ SMTP EMAIL SENDING CRITICAL ERROR:", error);
  }
}

testMail();
