'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process: () => void;
      };
    };
  }
}

interface InstagramEmbedProps {
  postUrl: string;
}

/**
 * Renders an Instagram post embed using Instagram's official embed script.
 * The embed script is loaded once and reused for all embeds on the page.
 */
export function InstagramEmbed({ postUrl }: InstagramEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Process embeds if script is already loaded
    if (window.instgrm) {
      window.instgrm.Embeds.process();
      return;
    }

    // Check if script is already in DOM
    const existingScript = document.querySelector(
      'script[src="//www.instagram.com/embed.js"]'
    );

    if (existingScript) {
      // Script exists but may not be loaded yet - wait for it
      existingScript.addEventListener('load', () => {
        window.instgrm?.Embeds.process();
      });
      return;
    }

    // Load Instagram embed script
    const script = document.createElement('script');
    script.src = '//www.instagram.com/embed.js';
    script.async = true;
    script.onload = () => {
      window.instgrm?.Embeds.process();
    };
    document.body.appendChild(script);
  }, [postUrl]);

  return (
    <div ref={containerRef} className="instagram-embed-container">
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={postUrl}
        data-instgrm-version="14"
        style={{
          background: '#FFF',
          border: 0,
          borderRadius: '3px',
          boxShadow: '0 0 1px 0 rgba(0,0,0,0.5), 0 1px 10px 0 rgba(0,0,0,0.15)',
          margin: '1px',
          maxWidth: '540px',
          minWidth: '326px',
          padding: 0,
          width: '100%',
        }}
      />
    </div>
  );
}

export default InstagramEmbed;
