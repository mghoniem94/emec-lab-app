import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/mail';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const allowedDomain = process.env.CORPORATE_DOMAIN || "@emec.co";
    if (!email.endsWith(allowedDomain)) {
      return NextResponse.json({ error: "Invalid domain" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Return 200 to prevent email enumeration attacks
      return NextResponse.json({ success: true, message: "If the email is registered, a reset link will be sent." });
    }

    // Delete existing tokens for this email to prevent spam
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    const token = uuidv4();
    const expires = new Date(Date.now() + 3600 * 1000); // 1 hour

    // Save token to DB
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      }
    });

    // Send Email via mail utility
    await sendPasswordResetEmail(email, token);

    return NextResponse.json({ success: true, message: "If the email is registered, a reset link will be sent." });

  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
