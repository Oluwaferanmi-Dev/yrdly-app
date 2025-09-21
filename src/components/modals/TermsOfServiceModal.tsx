"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface TermsOfServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TermsOfServiceModal({ open, onOpenChange }: TermsOfServiceModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Terms of Service</DialogTitle>
          <DialogDescription>
            Last updated: {new Date().toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 text-sm">
            <section>
              <h3 className="font-semibold text-lg mb-3">1. Acceptance of Terms</h3>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using Yrdly, you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-3">2. Use License</h3>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Permission is granted to temporarily download one copy of Yrdly per device for personal, 
                non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>modify or copy the materials</li>
                <li>use the materials for any commercial purpose or for any public display</li>
                <li>attempt to reverse engineer any software contained on Yrdly</li>
                <li>remove any copyright or other proprietary notations from the materials</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-3">3. User Responsibilities</h3>
              <p className="text-muted-foreground leading-relaxed mb-3">
                As a user of Yrdly, you agree to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Be respectful — no harmful, offensive, or illegal content</li>
                <li>You own your content, but by posting you let Yrdly display and promote it</li>
                <li>You are responsible for your account and activity</li>
                <li>Yrdly helps connect buyers, sellers & event-goers, but we are not responsible for the quality, safety, or delivery of items or events</li>
                <li>If you break the rules, your account may be suspended or removed</li>
                <li>By using Yrdly, you agree to follow these Terms and our Privacy Policy</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-3">4. Content and Conduct</h3>
              <p className="text-muted-foreground leading-relaxed">
                Users are responsible for all content they post on Yrdly. We reserve the right to remove content that violates 
                our community guidelines or is otherwise inappropriate. Users must not post content that is illegal, harmful, 
                threatening, abusive, or violates any third-party rights.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-3">5. Marketplace and Transactions</h3>
              <p className="text-muted-foreground leading-relaxed">
                Yrdly facilitates connections between buyers and sellers but is not responsible for the quality, safety, 
                or delivery of items or services. All transactions are between users, and Yrdly acts only as a platform 
                for connection. Users are responsible for their own transactions and disputes.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-3">6. Privacy Policy</h3>
              <p className="text-muted-foreground leading-relaxed">
                Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the service, 
                to understand our practices.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-3">7. Termination</h3>
              <p className="text-muted-foreground leading-relaxed">
                We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, 
                under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-3">8. Changes to Terms</h3>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. 
                If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-3">9. Contact Information</h3>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at support@yrdly.ng
              </p>
            </section>
          </div>
        </ScrollArea>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

