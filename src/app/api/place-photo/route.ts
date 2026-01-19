import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route: /api/place-photo
 *
 * DISABLED - This route has been disabled to prevent costly Google API calls.
 * Photos are now served from cached URLs in google_place_details column.
 *
 * To refresh photos, run: node scripts/refresh-place-details.js
 */
export async function GET(request: NextRequest) {
  // Route disabled - all photos should come from cached google_place_details
  return NextResponse.json(
    {
      error: 'This endpoint is disabled. Photos are served from cached data.',
      hint: 'Run scripts/refresh-place-details.js to update cached photos'
    },
    { status: 410 } // 410 Gone
  );
}
