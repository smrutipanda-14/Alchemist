import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;
const isConfigured = Boolean(
  process.env.EMAIL_USER &&
  process.env.EMAIL_PASS &&
  process.env.EMAIL_PASS !== 'demopassword'
);

if (isConfigured) {
  try {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Non-blocking verification of transporter credentials
    transporter.verify((err) => {
      if (err) {
        console.warn('⚠️ [Nodemailer] SMTP verification failed with configured credentials:', err.message);
        console.warn('   Emails will fallback to server console logs.');
      } else {
        console.log('📬 [Nodemailer] Gmail SMTP transporter ready for live outbound emails.');
      }
    });
  } catch (e) {
    console.warn('⚠️ [Nodemailer] Transporter initialization warning:', e);
  }
} else {
  console.log('ℹ️ [Nodemailer] EMAIL_USER / EMAIL_PASS not set. Running in development console-dispatch mode.');
  console.log('   To enable live emails, generate a Google App Password and add EMAIL_USER & EMAIL_PASS to server/.env');
}

export async function sendVerificationEmail(email: string, code: string, username: string): Promise<boolean> {
  const subject = "🧪 Alchemist's Haven - Verify Your Account";
  const html = `
    <div style="font-family: 'Courier New', monospace; background: #0f0f1b; color: #f1f5f9; padding: 24px; border-radius: 8px; border: 2px solid #7209b7;">
      <h1 style="color: #f6c90e; text-align: center;">⚗️ Alchemist's Haven</h1>
      <p>Greetings, Apprentice <strong>${username}</strong>!</p>
      <p>Your journey into the sacred arts of potion brewing is about to begin. Enter your verification code below to activate your grimoire:</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: bold; background: #16213e; color: #00b4d8; padding: 12px 24px; border-radius: 6px; letter-spacing: 6px; border: 1px dashed #00b4d8;">
          ${code}
        </span>
      </div>
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">May your brews be potent and your focus unbroken.</p>
    </div>
  `;

  console.log(`\n================ EMAIL DISPATCH (DEV & AUDIT) ================`);
  console.log(`To: ${email}`);
  console.log(`Subject: ${subject}`);
  console.log(`Verification Code: ${code}`);
  console.log(`Status: ${transporter ? 'Attempting live SMTP dispatch...' : 'Logged locally (development mode)'}`);
  console.log(`==============================================================\n`);

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"Alchemist's Haven" <${process.env.EMAIL_USER}>`,
        to: email,
        subject,
        html
      });
      console.log(`✅ [Nodemailer] Verification email sent to ${email}`);
      return true;
    } catch (err: any) {
      console.error(`❌ [Nodemailer] Failed to send real email to ${email}:`, err.message);
    }
  }

  return true;
}

export async function sendPasswordResetEmail(email: string, otp: string, username: string): Promise<boolean> {
  const subject = "🔐 Alchemist's Haven - Grimoire Password Reset Code";
  const html = `
    <div style="font-family: 'Courier New', monospace; background: #0f0f1b; color: #f1f5f9; padding: 24px; border-radius: 8px; border: 2px solid #e63946;">
      <h1 style="color: #e63946; text-align: center;">🔥 Seal of Rekindling</h1>
      <p>Alchemist <strong>${username}</strong>,</p>
      <p>A request was made to reset your grimoire credentials. Use the one-time code below within 15 minutes:</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: bold; background: #16213e; color: #f6c90e; padding: 12px 24px; border-radius: 6px; letter-spacing: 6px; border: 1px dashed #f6c90e;">
          ${otp}
        </span>
      </div>
      <p style="color: #cbd5e1; font-size: 13px;"><em>Note: Resetting your password will invalidate all previous login tokens across all devices for your safety.</em></p>
    </div>
  `;

  console.log(`\n================ EMAIL DISPATCH (DEV & AUDIT) ================`);
  console.log(`To: ${email}`);
  console.log(`Subject: ${subject}`);
  console.log(`Password Reset OTP: ${otp}`);
  console.log(`Status: ${transporter ? 'Attempting live SMTP dispatch...' : 'Logged locally (development mode)'}`);
  console.log(`==============================================================\n`);

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"Alchemist's Haven" <${process.env.EMAIL_USER}>`,
        to: email,
        subject,
        html
      });
      console.log(`✅ [Nodemailer] Password reset email sent to ${email}`);
      return true;
    } catch (err: any) {
      console.error(`❌ [Nodemailer] Failed to send real reset email to ${email}:`, err.message);
    }
  }

  return true;
}

