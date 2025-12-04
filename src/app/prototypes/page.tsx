import React from 'react';
import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import FeaturedCarousel_Prototype1 from '@/components/FeaturedCarousel_Prototype1';
import FeaturedCarousel_Prototype2 from '@/components/FeaturedCarousel_Prototype2';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

async function getFeaturedListings() {
  const { data, error } = await supabase
    .from('listings')
    .select('airtable_id, title, type, city, image, description, place_type, start_date')
    .eq('recommended', true)
    .limit(5);

  if (error) {
    console.error('Error fetching listings:', error);
    return [];
  }

  return data || [];
}

export default async function PrototypesPage() {
  const listings = await getFeaturedListings();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-outta-dark text-white py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Featured Hero Carousel Prototypes</h1>
          <p className="text-lg text-white/80">
            Two different approaches for showcasing featured events, activities, and camps
          </p>
        </div>
      </div>

      {/* Prototype 1 */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 mb-8">
          <h2 className="text-3xl font-bold text-outta-dark mb-2">
            Prototype 1: Classic Carousel with Peek
          </h2>
          <p className="text-gray-600">
            Full-width hero with large featured card. Previous/next cards peek from the sides.
            Auto-scrolls every 5 seconds. Clean, modern look with emphasis on images.
          </p>
          <div className="mt-4 space-y-2 text-sm text-gray-600">
            <p><strong>Features:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Large central card (900px max width) with peek cards on sides</li>
              <li>Dark gradient overlay for text readability</li>
              <li>Type badge, location, date, and description visible</li>
              <li>Arrow navigation and dot indicators</li>
              <li>Hover effects on main card (subtle zoom)</li>
            </ul>
          </div>
        </div>
        <FeaturedCarousel_Prototype1 listings={listings} />
      </section>

      {/* Spacer */}
      <div className="h-16 bg-gray-100"></div>

      {/* Prototype 2 */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 mb-8">
          <h2 className="text-3xl font-bold text-outta-dark mb-2">
            Prototype 2: Modern Stacked Cards
          </h2>
          <p className="text-gray-600">
            Cards stack with depth/perspective effect. Next cards peek from behind with scale/rotation.
            More compact, modern look. Stronger gradient for better contrast.
          </p>
          <div className="mt-4 space-y-2 text-sm text-gray-600">
            <p><strong>Features:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>3D stacked card effect with perspective transforms</li>
              <li>Stronger black gradient for high-contrast text</li>
              <li>Metadata displayed in rounded pill badges</li>
              <li>&quot;Explore&quot; CTA with animated arrow</li>
              <li>Progress bar showing auto-scroll timing</li>
              <li>Yellow accent on hover for navigation buttons</li>
            </ul>
          </div>
        </div>
        <FeaturedCarousel_Prototype2 listings={listings} />
      </section>

      {/* Comparison Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-outta-dark mb-8 text-center">
            Comparison & Recommendations
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Prototype 1 Pros/Cons */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-outta-dark mb-4">Prototype 1</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-green-600 mb-2">✅ Strengths</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Clean, spacious layout</li>
                    <li>• Full image visibility</li>
                    <li>• Clear navigation with peek cards</li>
                    <li>• Works well on all screen sizes</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-orange-600 mb-2">⚠️ Considerations</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Takes more vertical space</li>
                    <li>• Simpler design, less unique</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Prototype 2 Pros/Cons */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-outta-dark mb-4">Prototype 2</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-green-600 mb-2">✅ Strengths</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Unique 3D stacked effect</li>
                    <li>• More compact/efficient use of space</li>
                    <li>• Better text contrast with strong gradient</li>
                    <li>• Modern, eye-catching design</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-orange-600 mb-2">⚠️ Considerations</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Stack effect may not work on small screens</li>
                    <li>• Darker gradient covers more of image</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="mt-8 bg-outta-yellow rounded-2xl p-6">
            <h3 className="text-xl font-bold text-outta-dark mb-2">💡 Recommendation</h3>
            <p className="text-gray-800">
              <strong>Prototype 2</strong> offers a more unique, modern look that will make your site stand out.
              The 3D stacking effect adds visual interest and the compact design leaves more room for content below.
              The stronger gradient ensures text is always readable, and the progress bar gives users a clear
              indication of auto-scroll timing.
            </p>
          </div>
        </div>
      </section>

      {/* Footer note */}
      <div className="bg-outta-dark text-white py-6 px-4 text-center">
        <p className="text-sm text-white/60">
          These are interactive prototypes using real data from your database. Test them on different devices!
        </p>
      </div>
    </div>
  );
}
