import * as brevo from '@getbrevo/brevo';

// Initialize Brevo API
const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY!);

export class BrevoEmailService {
  /**
   * Send email verification email using Brevo with Firebase fallback
   */
  static async sendVerificationEmail(email: string, verificationLink: string, userName?: string) {
    // Check if Brevo API key is configured
    if (!process.env.BREVO_API_KEY || process.env.BREVO_API_KEY === 'your_brevo_api_key_here') {
      console.warn('Brevo API key not configured, falling back to Firebase email verification');
      throw new Error('BREVO_NOT_CONFIGURED');
    }

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    
    sendSmtpEmail.subject = 'Welcome to Yrdly! Please verify your email';
    sendSmtpEmail.htmlContent = this.getVerificationEmailHTML(email, verificationLink, userName);
    sendSmtpEmail.textContent = this.getVerificationEmailText(email, verificationLink, userName);
    
    // Set sender information
    sendSmtpEmail.sender = { 
      name: 'Yrdly', 
      email: process.env.BREVO_FROM_EMAIL || 'noreply@yrdly.com' 
    };
    
    // Set recipient
    sendSmtpEmail.to = [{ 
      email: email, 
      name: userName || 'User' 
    }];
    
    // Set reply-to (optional)
    sendSmtpEmail.replyTo = { 
      email: 'support@yrdly.com', 
      name: 'Yrdly Support' 
    };
    
    try {
      const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log('Verification email sent successfully via Brevo:', result);
      return result;
    } catch (error) {
      console.error('Error sending verification email via Brevo:', error);
      throw new Error('BREVO_SEND_FAILED');
    }
  }

  /**
   * Send password reset email using Brevo
   */
  static async sendPasswordResetEmail(email: string, resetLink: string, userName?: string) {
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    
    sendSmtpEmail.subject = 'Reset your Yrdly password';
    sendSmtpEmail.htmlContent = this.getPasswordResetEmailHTML(email, resetLink, userName);
    sendSmtpEmail.textContent = this.getPasswordResetEmailText(email, resetLink, userName);
    
    sendSmtpEmail.sender = { 
      name: 'Yrdly', 
      email: process.env.BREVO_FROM_EMAIL || 'noreply@yrdly.com' 
    };
    
    sendSmtpEmail.to = [{ 
      email: email, 
      name: userName || 'User' 
    }];
    
    try {
      const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log('Password reset email sent successfully via Brevo:', result);
      return result;
    } catch (error) {
      console.error('Error sending password reset email via Brevo:', error);
      throw new Error('Failed to send password reset email. Please try again.');
    }
  }

  /**
   * Get HTML content for verification email
   */
  private static getVerificationEmailHTML(email: string, verificationLink: string, userName?: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - Yrdly</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
            margin: 0; padding: 0; background-color: #f8fafc; 
            line-height: 1.6;
          }
          .container { 
            max-width: 600px; margin: 0 auto; background-color: #ffffff; 
            border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); 
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            padding: 50px 30px; text-align: center; 
          }
          .logo { 
            color: white; font-size: 32px; font-weight: bold; margin-bottom: 10px; 
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
          }
          .tagline { 
            color: rgba(255,255,255,0.95); font-size: 18px; font-weight: 300; 
          }
          .content { padding: 50px 40px; }
          .title { 
            font-size: 28px; font-weight: bold; color: #1f2937; margin-bottom: 20px; 
            text-align: center;
          }
          .message { 
            font-size: 16px; color: #4b5563; line-height: 1.7; margin-bottom: 30px; 
          }
          .button { 
            display: inline-block; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; text-decoration: none; padding: 18px 36px; 
            border-radius: 10px; font-weight: bold; font-size: 16px; 
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            transition: all 0.3s ease;
          }
          .button:hover { 
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
          }
          .security-note { 
            background-color: #fef3c7; border-left: 4px solid #f59e0b; 
            border-radius: 8px; padding: 20px; margin: 30px 0; 
            color: #92400e; font-size: 14px;
          }
          .link-fallback { 
            background-color: #f3f4f6; padding: 20px; border-radius: 8px; 
            margin: 25px 0; font-family: 'Monaco', 'Menlo', monospace; 
            word-break: break-all; color: #374151; font-size: 13px;
            border: 1px solid #e5e7eb;
          }
          .footer { 
            background-color: #f8fafc; padding: 40px 30px; text-align: center; 
            color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb;
          }
          .features { 
            background-color: #f9fafb; padding: 30px; border-radius: 8px; 
            margin: 30px 0; border: 1px solid #e5e7eb;
          }
          .features h3 { 
            color: #1f2937; margin-bottom: 15px; font-size: 18px; 
          }
          .features ul { 
            margin: 0; padding-left: 20px; color: #4b5563; 
          }
          .features li { 
            margin-bottom: 8px; 
          }
          .button-container { 
            text-align: center; margin: 40px 0; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🏘️ Yrdly</div>
            <div class="tagline">Your Neighborhood Network</div>
          </div>
          
          <div class="content">
            <h1 class="title">Welcome to Yrdly! 🎉</h1>
            
            <p class="message">
              Hi${userName ? ` ${userName}` : ''}!<br><br>
              Thank you for joining Yrdly - your local neighborhood network where neighbors become friends and communities become stronger.
            </p>
            
            <p class="message">
              To complete your registration and start connecting with your neighbors, please verify your email address by clicking the button below:
            </p>
            
            <div class="button-container">
              <a href="${verificationLink}" class="button">Verify My Email Address</a>
            </div>
            
            <div class="security-note">
              <strong>🔒 Security Note:</strong> This verification link will expire in 24 hours for your security. If you didn't create an account with Yrdly, please ignore this email.
            </div>
            
            <div class="features">
              <h3>Once verified, you'll be able to:</h3>
              <ul>
                <li>🤝 Connect with your neighbors</li>
                <li>🛒 Buy and sell items locally</li>
                <li>📅 Discover local events and businesses</li>
                <li>💬 Chat with community members</li>
                <li>🏠 Build a stronger neighborhood</li>
              </ul>
            </div>
            
            <p class="message">
              If the button doesn't work, you can also copy and paste this link into your browser:
            </p>
            
            <div class="link-fallback">
              ${verificationLink}
            </div>
            
            <p class="message" style="text-align: center; font-style: italic; color: #6b7280;">
              Welcome to the neighborhood!<br>
              <strong>The Yrdly Team</strong>
            </p>
          </div>
          
          <div class="footer">
            <p>This email was sent to <strong>${email}</strong></p>
            <p>If you have any questions, please contact our support team at support@yrdly.com</p>
            <p>&copy; 2024 Yrdly. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get text content for verification email
   */
  private static getVerificationEmailText(email: string, verificationLink: string, userName?: string): string {
    return `
Welcome to Yrdly! 🎉

Hi${userName ? ` ${userName}` : ''}!

Thank you for joining Yrdly - your local neighborhood network where neighbors become friends and communities become stronger.

To complete your registration and start connecting with your neighbors, please verify your email address by clicking the link below:

${verificationLink}

🔒 Security Note: This verification link will expire in 24 hours for your security. If you didn't create an account with Yrdly, please ignore this email.

Once verified, you'll be able to:
• Connect with your neighbors
• Buy and sell items locally
• Discover local events and businesses
• Chat with community members
• Build a stronger neighborhood

Welcome to the neighborhood!
The Yrdly Team

---
This email was sent to ${email}
If you have any questions, please contact our support team at support@yrdly.com
© 2024 Yrdly. All rights reserved.
    `;
  }

  /**
   * Get HTML content for password reset email
   */
  private static getPasswordResetEmailHTML(email: string, resetLink: string, userName?: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password - Yrdly</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; padding: 0; background-color: #f8fafc; 
          }
          .container { 
            max-width: 600px; margin: 0 auto; background-color: #ffffff; 
            border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); 
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            padding: 50px 30px; text-align: center; 
          }
          .logo { 
            color: white; font-size: 32px; font-weight: bold; margin-bottom: 10px; 
          }
          .content { padding: 50px 40px; }
          .title { 
            font-size: 28px; font-weight: bold; color: #1f2937; margin-bottom: 20px; 
            text-align: center;
          }
          .button { 
            display: inline-block; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; text-decoration: none; padding: 18px 36px; 
            border-radius: 10px; font-weight: bold; font-size: 16px; 
          }
          .security-note { 
            background-color: #fef3c7; border-left: 4px solid #f59e0b; 
            border-radius: 8px; padding: 20px; margin: 30px 0; 
            color: #92400e; font-size: 14px;
          }
          .footer { 
            background-color: #f8fafc; padding: 40px 30px; text-align: center; 
            color: #6b7280; font-size: 14px; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🏘️ Yrdly</div>
            <div style="color: rgba(255,255,255,0.95); font-size: 18px;">Your Neighborhood Network</div>
          </div>
          
          <div class="content">
            <h1 class="title">Reset Your Password</h1>
            
            <p style="font-size: 16px; color: #4b5563; line-height: 1.7; margin-bottom: 30px;">
              Hi${userName ? ` ${userName}` : ''}!<br><br>
              We received a request to reset your password for your Yrdly account.
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${resetLink}" class="button">Reset My Password</a>
            </div>
            
            <div class="security-note">
              <strong>🔒 Security Note:</strong> This password reset link will expire in 1 hour for your security. If you didn't request this reset, please ignore this email.
            </div>
            
            <p style="font-size: 16px; color: #4b5563; line-height: 1.7; margin-top: 30px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <span style="word-break: break-all; color: #374151; font-family: monospace; background: #f3f4f6; padding: 10px; border-radius: 4px; display: inline-block; margin-top: 10px;">${resetLink}</span>
            </p>
          </div>
          
          <div class="footer">
            <p>This email was sent to <strong>${email}</strong></p>
            <p>If you have any questions, please contact our support team at support@yrdly.com</p>
            <p>&copy; 2024 Yrdly. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get text content for password reset email
   */
  private static getPasswordResetEmailText(email: string, resetLink: string, userName?: string): string {
    return `
Reset Your Password - Yrdly

Hi${userName ? ` ${userName}` : ''}!

We received a request to reset your password for your Yrdly account.

To reset your password, please click the link below:

${resetLink}

🔒 Security Note: This password reset link will expire in 1 hour for your security. If you didn't request this reset, please ignore this email.

If you have any questions, please contact our support team at support@yrdly.com

© 2024 Yrdly. All rights reserved.
    `;
  }
}
