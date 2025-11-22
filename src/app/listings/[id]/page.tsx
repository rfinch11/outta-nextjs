import { supabase } from '@/lib/supabase';
import EventDetail from '@/components/EventDetail';
import { notFound } from 'next/navigation';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function ListingPage({ params }: PageProps) {
  const { id } = params;

  // Fetch listing from Supabase
  const { data: listing } = await supabase
    .from('listings')
    .select('*')
    .eq('airtable_id', id)
    .single();

  if (!listing) {
    notFound();
  }

  return <EventDetail {...listing} />;
}
