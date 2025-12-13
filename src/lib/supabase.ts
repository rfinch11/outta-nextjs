import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type Listing = {
  airtable_id: string;
  title: string;
  type: 'Event' | 'Activity' | 'Camp';
  scout_pick: boolean;
  deal: boolean;
  promoted: boolean;
  scout_tip?: string | null;
  city: string;
  state: string;
  street: string;
  image: string;
  place_id?: string | null;
  latitude?: number;
  longitude?: number;
  start_date?: string;
  place_type?: string;
  description?: string;
  location_name?: string;
  zip?: number;
  price?: string;
  age_range?: string;
  organizer?: string;
  website?: string;
  tags?: string;
  rating?: number;
  reviews?: number;
  distance?: number; // Calculated client-side
};

export type Source = {
  id: string;
  name: string;
  logo?: string | null;
  url: string;
  featured_source: boolean;
};
