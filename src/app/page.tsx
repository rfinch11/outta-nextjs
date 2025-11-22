import { supabase } from '@/lib/supabase';

export default async function HomePage() {
  const { data: listings } = await supabase
    .from('listings')
    .select('*')
    .eq('type', 'Event')
    .limit(10);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Outta - Next.js Migration Test</h1>
      <p className="text-gray-600 mb-4">Listings count: {listings?.length || 0}</p>

      <div className="grid grid-cols-1 gap-4 max-w-4xl">
        {listings?.map((listing) => (
          <div key={listing.airtable_id} className="border rounded-lg p-4 bg-white shadow">
            <h2 className="text-xl font-semibold">{listing.title}</h2>
            <p className="text-gray-600">{listing.city}, {listing.state}</p>
            {listing.recommended && (
              <span className="inline-block mt-2 px-2 py-1 text-xs bg-yellow-400 rounded">
                Recommended
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h3 className="font-bold mb-2">Sample Listing Data:</h3>
        <pre className="text-xs overflow-auto">{JSON.stringify(listings?.[0], null, 2)}</pre>
      </div>
    </div>
  );
}
