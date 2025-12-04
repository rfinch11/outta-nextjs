import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.outta.events';

  // Fetch all listings for dynamic routes
  const { data: listings } = await supabase
    .from('listings')
    .select('airtable_id, updated_at')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  const listingUrls =
    listings?.map((listing) => ({
      url: `${baseUrl}/listings/${listing.airtable_id}`,
      lastModified: new Date(listing.updated_at || Date.now()),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })) || [];

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...listingUrls,
  ];
}
