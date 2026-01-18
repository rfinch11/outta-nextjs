import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

/**
 * API Route to hide stale events (events that have already passed)
 * Runs daily via Vercel cron to keep the listings clean
 */
export async function POST(request: NextRequest) {
  // Security: Check for cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('\n🙈 Starting hide stale events job...');

  try {
    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    console.log(`📅 Finding events that started before ${today.toLocaleDateString()}`);

    // Find all events that are past and not already hidden
    // Use pagination to get all records
    let allStaleEvents: { id: string }[] = [];
    let page = 0;
    const pageSize = 1000;

    while (true) {
      const { data: batch, error: batchError } = await supabase
        .from('listings')
        .select('id')
        .lt('start_date', todayISO)
        .or('hidden.is.null,hidden.eq.false')
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (batchError) {
        console.error('❌ Error fetching listings:', batchError.message);
        return NextResponse.json({ error: batchError.message }, { status: 500 });
      }

      if (!batch || batch.length === 0) break;
      allStaleEvents = allStaleEvents.concat(batch);
      if (batch.length < pageSize) break;
      page++;
    }

    console.log(`Found ${allStaleEvents.length} stale events to hide`);

    if (allStaleEvents.length === 0) {
      console.log('✅ No stale events to hide');
      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        hidden: 0,
      });
    }

    // Update in batches of 500
    const batchSize = 500;
    let hiddenCount = 0;
    let errorCount = 0;

    for (let i = 0; i < allStaleEvents.length; i += batchSize) {
      const batch = allStaleEvents.slice(i, i + batchSize);
      const ids = batch.map((e) => e.id);

      const { error: updateError } = await supabase
        .from('listings')
        .update({ hidden: true })
        .in('id', ids);

      if (updateError) {
        console.error(`❌ Error updating batch: ${updateError.message}`);
        errorCount += batch.length;
      } else {
        hiddenCount += batch.length;
        console.log(`✅ Hidden batch ${Math.floor(i / batchSize) + 1}: ${batch.length} records`);
      }
    }

    console.log(`\n📊 Summary: Hidden ${hiddenCount}, Errors ${errorCount}`);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      hidden: hiddenCount,
      errors: errorCount,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Unexpected error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
