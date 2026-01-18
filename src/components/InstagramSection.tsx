'use client';

import { InstagramEmbed } from './InstagramEmbed';

interface InstagramSectionProps {
  posts: string[];
}

/**
 * Renders a section with multiple Instagram post embeds.
 * Pass an array of Instagram post URLs.
 */
export function InstagramSection({ posts }: InstagramSectionProps) {
  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-malibu-950 mb-4">From Instagram</h2>
      <div className="flex flex-col gap-4">
        {posts.map((postUrl, index) => (
          <InstagramEmbed key={`${postUrl}-${index}`} postUrl={postUrl} />
        ))}
      </div>
    </div>
  );
}

export default InstagramSection;
