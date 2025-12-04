import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/prototypes', '/api/'],
      },
    ],
    sitemap: 'https://www.outta.events/sitemap.xml',
  };
}
