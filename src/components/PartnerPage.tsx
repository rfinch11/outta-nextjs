'use client';

import React from 'react';
import Link from 'next/link';
import { LuArrowLeft, LuCheck, LuCalendar, LuStore, LuStar } from 'react-icons/lu';

const PartnerPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-malibu-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-malibu-50 border-b border-black-100">
        <div className="max-w-4xl mx-auto px-5 py-4 flex items-center gap-3">
          <Link
            href="/"
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-malibu-100 transition-colors"
          >
            <LuArrowLeft size={20} className="text-malibu-950" />
          </Link>
          <span className="text-lg font-semibold text-malibu-950">Partner with Outta</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-5 py-8">
        {/* Hero Section */}
        <section className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-malibu-950 mb-4">
            Reach local families looking for things to do with their kids.
          </h1>
          <p className="text-lg text-malibu-950/80 mb-6">
            Outta is the curated platform for family activities in the Mid-Peninsula. No concerts. No networking events. Just parents and caregivers actively searching for things to do with their kids.
          </p>
          <a
            href="mailto:rfinch@outta.events?subject=Partnership Inquiry"
            className="inline-block px-6 py-3 bg-malibu-950 text-white rounded-lg text-base font-semibold transition-colors hover:bg-malibu-900 no-underline"
          >
            Get Started
          </a>
        </section>

        {/* For Event Organizers */}
        <section className="mb-12 bg-white rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-flamenco-100 flex items-center justify-center">
              <LuCalendar size={24} className="text-flamenco-600" />
            </div>
            <h2 className="text-2xl font-bold text-malibu-950">For Event Organizers</h2>
          </div>

          <h3 className="text-xl font-semibold text-malibu-950 mb-3">
            Fill your family events faster.
          </h3>
          <p className="text-malibu-950/80 mb-6">
            On Eventbrite and Luma, your kids&apos; art class competes with happy hours and concert listings. On Outta, every user is a parent or caregiver looking for exactly what you offer.
          </p>

          <div className="bg-malibu-50 rounded-xl p-5 mb-6">
            <div className="flex items-baseline justify-between mb-4">
              <span className="text-lg font-bold text-malibu-950">Outta Events</span>
              <span className="text-malibu-950/80">Free events free. Paid events <strong>$29/mo</strong></span>
            </div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <LuCheck size={18} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                <span className="text-malibu-950/80">Unlimited event listings</span>
              </li>
              <li className="flex items-start gap-2">
                <LuCheck size={18} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                <span className="text-malibu-950/80">Instant payouts via Stripe (standard processing fees apply)</span>
              </li>
              <li className="flex items-start gap-2">
                <LuCheck size={18} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                <span className="text-malibu-950/80">Your events shown to high-intent local families</span>
              </li>
              <li className="flex items-start gap-2">
                <LuCheck size={18} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                <span className="text-malibu-950/80">Featured in curated lists that help parents find activities fast</span>
              </li>
            </ul>
          </div>

          <a
            href="mailto:rfinch@outta.events?subject=List My Event on Outta"
            className="inline-block px-5 py-2.5 bg-flamenco-500 text-white rounded-lg text-base font-semibold transition-colors hover:bg-flamenco-600 no-underline"
          >
            List Your Event
          </a>
        </section>

        {/* For Family-Focused Businesses */}
        <section className="mb-12 bg-white rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-lavender-magenta-100 flex items-center justify-center">
              <LuStore size={24} className="text-lavender-magenta-600" />
            </div>
            <h2 className="text-2xl font-bold text-malibu-950">For Family-Focused Businesses</h2>
          </div>

          <h3 className="text-xl font-semibold text-malibu-950 mb-3">
            Be where parents are already looking.
          </h3>
          <p className="text-malibu-950/80 mb-8">
            Bounce houses. Gymnastics centers. Swim schools. Art studios. Toy stores. If families are your customers, Outta puts you in front of parents actively searching for activities—not scrolling past ads.
          </p>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Core Plan */}
            <div className="border-2 border-black-100 rounded-xl p-5">
              <h4 className="text-lg font-bold text-malibu-950 mb-1">Outta Core</h4>
              <div className="mb-4">
                <span className="text-2xl font-bold text-malibu-950">$39</span>
                <span className="text-malibu-950/60">/mo</span>
                <span className="text-sm text-malibu-950/60 ml-2">or $390/yr (2 months free)</span>
              </div>
              <p className="text-sm text-malibu-950/80 mb-4">
                Your business on the platform parents actually use.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2">
                  <LuCheck size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-malibu-950/80">Business profile on Outta</span>
                </li>
                <li className="flex items-start gap-2">
                  <LuCheck size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-malibu-950/80">Unlimited event and class listings</span>
                </li>
                <li className="flex items-start gap-2">
                  <LuCheck size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-malibu-950/80">Instant payouts via Stripe</span>
                </li>
                <li className="flex items-start gap-2">
                  <LuCheck size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-malibu-950/80">Included in category browsing and search</span>
                </li>
              </ul>
              <a
                href="mailto:rfinch@outta.events?subject=Outta Core Inquiry"
                className="block w-full text-center px-4 py-2.5 border-2 border-malibu-950 text-malibu-950 rounded-lg text-base font-semibold transition-colors hover:bg-malibu-50 no-underline"
              >
                Get Started with Core
              </a>
            </div>

            {/* Partner Plan */}
            <div className="border-2 border-lavender-magenta-500 rounded-xl p-5 relative">
              <div className="absolute -top-3 left-5 px-3 py-1 bg-lavender-magenta-500 text-white text-xs font-semibold rounded-full">
                RECOMMENDED
              </div>
              <h4 className="text-lg font-bold text-malibu-950 mb-1">Outta Partner</h4>
              <div className="mb-4">
                <span className="text-2xl font-bold text-malibu-950">$99</span>
                <span className="text-malibu-950/60">/mo</span>
                <span className="text-sm text-malibu-950/60 ml-2">or $990/yr (2 months free)</span>
              </div>
              <p className="text-sm text-malibu-950/80 mb-4">
                Everything in Core, plus guaranteed placement in Outta&apos;s curated guides.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2">
                  <LuStar size={16} className="text-lavender-magenta-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-malibu-950/80">Featured in all relevant guides</span>
                </li>
                <li className="flex items-start gap-2">
                  <LuStar size={16} className="text-lavender-magenta-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-malibu-950/80">Priority placement in search results</span>
                </li>
                <li className="flex items-start gap-2">
                  <LuStar size={16} className="text-lavender-magenta-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-malibu-950/80">Partner badge on your profile</span>
                </li>
                <li className="flex items-start gap-2">
                  <LuStar size={16} className="text-lavender-magenta-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-malibu-950/80">Limited to 5 businesses per category</span>
                </li>
              </ul>
              <a
                href="mailto:rfinch@outta.events?subject=Outta Partner Inquiry"
                className="block w-full text-center px-4 py-2.5 bg-lavender-magenta-500 text-white rounded-lg text-base font-semibold transition-colors hover:bg-lavender-magenta-600 no-underline"
              >
                Become a Partner
              </a>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="mb-12 bg-white rounded-2xl p-6 md:p-8 shadow-sm overflow-x-auto">
          <h2 className="text-xl font-bold text-malibu-950 mb-6">Compare Plans</h2>
          <table className="w-full min-w-[400px]">
            <thead>
              <tr className="border-b border-black-100">
                <th className="text-left py-3 pr-4 text-malibu-950/60 font-medium">Feature</th>
                <th className="text-center py-3 px-4 text-malibu-950 font-semibold">Core</th>
                <th className="text-center py-3 pl-4 text-malibu-950 font-semibold">Partner</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-black-50">
                <td className="py-3 pr-4 text-malibu-950/80">Business profile</td>
                <td className="text-center py-3 px-4"><LuCheck size={18} className="inline text-emerald-600" /></td>
                <td className="text-center py-3 pl-4"><LuCheck size={18} className="inline text-emerald-600" /></td>
              </tr>
              <tr className="border-b border-black-50">
                <td className="py-3 pr-4 text-malibu-950/80">Unlimited listings</td>
                <td className="text-center py-3 px-4"><LuCheck size={18} className="inline text-emerald-600" /></td>
                <td className="text-center py-3 pl-4"><LuCheck size={18} className="inline text-emerald-600" /></td>
              </tr>
              <tr className="border-b border-black-50">
                <td className="py-3 pr-4 text-malibu-950/80">Instant payouts</td>
                <td className="text-center py-3 px-4"><LuCheck size={18} className="inline text-emerald-600" /></td>
                <td className="text-center py-3 pl-4"><LuCheck size={18} className="inline text-emerald-600" /></td>
              </tr>
              <tr className="border-b border-black-50">
                <td className="py-3 pr-4 text-malibu-950/80">Category browsing & search</td>
                <td className="text-center py-3 px-4"><LuCheck size={18} className="inline text-emerald-600" /></td>
                <td className="text-center py-3 pl-4"><LuCheck size={18} className="inline text-emerald-600" /></td>
              </tr>
              <tr className="border-b border-black-50">
                <td className="py-3 pr-4 text-malibu-950/80">Curated guide placement</td>
                <td className="text-center py-3 px-4 text-black-300">—</td>
                <td className="text-center py-3 pl-4"><LuCheck size={18} className="inline text-emerald-600" /></td>
              </tr>
              <tr className="border-b border-black-50">
                <td className="py-3 pr-4 text-malibu-950/80">Priority search placement</td>
                <td className="text-center py-3 px-4 text-black-300">—</td>
                <td className="text-center py-3 pl-4"><LuCheck size={18} className="inline text-emerald-600" /></td>
              </tr>
              <tr className="border-b border-black-50">
                <td className="py-3 pr-4 text-malibu-950/80">Partner badge</td>
                <td className="text-center py-3 px-4 text-black-300">—</td>
                <td className="text-center py-3 pl-4"><LuCheck size={18} className="inline text-emerald-600" /></td>
              </tr>
              <tr>
                <td className="py-3 pr-4 text-malibu-950 font-semibold">Price</td>
                <td className="text-center py-3 px-4 text-malibu-950 font-semibold">$39/mo</td>
                <td className="text-center py-3 pl-4 text-malibu-950 font-semibold">$99/mo</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* FAQ Section */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-malibu-950 mb-6">Frequently Asked Questions</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-malibu-950 mb-2">
                What&apos;s the difference between Outta Events and Outta Core?
              </h3>
              <p className="text-malibu-950/80">
                Outta Events is for organizers who run individual events and want to sell tickets. Outta Core and Partner are for established businesses with ongoing classes, drop-ins, or a physical location who want a persistent presence on the platform.
              </p>
            </div>

            <div>
              <h3 className="text-base font-semibold text-malibu-950 mb-2">
                What does &quot;curated guides&quot; mean?
              </h3>
              <p className="text-malibu-950/80">
                We publish regular guides like &quot;Rainy Day Activities,&quot; &quot;Summer Camp Guide,&quot; and &quot;36 Hours in Mountain View with Kids.&quot; Partner businesses are guaranteed placement in every guide relevant to their category.
              </p>
            </div>

            <div>
              <h3 className="text-base font-semibold text-malibu-950 mb-2">
                Why is Partner limited to 5 businesses per category?
              </h3>
              <p className="text-malibu-950/80">
                To keep our guides genuinely useful for parents. If we feature 20 gymnastics centers, it&apos;s a directory, not a recommendation. The cap keeps the value high for Partners and the quality high for families.
              </p>
            </div>

            <div>
              <h3 className="text-base font-semibold text-malibu-950 mb-2">
                Do Stripe fees still apply?
              </h3>
              <p className="text-malibu-950/80">
                Yes. Outta doesn&apos;t charge additional transaction fees beyond your subscription, but Stripe&apos;s standard processing fees (2.9% + 30¢) apply to paid tickets.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="text-center py-8">
          <h2 className="text-2xl font-bold text-malibu-950 mb-4">Ready to reach local families?</h2>
          <a
            href="mailto:rfinch@outta.events?subject=Partnership Inquiry"
            className="inline-block px-8 py-3 bg-malibu-950 text-white rounded-lg text-lg font-semibold transition-colors hover:bg-malibu-900 no-underline"
          >
            Get Started
          </a>
        </section>
      </main>
    </div>
  );
};

export default PartnerPage;
