import { Metadata } from 'next';
import FilterPageContent from '@/components/FilterPageContent';

interface FilterPageProps {
  params: Promise<{ type: string }>;
}

export async function generateMetadata({ params }: FilterPageProps): Promise<Metadata> {
  const { type } = await params;
  const decodedType = decodeURIComponent(type);
  const title = decodedType === 'events' ? 'Events' : decodedType;

  return {
    title: `${title} | Outta`,
    description: `Browse ${title.toLowerCase()} near you on Outta`,
  };
}

export default async function FilterPage({ params }: FilterPageProps) {
  const { type } = await params;
  const decodedType = decodeURIComponent(type);

  return <FilterPageContent filterType={decodedType} />;
}
