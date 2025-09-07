"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { EmailService } from '@/lib/email-service';
import { useToast } from '@/hooks/use-toast';
import { Mail } from 'lucide-react';

export function EmailTestButton() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleTestEmail = async () => {
    if (!user?.email) {
      toast({
        title: "No email found",
        description: "Please add an email to your profile to test this feature.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const emailSent = await EmailService.sendEventConfirmation({
        eventName: "Test Event",
        eventDate: "December 25, 2024",
        eventTime: "2:00 PM",
        eventLocation: "Test Location",
        eventDescription: "This is a test event to verify EmailJS is working correctly.",
        eventLink: "https://example.com",
        userName: user.displayName || 'Test User',
        userEmail: user.email,
      });

      if (emailSent) {
        toast({
          title: "Test email sent!",
          description: "Check your email inbox for the test message.",
        });
      } else {
        toast({
          title: "Failed to send test email",
          description: "Please check your EmailJS configuration.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Test email error:', error);
      toast({
        title: "Error",
        description: "Failed to send test email. Please check the console for details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Button
      onClick={handleTestEmail}
      disabled={isLoading || !user.email}
      variant="outline"
      size="sm"
      className="w-full"
    >
      <Mail className="w-4 h-4 mr-2" />
      {isLoading ? 'Sending...' : 'Test EmailJS Setup'}
    </Button>
  );
}
