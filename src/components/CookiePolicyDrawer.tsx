'use client';

import React from 'react';
import { Drawer } from 'vaul';
import { LuX } from 'react-icons/lu';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface CookiePolicyDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CookiePolicyDrawer: React.FC<CookiePolicyDrawerProps> = ({
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
          <Drawer.Title className="sr-only">Cookie Policy</Drawer.Title>
          <Drawer.Description className="sr-only">
            Outta Cookie Policy
          </Drawer.Description>

          {/* Header with Close Button */}
          <div className="flex items-center justify-between px-5 pt-4 pb-4 border-b border-black-100">
            <h2 className="text-xl font-bold text-malibu-950">Cookie Policy</h2>
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
            <p className="text-sm text-black-500 mb-4">Last updated: January 18, 2026</p>

            <p className="text-black-700 mb-4">
              This Cookie Policy explains how Outta (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; and &quot;our&quot;) uses cookies and similar technologies to recognize you when you visit our website at{' '}
              <a href="https://outta.events" className="text-malibu-600 hover:text-malibu-700 underline">
                https://outta.events
              </a>{' '}
              (&quot;Website&quot;). It explains what these technologies are and why we use them, as well as your rights to control our use of them.
            </p>

            <p className="text-black-700 mb-4">
              In some cases we may use cookies to collect personal information, or that becomes personal information if we combine it with other information.
            </p>

            <h3 className="text-lg font-semibold text-malibu-950 mt-6 mb-3">What are cookies?</h3>
            <p className="text-black-700 mb-4">
              Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.
            </p>
            <p className="text-black-700 mb-4">
              Cookies set by the website owner (in this case, Outta) are called &quot;first-party cookies.&quot; Cookies set by parties other than the website owner are called &quot;third-party cookies.&quot; Third-party cookies enable third-party features or functionality to be provided on or through the website (e.g., advertising, interactive content, and analytics). The parties that set these third-party cookies can recognize your computer both when it visits the website in question and also when it visits certain other websites.
            </p>

            <h3 className="text-lg font-semibold text-malibu-950 mt-6 mb-3">Why do we use cookies?</h3>
            <p className="text-black-700 mb-4">
              We use first- and third-party cookies for several reasons. Some cookies are required for technical reasons in order for our Website to operate, and we refer to these as &quot;essential&quot; or &quot;strictly necessary&quot; cookies. Other cookies also enable us to track and target the interests of our users to enhance the experience on our Online Properties. Third parties serve cookies through our Website for advertising, analytics, and other purposes. This is described in more detail below.
            </p>

            <h3 className="text-lg font-semibold text-malibu-950 mt-6 mb-3">How can I control cookies?</h3>
            <p className="text-black-700 mb-4">
              You have the right to decide whether to accept or reject cookies. You can exercise your cookie rights by setting your preferences in the Cookie Consent Manager. The Cookie Consent Manager allows you to select which categories of cookies you accept or reject. Essential cookies cannot be rejected as they are strictly necessary to provide you with services.
            </p>
            <p className="text-black-700 mb-4">
              The Cookie Consent Manager can be found in the notification banner and on our Website. If you choose to reject cookies, you may still use our Website though your access to some functionality and areas of our Website may be restricted. You may also set or amend your web browser controls to accept or refuse cookies.
            </p>

            <h4 className="text-base font-semibold text-malibu-950 mt-5 mb-2">Analytics and customization cookies:</h4>
            <p className="text-black-700 mb-4">
              These cookies collect information that is used either in aggregate form to help us understand how our Website is being used or how effective our marketing campaigns are, or to help us customize our Website for you.
            </p>

            <div className="bg-black-50 rounded-lg p-4 mb-4 text-sm">
              <div className="mb-3">
                <p className="text-black-700"><strong>Name:</strong> s7</p>
                <p className="text-black-700"><strong>Purpose:</strong> Gather data regarding site usage and user behavior on the website.</p>
                <p className="text-black-700"><strong>Provider:</strong> www.outta.events</p>
                <p className="text-black-700"><strong>Service:</strong> Adobe Analytics</p>
                <p className="text-black-700"><strong>Type:</strong> html_local_storage</p>
                <p className="text-black-700"><strong>Expires in:</strong> persistent</p>
              </div>
              <div>
                <p className="text-black-700"><strong>Name:</strong> vt</p>
                <p className="text-black-700"><strong>Provider:</strong> maps.googleapis.com</p>
                <p className="text-black-700"><strong>Type:</strong> pixel_tracker</p>
                <p className="text-black-700"><strong>Expires in:</strong> session</p>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-malibu-950 mt-6 mb-3">How can I control cookies on my browser?</h3>
            <p className="text-black-700 mb-2">
              As the means by which you can refuse cookies through your web browser controls vary from browser to browser, you should visit your browser&apos;s help menu for more information. The following is information about how to manage cookies on the most popular browsers:
            </p>
            <ul className="list-disc pl-5 text-black-700 mb-4 space-y-1">
              <li><a href="https://support.google.com/chrome/answer/95647#zippy=%2Callow-or-block-cookies" target="_blank" rel="noopener noreferrer" className="text-malibu-600 hover:text-malibu-700 underline">Chrome</a></li>
              <li><a href="https://support.microsoft.com/en-us/windows/delete-and-manage-cookies-168dab11-0753-043d-7c16-ede5947fc64d" target="_blank" rel="noopener noreferrer" className="text-malibu-600 hover:text-malibu-700 underline">Internet Explorer</a></li>
              <li><a href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop" target="_blank" rel="noopener noreferrer" className="text-malibu-600 hover:text-malibu-700 underline">Firefox</a></li>
              <li><a href="https://support.apple.com/en-ie/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-malibu-600 hover:text-malibu-700 underline">Safari</a></li>
              <li><a href="https://support.microsoft.com/en-us/windows/microsoft-edge-browsing-data-and-privacy-bb8174ba-9d73-dcf2-9b4a-c582b4e640dd" target="_blank" rel="noopener noreferrer" className="text-malibu-600 hover:text-malibu-700 underline">Edge</a></li>
              <li><a href="https://help.opera.com/en/latest/web-preferences/" target="_blank" rel="noopener noreferrer" className="text-malibu-600 hover:text-malibu-700 underline">Opera</a></li>
            </ul>

            <p className="text-black-700 mb-2">
              In addition, most advertising networks offer you a way to opt out of targeted advertising. If you would like to find out more information, please visit:
            </p>
            <ul className="list-disc pl-5 text-black-700 mb-4 space-y-1">
              <li><a href="http://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className="text-malibu-600 hover:text-malibu-700 underline">Digital Advertising Alliance</a></li>
              <li><a href="https://youradchoices.ca/" target="_blank" rel="noopener noreferrer" className="text-malibu-600 hover:text-malibu-700 underline">Digital Advertising Alliance of Canada</a></li>
              <li><a href="http://www.youronlinechoices.com/" target="_blank" rel="noopener noreferrer" className="text-malibu-600 hover:text-malibu-700 underline">European Interactive Digital Advertising Alliance</a></li>
            </ul>

            <h3 className="text-lg font-semibold text-malibu-950 mt-6 mb-3">What about other tracking technologies, like web beacons?</h3>
            <p className="text-black-700 mb-4">
              Cookies are not the only way to recognize or track visitors to a website. We may use other, similar technologies from time to time, like web beacons (sometimes called &quot;tracking pixels&quot; or &quot;clear gifs&quot;). These are tiny graphics files that contain a unique identifier that enables us to recognize when someone has visited our Website or opened an email including them. This allows us, for example, to monitor the traffic patterns of users from one page within a website to another, to deliver or communicate with cookies, to understand whether you have come to the website from an online advertisement displayed on a third-party website, to improve site performance, and to measure the success of email marketing campaigns. In many instances, these technologies are reliant on cookies to function properly, and so declining cookies will impair their functioning.
            </p>

            <h3 className="text-lg font-semibold text-malibu-950 mt-6 mb-3">Do you use Flash cookies or Local Shared Objects?</h3>
            <p className="text-black-700 mb-4">
              Websites may also use so-called &quot;Flash Cookies&quot; (also known as Local Shared Objects or &quot;LSOs&quot;) to, among other things, collect and store information about your use of our services, fraud prevention, and for other site operations.
            </p>
            <p className="text-black-700 mb-4">
              If you do not want Flash Cookies stored on your computer, you can adjust the settings of your Flash player to block Flash Cookies storage using the tools contained in the{' '}
              <a href="http://www.macromedia.com/support/documentation/en/flashplayer/help/settings_manager07.html" target="_blank" rel="noopener noreferrer" className="text-malibu-600 hover:text-malibu-700 underline">Website Storage Settings Panel</a>. You can also control Flash Cookies by going to the{' '}
              <a href="http://www.macromedia.com/support/documentation/en/flashplayer/help/settings_manager03.html" target="_blank" rel="noopener noreferrer" className="text-malibu-600 hover:text-malibu-700 underline">Global Storage Settings Panel</a>{' '}
              and following the instructions (which may include instructions that explain, for example, how to delete existing Flash Cookies (referred to &quot;information&quot; on the Macromedia site), how to prevent Flash LSOs from being placed on your computer without your being asked, and (for Flash Player 8 and later) how to block Flash Cookies that are not being delivered by the operator of the page you are on at the time).
            </p>
            <p className="text-black-700 mb-4">
              Please note that setting the Flash Player to restrict or limit acceptance of Flash Cookies may reduce or impede the functionality of some Flash applications, including, potentially, Flash applications used in connection with our services or online content.
            </p>

            <h3 className="text-lg font-semibold text-malibu-950 mt-6 mb-3">Do you serve targeted advertising?</h3>
            <p className="text-black-700 mb-4">
              Third parties may serve cookies on your computer or mobile device to serve advertising through our Website. These companies may use information about your visits to this and other websites in order to provide relevant advertisements about goods and services that you may be interested in. They may also employ technology that is used to measure the effectiveness of advertisements. They can accomplish this by using cookies or web beacons to collect information about your visits to this and other sites in order to provide relevant advertisements about goods and services of potential interest to you. The information collected through this process does not enable us or them to identify your name, contact details, or other details that directly identify you unless you choose to provide these.
            </p>

            <h3 className="text-lg font-semibold text-malibu-950 mt-6 mb-3">How often will you update this Cookie Policy?</h3>
            <p className="text-black-700 mb-4">
              We may update this Cookie Policy from time to time in order to reflect, for example, changes to the cookies we use or for other operational, legal, or regulatory reasons. Please therefore revisit this Cookie Policy regularly to stay informed about our use of cookies and related technologies.
            </p>
            <p className="text-black-700 mb-4">
              The date at the top of this Cookie Policy indicates when it was last updated.
            </p>

            <h3 className="text-lg font-semibold text-malibu-950 mt-6 mb-3">Where can I get further information?</h3>
            <p className="text-black-700 mb-2">
              If you have any questions about our use of cookies or other technologies, please email us at{' '}
              <a href="mailto:rfinch@outta.events" className="text-malibu-600 hover:text-malibu-700 underline">rfinch@outta.events</a>{' '}
              or by post to:
            </p>
            <address className="text-black-700 not-italic mb-4">
              Outta<br />
              343 Fay Way<br />
              Mountain View, CA 94043<br />
              United States<br />
              Phone: (+1) 937-423-3317
            </address>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default CookiePolicyDrawer;
