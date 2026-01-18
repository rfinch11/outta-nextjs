'use client';

import React from 'react';
import Link from 'next/link';
import { LuArrowLeft, LuArrowUpRight, LuCheck } from 'react-icons/lu';

const PartnerPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-malibu-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-malibu-50">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center gap-3">
          <Link
            href="/"
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-malibu-100 transition-colors"
          >
            <LuArrowLeft size={20} className="text-malibu-950" />
          </Link>
          <span className="text-2xl font-bold text-malibu-950">Partner with Outta</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-8">
        {/* Hero Section */}
        <section className="mb-12 text-center">
          <h1 className="text-2xl md:text-3xl font-semibold text-malibu-950 mb-4 flex items-center justify-center gap-2 flex-wrap">
            Reach local families with
            <img src="/Outta_logo.svg" alt="Outta" className="h-7 md:h-9 inline-block" />
          </h1>
          <p className="text-lg text-malibu-950/80">
            Outta is the #1 platform for local family activities
          </p>
        </section>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-6 mb-12">
          {/* Events */}
          <section className="bg-white rounded-2xl p-6 shadow-sm text-left transition-all hover:shadow-xl hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-4">
              <img src="/Outta_logo.svg" alt="Outta" className="h-6" />
              <h2 className="text-2xl font-bold text-malibu-950">Events</h2>
            </div>

            <h3 className="text-3xl font-semibold text-malibu-950 mb-3">
              $29/mo
            </h3>
            <p className="text-malibu-950/80 mb-6">
              Create memories for local families. Free events are always free.
            </p>

            <a
              href="mailto:rfinch@outta.events?subject=List My Event on Outta"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-malibu-950 text-white rounded-lg text-base font-semibold transition-colors hover:bg-malibu-900 no-underline mb-6"
            >
              List Your Event
              <LuArrowUpRight size={18} />
            </a>

            <div>
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
          </section>

          {/* Core */}
          <section className="bg-white rounded-2xl p-6 shadow-sm text-left transition-all hover:shadow-xl hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-4">
              <img src="/Outta_logo.svg" alt="Outta" className="h-6" />
              <h2 className="text-2xl font-bold text-malibu-950">Core</h2>
            </div>

            <h3 className="text-3xl font-semibold text-malibu-950 mb-3">
              $39/mo
            </h3>
            <p className="text-malibu-950/80 mb-6">
              Your business on the platform parents actually use.
            </p>

            <a
              href="mailto:rfinch@outta.events?subject=Outta Core Inquiry"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-malibu-950 text-white rounded-lg text-base font-semibold transition-colors hover:bg-malibu-900 no-underline mb-6"
            >
              Get Started
              <LuArrowUpRight size={18} />
            </a>

            <div>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <LuCheck size={18} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-malibu-950/80">Business profile on Outta</span>
                </li>
                <li className="flex items-start gap-2">
                  <LuCheck size={18} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-malibu-950/80">Unlimited event and class listings</span>
                </li>
                <li className="flex items-start gap-2">
                  <LuCheck size={18} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-malibu-950/80">Instant payouts via Stripe</span>
                </li>
                <li className="flex items-start gap-2">
                  <LuCheck size={18} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-malibu-950/80">Included in category browsing and search</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Partner */}
          <section className="bg-white rounded-2xl p-6 shadow-sm text-left border-2 border-emerald-600 transition-all hover:shadow-xl hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-4">
              <img src="/Outta_logo.svg" alt="Outta" className="h-6" />
              <h2 className="text-2xl font-bold text-malibu-950">Partner</h2>
            </div>

            <h3 className="text-3xl font-semibold text-emerald-600 mb-3">
              $99/mo
            </h3>
            <p className="text-malibu-950/80 mb-6">
              Everything in Core, plus guaranteed placement in Outta&apos;s curated guides.
            </p>

            <a
              href="mailto:rfinch@outta.events?subject=Outta Partner Inquiry"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-base font-semibold transition-colors hover:bg-emerald-700 no-underline mb-6"
            >
              Partner with Outta
              <LuArrowUpRight size={18} />
            </a>

            <div>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <LuCheck size={18} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-malibu-950/80">Featured in all relevant guides</span>
                </li>
                <li className="flex items-start gap-2">
                  <LuCheck size={18} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-malibu-950/80">Priority placement in search results</span>
                </li>
                <li className="flex items-start gap-2">
                  <LuCheck size={18} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-malibu-950/80">Partner badge on your profile</span>
                </li>
                <li className="flex items-start gap-2">
                  <LuCheck size={18} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-malibu-950/80">Limited to 5 businesses per category</span>
                </li>
              </ul>
            </div>
          </section>
        </div>

        {/* Comparison Table */}
        <section className="mb-12 bg-white rounded-2xl p-6 md:p-8 shadow-sm overflow-x-auto">
          <h2 className="text-xl font-bold text-malibu-950 mb-6">Compare Plans</h2>
          <table className="w-full min-w-[400px]">
            <thead>
              <tr className="border-b border-black-100">
                <th className="text-left py-3 pr-4 text-malibu-950/60 font-medium">Feature</th>
                <th className="text-center py-3 px-4 text-malibu-950 font-semibold">Events</th>
                <th className="text-center py-3 px-4 text-malibu-950 font-semibold">Core</th>
                <th className="text-center py-3 pl-4 text-emerald-600 font-semibold">Partner</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-black-50">
                <td className="py-3 pr-4 text-malibu-950/80">Business profile</td>
                <td className="text-center py-3 px-4 text-black-300">—</td>
                <td className="text-center py-3 px-4"><LuCheck size={18} className="inline text-emerald-600" /></td>
                <td className="text-center py-3 pl-4"><LuCheck size={18} className="inline text-emerald-600" /></td>
              </tr>
              <tr className="border-b border-black-50">
                <td className="py-3 pr-4 text-malibu-950/80">Unlimited listings</td>
                <td className="text-center py-3 px-4"><LuCheck size={18} className="inline text-emerald-600" /></td>
                <td className="text-center py-3 px-4"><LuCheck size={18} className="inline text-emerald-600" /></td>
                <td className="text-center py-3 pl-4"><LuCheck size={18} className="inline text-emerald-600" /></td>
              </tr>
              <tr className="border-b border-black-50">
                <td className="py-3 pr-4 text-malibu-950/80">Instant payouts</td>
                <td className="text-center py-3 px-4"><LuCheck size={18} className="inline text-emerald-600" /></td>
                <td className="text-center py-3 px-4"><LuCheck size={18} className="inline text-emerald-600" /></td>
                <td className="text-center py-3 pl-4"><LuCheck size={18} className="inline text-emerald-600" /></td>
              </tr>
              <tr className="border-b border-black-50">
                <td className="py-3 pr-4 text-malibu-950/80">Category browsing & search</td>
                <td className="text-center py-3 px-4"><LuCheck size={18} className="inline text-emerald-600" /></td>
                <td className="text-center py-3 px-4"><LuCheck size={18} className="inline text-emerald-600" /></td>
                <td className="text-center py-3 pl-4"><LuCheck size={18} className="inline text-emerald-600" /></td>
              </tr>
              <tr className="border-b border-black-50">
                <td className="py-3 pr-4 text-malibu-950/80">Curated guide placement</td>
                <td className="text-center py-3 px-4 text-black-300">—</td>
                <td className="text-center py-3 px-4 text-black-300">—</td>
                <td className="text-center py-3 pl-4"><LuCheck size={18} className="inline text-emerald-600" /></td>
              </tr>
              <tr className="border-b border-black-50">
                <td className="py-3 pr-4 text-malibu-950/80">Priority search placement</td>
                <td className="text-center py-3 px-4 text-black-300">—</td>
                <td className="text-center py-3 px-4 text-black-300">—</td>
                <td className="text-center py-3 pl-4"><LuCheck size={18} className="inline text-emerald-600" /></td>
              </tr>
              <tr className="border-b border-black-50">
                <td className="py-3 pr-4 text-malibu-950/80">Partner badge</td>
                <td className="text-center py-3 px-4 text-black-300">—</td>
                <td className="text-center py-3 px-4 text-black-300">—</td>
                <td className="text-center py-3 pl-4"><LuCheck size={18} className="inline text-emerald-600" /></td>
              </tr>
              <tr>
                <td className="py-3 pr-4 text-malibu-950 font-semibold">Price</td>
                <td className="text-center py-3 px-4 text-malibu-950 font-semibold">$29/mo</td>
                <td className="text-center py-3 px-4 text-malibu-950 font-semibold">$39/mo</td>
                <td className="text-center py-3 pl-4 text-emerald-600 font-semibold">$99/mo</td>
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

      </main>
    </div>
  );
};

export default PartnerPage;
