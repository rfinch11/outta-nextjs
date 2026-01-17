import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCachedData, getSearchCacheKey } from '@/lib/cache';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') as 'Event' | 'Activity' | 'Camp' | null;
    const limit = parseInt(searchParams.get('limit') || '15');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Generate cache key
    const cacheKey = `${getSearchCacheKey(query, type || undefined)}:${limit}:${offset}`;

    // Use cache
    const result = await getCachedData(cacheKey, async () => {
      let dbQuery = supabase.from('listings').select('*', { count: 'exact' });

      // Full-text search using the fts column
      // Note: After running migration 001, you can use textSearch
      // For now, we'll use ilike as fallback
      if (query) {
        const searchTerm = `%${query}%`;
        dbQuery = dbQuery.or(
          `title.ilike.${searchTerm},description.ilike.${searchTerm},city.ilike.${searchTerm},tags.ilike.${searchTerm}`
        );
      }

      // Filter by type
      if (type) {
        dbQuery = dbQuery.eq('type', type);
      }

      // Pagination and sorting
      dbQuery = dbQuery
        .order('recommended', { ascending: false })
        .order('start_date', { ascending: true, nullsFirst: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await dbQuery;

      if (error) {
        throw new Error(error.message);
      }

      return {
        data,
        count,
        hasMore: count ? offset + limit < count : false,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Search API unexpected error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// Future enhancement: Use full-text search after migration
// if (query) {
//   dbQuery = dbQuery.textSearch('fts', query);
// }
