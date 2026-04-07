import nodemailer from 'nodemailer';

const createTransporter = () => {
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.EMAIL_PORT || '587');
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
    tls: {
      // Do not fail on invalid certs (common in dev environments)
      rejectUnauthorized: false
    }
  });
};

let transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
};

export class EmailService {
  static async sendVerificationEmail(email: string, code: string): Promise<void> {
    try {
      const mailOptions = {
        from: `"CodeGrade Support" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'CodeGrade - Verify Your Email',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px;">
            <h2 style="color: #007bff;">Verify Your Email Address</h2>
            <p>Please use the following code to complete your registration:</p>
            <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
              ${code}
            </div>
            <p>This code expires in 15 minutes.</p>
          </div>
        `,
      };

      await getTransporter().sendMail(mailOptions);
      console.log(`✅ Email sent to: ${email}`);
    } catch (error: any) {
      console.error('❌ Email Error:', error.message);
      // We don't throw here so the user registration doesn't completely crash 
      // if the email service is down during development.
    }
  }
}