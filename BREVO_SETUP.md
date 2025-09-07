# Brevo Email Service Setup Guide

This guide will help you set up Brevo email service for Yrdly's email verification system.

## 1. Create Brevo Account

1. Go to [brevo.com](https://brevo.com)
2. Sign up for a free account
3. Verify your email address

## 2. Get API Key

1. Log in to your Brevo dashboard
2. Go to **Settings** → **API Keys**
3. Click **Create a new API key**
4. Give it a name like "Yrdly App"
5. Copy the API key (starts with `xkeys-`)

## 3. Set Up Domain (Optional but Recommended)

For better deliverability and to avoid spam filters:

1. Go to **Settings** → **Senders & IP**
2. Click **Add a domain**
3. Add your domain (e.g., `yrdly.com`)
4. Follow the DNS setup instructions:
   - Add SPF record: `v=spf1 include:spf.brevo.com ~all`
   - Add DKIM record (provided by Brevo)
   - Add DMARC record: `v=DMARC1; p=quarantine; rua=mailto:dmarc@yrdly.com`

## 4. Configure Environment Variables

Add these to your `.env.local` file:

```env
# Brevo Email Service Configuration
BREVO_API_KEY=xkeys-your-api-key-here
BREVO_FROM_EMAIL=noreply@yrdly.com
```

**Important:** Replace `xkeys-your-api-key-here` with your actual API key from step 2.

## 5. Test the Integration

1. Start your development server: `npm run dev`
2. Go to the signup page
3. Create a new account
4. Check your email for the verification email

## 6. Monitor Email Delivery

1. Go to **Statistics** → **Email** in your Brevo dashboard
2. Monitor delivery rates, opens, and clicks
3. Check for any bounces or spam reports

## Troubleshooting

### Emails Going to Spam
- Set up SPF, DKIM, and DMARC records
- Use a custom domain for sending
- Avoid spam trigger words in subject lines
- Keep your sending reputation clean

### API Key Not Working
- Make sure the API key is correct
- Check that the key has the right permissions
- Verify the environment variable is loaded correctly

### High Bounce Rate
- Clean your email list regularly
- Use double opt-in for signups
- Monitor your sender reputation

## Brevo Pricing

- **Free Tier**: 300 emails/day (9,000/month)
- **Starter**: €25/month for 20,000 emails
- **Business**: €65/month for 100,000 emails

## Support

- Brevo Documentation: [developers.brevo.com](https://developers.brevo.com)
- Brevo Support: Available in your dashboard
- Yrdly Support: support@yrdly.com

## Security Notes

- Never commit your API key to version control
- Use environment variables for all sensitive data
- Regularly rotate your API keys
- Monitor API usage for unusual activity
