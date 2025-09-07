import emailjs from '@emailjs/browser';

// EmailJS configuration
const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
const EMAILJS_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;

export interface EventEmailData {
  eventName: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  eventDescription?: string;
  eventLink?: string;
  userName: string;
  userEmail: string;
}

export class EmailService {
  static async sendEventConfirmation(data: EventEmailData): Promise<boolean> {
    if (!EMAILJS_PUBLIC_KEY || !EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID) {
      console.error('EmailJS configuration missing. Please check environment variables.');
      return false;
    }

    try {
      const templateParams = {
        to_email: data.userEmail,
        to_name: data.userName,
        event_name: data.eventName,
        event_date: data.eventDate || 'TBD',
        event_time: data.eventTime || 'TBD',
        event_location: data.eventLocation || 'TBD',
        event_description: data.eventDescription || 'No description provided',
        event_link: data.eventLink || '',
        message: `Hi ${data.userName}, you're confirmed to attend ${data.eventName}!`,
      };

      const result = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      );

      console.log('Email sent successfully:', result);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  static async sendEventReminder(data: EventEmailData): Promise<boolean> {
    if (!EMAILJS_PUBLIC_KEY || !EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID) {
      console.error('EmailJS configuration missing. Please check environment variables.');
      return false;
    }

    try {
      const templateParams = {
        to_email: data.userEmail,
        to_name: data.userName,
        event_name: data.eventName,
        event_date: data.eventDate || 'TBD',
        event_time: data.eventTime || 'TBD',
        event_location: data.eventLocation || 'TBD',
        event_description: data.eventDescription || 'No description provided',
        event_link: data.eventLink || '',
        message: `Hi ${data.userName}, this is a reminder about ${data.eventName}!`,
      };

      const result = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      );

      console.log('Reminder email sent successfully:', result);
      return true;
    } catch (error) {
      console.error('Failed to send reminder email:', error);
      return false;
    }
  }
}
