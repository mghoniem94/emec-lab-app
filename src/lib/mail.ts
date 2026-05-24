import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT) || 587,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

export async function sendPasswordResetEmail(email: string, token: string) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const resetLink = `${baseUrl}/auth/new-password?token=${token}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="background-color: #0f172a; padding: 15px; border-radius: 8px 8px 0 0; text-align: center;">
        <h2 style="color: #ffffff; margin: 0; font-size: 20px;">EMEC Laboratory Central Material System</h2>
      </div>
      <div style="padding: 30px 20px; background-color: #ffffff; border-left: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;">
        <h3 style="color: #333333; margin-top: 0;">Password Reset Request</h3>
        <p style="color: #555555; line-height: 1.6;">
          You requested a password reset. Please click the button below to set up a new password for your account.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #ef4444; font-size: 14px; text-align: center; font-weight: 500;">
          This security link will expire in 1 hour.
        </p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0 20px;" />
        <p style="color: #888888; font-size: 12px; text-align: center; margin: 0;">
          If you did not request this email, you can safely ignore it.
        </p>
      </div>
    </div>
  `;

  try {
    const result = await transporter.sendMail({
      from: process.env.EMAIL_FROM || "EMEC Lab Material System <lab-system@company.com>",
      to: email,
      subject: "EMEC Lab - Password Reset Request",
      html: htmlContent,
    });
    console.log("✅ Email sent successfully:", result);
  } catch (error) {
    console.error("❌ SMTP EMAIL SENDING CRITICAL ERROR:", error);
  }
}
