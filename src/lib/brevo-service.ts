import * as brevo from '@getbrevo/brevo';
import { emailTemplates } from './email-templates';

// Initialize Brevo API
const apiInstance = new brevo.TransactionalEmailsApi();
if (process.env.BREVO_API_KEY) {
  apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
}

export class BrevoEmailService {
  /**
   * Check if Brevo is properly configured
   */
  static isConfigured(): boolean {
    return !!(
      process.env.BREVO_API_KEY && 
      process.env.BREVO_API_KEY !== 'your_brevo_api_key_here' &&
      process.env.BREVO_FROM_EMAIL
    );
  }

  /**
   * Get configuration status for debugging
   */
  static getConfigurationStatus() {
    return {
      hasApiKey: !!(process.env.BREVO_API_KEY && process.env.BREVO_API_KEY !== 'your_brevo_api_key_here'),
      hasFromEmail: !!process.env.BREVO_FROM_EMAIL,
      isFullyConfigured: this.isConfigured()
    };
  }

  /**
   * Generate a manual verification link as fallback
   */
  static generateManualVerificationLink(userId: string, email: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yrdly-app.vercel.app';
    return `${baseUrl}/onboarding/verify-email?token=${userId}&email=${encodeURIComponent(email)}`;
  }

  /**
   * Send email verification email using Brevo with premium template
   */
  static async sendVerificationEmail(email: string, verificationLink: string, userName?: string) {
    if (!this.isConfigured()) {
      throw new Error('BREVO_NOT_CONFIGURED');
    }

    const { subject, html } = emailTemplates.verification(email, verificationLink, userName);
    
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = html;
    sendSmtpEmail.textContent = `Welcome to Yrdly! Please verify your email here: ${verificationLink}`;
    
    sendSmtpEmail.sender = { 
      name: 'Yrdly', 
      email: process.env.BREVO_FROM_EMAIL || 'noreply@yrdly.ng' 
    };
    
    sendSmtpEmail.to = [{ email, name: userName || 'User' }];
    sendSmtpEmail.replyTo = { email: 'support@yrdly.ng', name: 'Yrdly Support' };
    
    try {
      return await apiInstance.sendTransacEmail(sendSmtpEmail);
    } catch (error: any) {
      console.error('Error sending verification email via Brevo:', error);
      throw new Error('BREVO_SEND_FAILED');
    }
  }

  /**
   * Send welcome email using Brevo with premium template
   */
  static async sendWelcomeEmail(email: string, userName: string, data: {
    username: string;
    location: string;
  }) {
    if (!this.isConfigured()) {
      throw new Error('BREVO_NOT_CONFIGURED');
    }

    const { subject, html } = emailTemplates.welcome(userName, data.location);
    
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = html;
    sendSmtpEmail.textContent = `Welcome to Yrdly, ${userName}! Your account is confirmed.`;
    
    sendSmtpEmail.sender = { 
      name: 'Yrdly', 
      email: process.env.BREVO_FROM_EMAIL || 'noreply@yrdly.ng' 
    };
    
    sendSmtpEmail.to = [{ email, name: userName }];
    sendSmtpEmail.replyTo = { email: 'support@yrdly.ng', name: 'Yrdly Support' };
    
    try {
      return await apiInstance.sendTransacEmail(sendSmtpEmail);
    } catch (error) {
      console.error('Error sending welcome email via Brevo:', error);
      throw new Error('Failed to send welcome email.');
    }
  }

  /**
   * Send password reset email using Brevo with premium template
   */
  static async sendPasswordResetEmail(email: string, resetLink: string, userName?: string) {
    if (!this.isConfigured()) {
      throw new Error('BREVO_NOT_CONFIGURED');
    }

    const { subject, html } = emailTemplates.passwordReset(email, resetLink, userName);
    
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = html;
    sendSmtpEmail.textContent = `Reset your Yrdly password. Link: ${resetLink}`;
    
    sendSmtpEmail.sender = { 
      name: 'Yrdly Security', 
      email: process.env.BREVO_FROM_EMAIL || 'noreply@yrdly.ng' 
    };
    
    sendSmtpEmail.to = [{ email, name: userName || 'User' }];
    
    try {
      return await apiInstance.sendTransacEmail(sendSmtpEmail);
    } catch (error) {
      console.error('Error sending password reset email via Brevo:', error);
      throw new Error('Failed to send password reset email.');
    }
  }

  /**
   * Send event confirmation email using Brevo
   * (Keeping this one separate or we could move it to templates too)
   */
  static async sendEventConfirmationEmail(data: {
    attendeeEmail: string;
    attendeeName: string;
    eventName: string;
    eventDate?: string;
    eventTime?: string;
    eventLocation?: string;
    eventDescription?: string;
    eventLink?: string;
  }) {
    if (!this.isConfigured()) {
      throw new Error('BREVO_NOT_CONFIGURED');
    }

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = `🎉 You're attending: ${data.eventName}!`;
    
    // We could move this to templates.ts later for consistency
    sendSmtpEmail.htmlContent = `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>You're Attending: ${data.eventName}</h2>
        <p>Hi ${data.attendeeName}, you've successfully RSVP'd!</p>
        <p><strong>Date:</strong> ${data.eventDate || 'TBD'}</p>
        <p><strong>Location:</strong> ${data.eventLocation || 'TBD'}</p>
        <a href="${data.eventLink || '#'}" style="background: #388E3C; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Event Details</a>
      </div>
    `;
    
    sendSmtpEmail.sender = { name: 'Yrdly Events', email: process.env.BREVO_FROM_EMAIL || 'noreply@yrdly.ng' };
    sendSmtpEmail.to = [{ email: data.attendeeEmail, name: data.attendeeName }];
    
    try {
      return await apiInstance.sendTransacEmail(sendSmtpEmail);
    } catch (error) {
      console.error('Error sending event confirmation email:', error);
      throw new Error('Failed to send event confirmation.');
    }
  }
}
