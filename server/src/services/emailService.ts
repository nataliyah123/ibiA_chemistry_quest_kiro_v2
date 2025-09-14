// Temporary workaround for Docker build issues
let nodemailer: any = null;

try {
  nodemailer = require('nodemailer');
  console.log('📧 Nodemailer loaded successfully');
} catch (error) {
  console.warn('📧 Nodemailer not available, using console logging for emails');
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: any | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private async initializeTransporter() {
    if (!nodemailer) {
      console.log('📧 Nodemailer not available, email service will use console logging');
      return;
    }

    // Check if email is disabled for development
    if (process.env.EMAIL_DISABLED === 'true') {
      console.log('📧 Email service disabled for development - using console logging');
      this.transporter = null;
      return;
    }

    // Always use Brevo configuration if environment variables are set
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        this.transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: parseInt(process.env.EMAIL_PORT || '587'),
          secure: process.env.EMAIL_PORT === '465',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        console.log('📧 Email service initialized with Brevo SMTP');
        console.log(`📧 Using host: ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT}`);
        console.log(`📧 Using user: ${process.env.EMAIL_USER}`);
        
        // Test the connection
        await this.transporter.verify();
        console.log('📧 Brevo SMTP connection verified successfully');
        
      } catch (error) {
        console.error('📧 Failed to initialize Brevo SMTP:', error);
        console.log('📧 Falling back to console logging for emails');
        this.transporter = null;
      }
    } else if (process.env.NODE_ENV === 'development') {
      // For development, create a test account with Ethereal Email as fallback
      try {
        const testAccount = await nodemailer.createTestAccount();
        
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });

        console.log('📧 Email service initialized with Ethereal Email for development');
        console.log(`📧 Test account: ${testAccount.user}`);
        console.log('📧 In development mode, check console for email preview URLs');
      } catch (error) {
        console.warn('⚠️ Failed to create Ethereal test account, using console logging for emails');
        console.log('📧 Email content will be logged to console instead');
        this.transporter = null;
      }
    } else {
      console.warn('📧 No email configuration found, using console logging');
      this.transporter = null;
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!this.transporter) {
        // Fallback for development - log email to console
        console.log('\n📧 ===== EMAIL (Development Mode) =====');
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Content: ${options.text || options.html}`);
        console.log('📧 =====================================\n');
        return true;
      }

      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@chemquest.dev',
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      if (process.env.NODE_ENV === 'development' && nodemailer) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log('📧 Email sent successfully!');
        console.log('📧 Preview URL: %s', previewUrl);
        console.log('📧 IMPORTANT: Open the preview URL above to see the email content and verification link!');
      }

      return true;
    } catch (error) {
      console.error('📧 Email sending failed:', error);
      return false;
    }
  }

  async sendVerificationEmail(email: string, token: string, username: string): Promise<boolean> {
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Email - ChemQuest</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🧪 Welcome to ChemQuest!</h1>
          </div>
          <div class="content">
            <h2>Hello ${username}!</h2>
            <p>Thank you for joining ChemQuest: Alchemist Academy! To complete your registration and unlock all features, please verify your email address.</p>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 5px;">${verificationUrl}</p>
            
            <p><strong>This verification link will expire in 24 hours.</strong></p>
            
            <p>If you didn't create an account with ChemQuest, you can safely ignore this email.</p>
            
            <p>Happy learning!<br>The ChemQuest Team</p>
          </div>
          <div class="footer">
            <p>© 2024 ChemQuest: Alchemist Academy. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Welcome to ChemQuest: Alchemist Academy!
      
      Hello ${username}!
      
      Thank you for joining ChemQuest! To complete your registration and unlock all features, please verify your email address by clicking the link below:
      
      ${verificationUrl}
      
      This verification link will expire in 24 hours.
      
      If you didn't create an account with ChemQuest, you can safely ignore this email.
      
      Happy learning!
      The ChemQuest Team
    `;

    return this.sendEmail({
      to: email,
      subject: '🧪 Verify Your Email - ChemQuest: Alchemist Academy',
      html,
      text,
    });
  }

  async sendPasswordResetEmail(email: string, token: string, username: string): Promise<boolean> {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your Password - ChemQuest</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hello ${username}!</h2>
            <p>We received a request to reset your password for your ChemQuest account.</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 5px;">${resetUrl}</p>
            
            <p><strong>This reset link will expire in 1 hour.</strong></p>
            
            <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            
            <p>Best regards,<br>The ChemQuest Team</p>
          </div>
          <div class="footer">
            <p>© 2024 ChemQuest: Alchemist Academy. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Password Reset Request - ChemQuest
      
      Hello ${username}!
      
      We received a request to reset your password for your ChemQuest account.
      
      Click the link below to reset your password:
      ${resetUrl}
      
      This reset link will expire in 1 hour.
      
      If you didn't request a password reset, you can safely ignore this email.
      
      Best regards,
      The ChemQuest Team
    `;

    return this.sendEmail({
      to: email,
      subject: '🔐 Reset Your Password - ChemQuest',
      html,
      text,
    });
  }
}

export const emailService = new EmailService();