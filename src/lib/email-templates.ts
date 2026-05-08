/**
 * Premium Email Templates for Yrdly
 * Modern, responsive, and brand-aligned designs.
 */

const APP_NAME = 'Yrdly';
const BRAND_GREEN = '#388E3C';
const BRAND_GREEN_LIGHT = '#82DB7E';
const BRAND_DARK = '#101418';
const BRAND_WHITE = '#FFFFFF';
const BG_COLOR = '#F9FAFB';

// Common CSS for all templates
const commonStyles = `
  body { 
    font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
    margin: 0; padding: 0; background-color: ${BG_COLOR}; 
    color: ${BRAND_DARK};
    line-height: 1.6;
  }
  .container { 
    max-width: 600px; margin: 20px auto; background-color: ${BRAND_WHITE}; 
    border-radius: 16px; overflow: hidden; 
    box-shadow: 0 10px 30px rgba(16, 20, 24, 0.05); 
  }
  .header { 
    background: linear-gradient(135deg, ${BRAND_GREEN} 0%, #2E7D32 100%); 
    padding: 60px 40px; text-align: center; 
  }
  .logo { 
    color: white; font-size: 32px; font-weight: 800; margin-bottom: 8px; 
    letter-spacing: -0.5px;
  }
  .tagline { 
    color: rgba(255,255,255,0.9); font-size: 16px; font-weight: 400; 
  }
  .content { padding: 50px 40px; }
  .title { 
    font-size: 28px; font-weight: 800; color: ${BRAND_DARK}; margin-bottom: 24px; 
    text-align: center; letter-spacing: -0.5px;
  }
  .message { 
    font-size: 16px; color: #4b5563; line-height: 1.7; margin-bottom: 32px; 
  }
  .button-container { text-align: center; margin: 40px 0; }
  .button { 
    display: inline-block; 
    background: linear-gradient(135deg, ${BRAND_GREEN} 0%, ${BRAND_GREEN_LIGHT} 160%); 
    color: white !important; text-decoration: none; padding: 18px 40px; 
    border-radius: 12px; font-weight: 700; font-size: 16px; 
    box-shadow: 0 4px 15px rgba(56, 142, 60, 0.25);
    transition: all 0.3s ease;
  }
  .security-note { 
    background-color: #FFFBEB; border-left: 4px solid #F59E0B; 
    border-radius: 8px; padding: 24px; margin: 32px 0; 
    color: #92400E; font-size: 14px;
  }
  .link-fallback { 
    background-color: #F3F4F6; padding: 20px; border-radius: 10px; 
    margin: 24px 0; font-family: 'Monaco', 'Menlo', monospace; 
    word-break: break-all; color: #6B7280; font-size: 12px;
    border: 1px solid #E5E7EB;
  }
  .footer { 
    background-color: ${BG_COLOR}; padding: 48px 40px; text-align: center; 
    color: #9CA3AF; font-size: 14px; border-top: 1px solid #E5E7EB;
  }
  .footer-links { margin-bottom: 16px; }
  .footer-link { color: ${BRAND_GREEN}; text-decoration: none; margin: 0 10px; font-weight: 500; }
  .social-icons { margin-top: 24px; }
  .social-icon { margin: 0 8px; color: #9CA3AF; text-decoration: none; }
  .highlight { color: ${BRAND_GREEN}; font-weight: 600; }
  .divider { height: 1px; background-color: #E5E7EB; margin: 32px 0; }
  @media only screen and (max-width: 480px) {
    .content { padding: 32px 24px; }
    .header { padding: 48px 24px; }
    .title { font-size: 24px; }
  }
`;

export const emailTemplates = {
  /**
   * Verification Email (Confirm Signup)
   */
  verification: (email: string, verificationLink: string, userName?: string) => {
    const title = `Welcome to the Neighborhood${userName ? `, ${userName}` : ''}! 🎉`;
    const subject = `Welcome to ${APP_NAME}! Please verify your email`;
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>${commonStyles}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🌿 ${APP_NAME}</div>
            <div class="tagline">Your Local Community Network</div>
          </div>
          
          <div class="content">
            <h1 class="title">${title}</h1>
            
            <p class="message">
              We're thrilled to have you join <span class="highlight">${APP_NAME}</span>! Your journey to building a stronger, safer, and more connected neighborhood starts here.
            </p>
            
            <p class="message">
              To complete your registration and unlock all the community features, please confirm your email address by clicking the button below:
            </p>
            
            <div class="button-container">
              <a href="${verificationLink}" class="button">Confirm My Account</a>
            </div>
            
            <div class="security-note">
              <strong>🔒 Security Check:</strong> For your protection, this link will expire in 24 hours. If you didn't sign up for a ${APP_NAME} account, please ignore this email or contact our support team.
            </div>

            <div class="divider"></div>

            <p style="font-size: 15px; color: #6B7280; font-weight: 500; margin-bottom: 12px;">What's next?</p>
            <ul style="color: #4B5563; padding-left: 20px; font-size: 15px;">
              <li style="margin-bottom: 8px;">Connect with verified neighbors around you</li>
              <li style="margin-bottom: 8px;">Browse and post in the safe local marketplace</li>
              <li style="margin-bottom: 8px;">Discover and RSVP to neighborhood events</li>
              <li style="margin-bottom: 8px;">Chat securely with community members</li>
            </ul>
            
            <div class="divider"></div>
            
            <p class="message" style="font-size: 14px; color: #9CA3AF;">
              Trouble clicking the button? Copy and paste this URL into your browser:
            </p>
            <div class="link-fallback">${verificationLink}</div>
            
            <p class="message" style="text-align: center; margin-top: 40px; color: ${BRAND_GREEN}; font-weight: 700;">
              Welcome Home,<br>The ${APP_NAME} Team
            </p>
          </div>
          
          <div class="footer">
            <div class="footer-links">
              <a href="#" class="footer-link">Support</a>
              <a href="#" class="footer-link">Privacy Policy</a>
              <a href="#" class="footer-link">Terms of Service</a>
            </div>
            <p>Sent with ❤️ to <strong>${email}</strong></p>
            <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return { subject, html };
  },

  /**
   * Password Reset Email
   */
  passwordReset: (email: string, resetLink: string, userName?: string) => {
    const subject = `Reset your ${APP_NAME} password`;
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>${commonStyles}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🔒 ${APP_NAME} Security</div>
            <div class="tagline">Protecting Your Neighborhood Profile</div>
          </div>
          
          <div class="content">
            <h1 class="title">Password Reset Request</h1>
            
            <p class="message">
              Hi${userName ? ` ${userName}` : ''},<br><br>
              We received a request to reset the password for your <span class="highlight">${APP_NAME}</span> account. No changes have been made yet.
            </p>
            
            <p class="message">
              You can reset your password by clicking the secure button below:
            </p>
            
            <div class="button-container">
              <a href="${resetLink}" class="button">Reset My Password</a>
            </div>
            
            <div class="security-note">
              <strong>🛡️ Security Alert:</strong> This link will expire in 1 hour for your protection. If you did not request this password reset, please secure your account by changing your email password and contact us immediately.
            </div>
            
            <p class="message" style="font-size: 14px; color: #9CA3AF;">
              If the button above doesn't work, copy and paste this link into your browser:
            </p>
            <div class="link-fallback">${resetLink}</div>
            
            <p class="message" style="margin-top: 40px; font-size: 15px;">
              Stay safe,<br>
              <strong>The ${APP_NAME} Security Team</strong>
            </p>
          </div>
          
          <div class="footer">
            <div class="footer-links">
              <a href="#" class="footer-link">Help Center</a>
              <a href="#" class="footer-link">Security Tips</a>
            </div>
            <p>This security notification was sent to <strong>${email}</strong></p>
            <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return { subject, html };
  },

  /**
   * Post-Verification Welcome Email
   */
  welcome: (userName: string, location: string) => {
    const subject = `🎉 You're in! Welcome to the ${location} Neighborhood`;
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ${APP_NAME}</title>
        <style>
          ${commonStyles}
          .feature-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px; 
            margin: 30px 0; 
          }
          .feature-card { 
            background: #F9FAFB; 
            padding: 24px; 
            border-radius: 12px; 
            text-align: center;
            border: 1px solid #F3F4F6;
          }
          .feature-icon { font-size: 24px; margin-bottom: 12px; }
          .feature-title { font-weight: 700; color: ${BRAND_DARK}; margin-bottom: 8px; font-size: 15px; }
          .feature-text { font-size: 13px; color: #6B7280; line-height: 1.5; }
          @media only screen and (max-width: 480px) {
            .feature-grid { grid-template-columns: 1fr; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🎉 ${APP_NAME}</div>
            <div class="tagline">Neighborhood Network Confirmed</div>
          </div>
          
          <div class="content">
            <h1 class="title">Welcome, ${userName}!</h1>
            
            <p class="message" style="text-align: center;">
              Your account has been successfully verified. You are now a member of the <span class="highlight">${location}</span> community on ${APP_NAME}.
            </p>
            
            <div class="feature-grid">
              <div class="feature-card">
                <div class="feature-icon">🏠</div>
                <div class="feature-title">Your Feed</div>
                <div class="feature-text">Stay updated with neighborhood news and local posts.</div>
              </div>
              <div class="feature-card">
                <div class="feature-icon">🛍️</div>
                <div class="feature-title">Marketplace</div>
                <div class="feature-text">Buy and sell safely with neighbors you can trust.</div>
              </div>
              <div class="feature-card">
                <div class="feature-icon">📅</div>
                <div class="feature-title">Events</div>
                <div class="feature-text">Find block parties, meetups, and local activities.</div>
              </div>
              <div class="feature-card">
                <div class="feature-icon">💬</div>
                <div class="feature-title">Real-time Chat</div>
                <div class="feature-text">Message community members instantly and securely.</div>
              </div>
            </div>
            
            <div class="button-container">
              <a href="https://yrdly-app.vercel.app/home" class="button">Go to My Neighborhood</a>
            </div>
            
            <p class="message" style="text-align: center; font-style: italic; color: #6B7280;">
              We're so glad to have you here. Let's build something great together.
            </p>
            
            <p class="message" style="text-align: center; margin-top: 40px; color: ${BRAND_GREEN}; font-weight: 700;">
              Warmly,<br>The ${APP_NAME} Community Team
            </p>
          </div>
          
          <div class="footer">
            <p>You're receiving this because you successfully joined ${APP_NAME}.</p>
            <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return { subject, html };
  },

  /**
   * Ticket Purchase Confirmation Email
   */
  ticketConfirmation: (
    attendeeName: string,
    email: string,
    eventName: string,
    tierName: string,
    ticketId: string, // URL-safe version of ticket UUID
    qrUrl: string, // Full URL to a viewable QR code
    dateStr: string,
    timeStr: string,
    locationStr: string,
    orderId: string
  ) => {
    const subject = `Your Ticket: ${eventName}`;
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Ticket</title>
        <style>
          ${commonStyles}
          .ticket-card {
            background: #fff;
            border-radius: 16px;
            border: 2px dashed #E5E7EB;
            padding: 32px;
            margin: 32px 0;
            text-align: center;
          }
          .qr-code {
            max-width: 250px;
            margin: 0 auto 24px auto;
            display: block;
            border-radius: 8px;
            border: 4px solid #fff;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          }
          .ticket-meta {
            text-align: left;
            background: #F9FAFB;
            padding: 20px;
            border-radius: 12px;
            margin-top: 24px;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            border-bottom: 1px solid #E5E7EB;
            padding: 12px 0;
          }
          .meta-row:last-child { border-bottom: none; }
          .meta-label { color: #6B7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
          .meta-value { color: ${BRAND_DARK}; font-weight: 600; font-size: 14px; text-align: right; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🎟️ ${APP_NAME} Events</div>
            <div class="tagline">Your digital ticket is ready!</div>
          </div>
          
          <div class="content">
            <h1 class="title">See you there, ${attendeeName}!</h1>
            
            <p class="message" style="text-align: center;">
              Your purchase was successful. Have your ticket ready to be scanned at the entrance.
            </p>
            
            <div class="ticket-card">
              <h2 style="margin: 0 0 24px 0; font-size: 20px; color: ${BRAND_DARK};">${eventName}</h2>
              
              <img src="${qrUrl}" alt="Ticket QR Code" class="qr-code" />
              <div style="font-family: monospace; font-size: 12px; color: #9CA3AF; margin-bottom: 24px;">ID: ${ticketId.split('-')[0].toUpperCase()}...</div>
              
              <div class="ticket-meta">
                <div class="meta-row">
                  <span class="meta-label">Ticket Type</span>
                  <span class="meta-value">${tierName}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">Date</span>
                  <span class="meta-value">${dateStr}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">Time</span>
                  <span class="meta-value">${timeStr}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">Location</span>
                  <span class="meta-value">${locationStr}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">Order Ref</span>
                  <span class="meta-value">${orderId}</span>
                </div>
              </div>
            </div>
            
            <div class="button-container">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/tickets/${ticketId}" class="button">View Ticket Online</a>
            </div>
            
            <p class="message" style="text-align: center; font-style: italic; color: #6B7280; font-size: 14px;">
              Can't make it? Contact the organizer through the event page.
            </p>
          </div>
          
          <div class="footer">
            <p>You're receiving this because you purchased a ticket on ${APP_NAME}.</p>
            <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return { subject, html };
  }
};
