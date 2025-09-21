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

interface PrivacyPolicyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrivacyPolicyModal({ open, onOpenChange }: PrivacyPolicyModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Privacy Policy</DialogTitle>
          <DialogDescription>
            Last updated: {new Date().toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 text-sm">
            <section>
              <h3 className="font-semibold text-lg mb-3">1. Information We Collect</h3>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We collect information you provide directly to us, such as when you create an account, 
                use our services, or contact us for support. This may include:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Name, email address, and profile information</li>
                <li>Content you post, including text, images, and location data</li>
                <li>Messages and communications with other users</li>
                <li>Payment information for marketplace transactions</li>
                <li>Device information and usage data</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-3">2. How We Use Your Information</h3>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send technical notices, updates, and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Monitor and analyze trends and usage</li>
                <li>Personalize and improve your experience</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-3">3. Information Sharing</h3>
              <p className="text-muted-foreground leading-relaxed">
                We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, 
                except as described in this policy. We may share your information in the following circumstances:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 mt-3">
                <li>With other users as part of the service (e.g., your profile information)</li>
                <li>With service providers who assist us in operating our platform</li>
                <li>When required by law or to protect our rights</li>
                <li>In connection with a business transfer or acquisition</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-3">4. Data Security</h3>
              <p className="text-muted-foreground leading-relaxed">
                We implement appropriate security measures to protect your personal information against unauthorized access, 
                alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic 
                storage is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-3">5. Location Data</h3>
              <p className="text-muted-foreground leading-relaxed">
                Yrdly is a location-based service. We collect and use location information to help you connect with 
                neighbors and discover local content. You can control location sharing through your device settings 
                and app preferences.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-3">6. Cookies and Tracking</h3>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, 
                and provide personalized content. You can control cookie settings through your browser preferences.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-3">7. Your Rights</h3>
              <p className="text-muted-foreground leading-relaxed mb-3">
                You have the right to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Access and update your personal information</li>
                <li>Delete your account and associated data</li>
                <li>Opt out of certain communications</li>
                <li>Request a copy of your data</li>
                <li>Object to certain processing activities</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-3">8. Children&apos;s Privacy</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our service is not intended for children under 13 years of age. We do not knowingly collect personal 
                information from children under 13. If we become aware that we have collected personal information 
                from a child under 13, we will take steps to delete such information.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-3">9. Changes to This Policy</h3>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
                the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. You are advised to review 
                this Privacy Policy periodically for any changes.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-3">10. Contact Us</h3>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <div className="mt-2 p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  Email: privacy@yrdly.ng<br />
                  Address: Yrdly Privacy Team<br />
                  Support: support@yrdly.ng
                </p>
              </div>
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

