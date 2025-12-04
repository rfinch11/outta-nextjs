import { supabase } from '@/lib/supabase';
import EventDetail from '@/components/EventDetail';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  const { data: listing } = await supabase
    .from('listings')
    .select('*')
    .eq('airtable_id', id)
    .single();

  if (!listing) {
    return {
      title: 'Listing Not Found',
    };
  }

  const description =
    listing.description?.slice(0, 160) ||
    `${listing.type} in ${listing.city}. Find kid-friendly ${listing.type.toLowerCase()}s near you on Outta.`;

  return {
    title: `${listing.title} | Outta`,
    description,
    openGraph: {
      title: listing.title,
      description,
      images: listing.image ? [{ url: listing.image }] : [],
      type: 'website',
    },
  };
}

export default async function ListingPage({ params }: PageProps) {
  const { id } = await params;

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
