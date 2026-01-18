'use client';

import React from 'react';
import { Drawer } from 'vaul';
import { LuX } from 'react-icons/lu';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface PrivacyPolicyDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PrivacyPolicyDrawer: React.FC<PrivacyPolicyDrawerProps> = ({
  open,
  onOpenChange,
}) => {
  const isLargeScreen = useMediaQuery('(min-width: 1024px)');

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[60]" />
        <Drawer.Content
          className={
            isLargeScreen
              ? 'bg-white flex flex-col rounded-xl fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] outline-none overflow-hidden w-full max-w-2xl shadow-xl max-h-[90vh]'
              : 'bg-white flex flex-col rounded-t-[20px] fixed bottom-0 left-0 right-0 z-[70] outline-none overflow-hidden max-h-[90vh]'
          }
        >
          <Drawer.Title className="sr-only">Privacy Policy</Drawer.Title>
          <Drawer.Description className="sr-only">
            Outta Privacy Policy
          </Drawer.Description>

          {/* Header with Close Button */}
          <div className="flex items-center justify-between px-5 pt-4 pb-4 border-b border-black-100">
            <h2 className="text-xl font-bold text-malibu-950">Privacy Policy</h2>
            <button
              onClick={() => onOpenChange(false)}
              className="flex items-center justify-center transition-colors hover:opacity-70"
              aria-label="Close"
              type="button"
            >
              <LuX size={24} className="text-malibu-950" />
            </button>
          </div>

          {/* Content */}
          <div className="px-5 py-4 overflow-y-auto flex-1 prose prose-sm max-w-none">
            <p className="text-sm text-black-500 mb-4">Last updated: January 17, 2026</p>

            <h3 className="text-lg font-semibold text-malibu-950 mt-6 mb-3">1. Introduction</h3>
            <p className="text-black-700 mb-4">
              Welcome to Outta (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your privacy and ensuring you have a positive experience on our website and in using our services. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website outta.events or use our services.
            </p>

            <h3 className="text-lg font-semibold text-malibu-950 mt-6 mb-3">2. Information We Collect</h3>
            <p className="text-black-700 mb-2">We may collect information about you in a variety of ways:</p>
            <ul className="list-disc pl-5 text-black-700 mb-4 space-y-2">
              <li><strong>Personal Data:</strong> When you submit an activity or contact us, we may collect personally identifiable information, such as your email address.</li>
              <li><strong>Location Data:</strong> With your permission, we may collect and process information about your location to show you relevant activities near you.</li>
              <li><strong>Usage Data:</strong> We may automatically collect information about how you access and use our website, including your IP address, browser type, and pages visited.</li>
            </ul>

            <h3 className="text-lg font-semibold text-malibu-950 mt-6 mb-3">3. How We Use Your Information</h3>
            <p className="text-black-700 mb-2">We use the information we collect to:</p>
            <ul className="list-disc pl-5 text-black-700 mb-4 space-y-2">
              <li>Provide, operate, and maintain our website and services</li>
              <li>Show you kid-friendly activities and events near your location</li>
              <li>Process and respond to activity submissions</li>
              <li>Improve, personalize, and expand our services</li>
              <li>Communicate with you about updates and new features</li>
              <li>Prevent fraudulent activity and ensure security</li>
            </ul>

            <h3 className="text-lg font-semibold text-malibu-950 mt-6 mb-3">4. Sharing Your Information</h3>
            <p className="text-black-700 mb-4">
              We do not sell, trade, or rent your personal information to third parties. We may share your information with trusted service providers who assist us in operating our website (such as hosting providers), subject to confidentiality agreements.
            </p>

            <h3 className="text-lg font-semibold text-malibu-950 mt-6 mb-3">5. Cookies and Tracking</h3>
            <p className="text-black-700 mb-4">
              We may use cookies and similar tracking technologies to track activity on our website and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
            </p>

            <h3 className="text-lg font-semibold text-malibu-950 mt-6 mb-3">6. Data Security</h3>
            <p className="text-black-700 mb-4">
              We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that no method of transmission over the Internet is 100% secure.
            </p>

            <h3 className="text-lg font-semibold text-malibu-950 mt-6 mb-3">7. Children&apos;s Privacy</h3>
            <p className="text-black-700 mb-4">
              Our service is designed to help families find kid-friendly activities. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
            </p>

            <h3 className="text-lg font-semibold text-malibu-950 mt-6 mb-3">8. Your Rights</h3>
            <p className="text-black-700 mb-2">Depending on your location, you may have the right to:</p>
            <ul className="list-disc pl-5 text-black-700 mb-4 space-y-2">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your personal information</li>
              <li>Opt out of certain data collection or sharing</li>
            </ul>

            <h3 className="text-lg font-semibold text-malibu-950 mt-6 mb-3">9. Changes to This Policy</h3>
            <p className="text-black-700 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
            </p>

            <h3 className="text-lg font-semibold text-malibu-950 mt-6 mb-3">10. Contact Us</h3>
            <p className="text-black-700 mb-4">
              If you have any questions about this Privacy Policy, please contact us at{' '}
              <a href="mailto:rfinch@outta.events" className="text-malibu-600 hover:text-malibu-700 underline">
                rfinch@outta.events
              </a>
            </p>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default PrivacyPolicyDrawer;
