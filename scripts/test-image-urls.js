#!/usr/bin/env node

/**
 * Test Image URLs Script
 *
 * This script tests image URLs from listings in the database to identify
 * which image sources are working vs broken.
 *
 * Usage: node scripts/test-image-urls.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\n/g, '').trim();
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.replace(/\n/g, '').trim();

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Check .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Extract domain from URL
function extractDomain(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return 'invalid-url';
  }
}

// Categorize domain into source type
function categorizeSource(domain) {
  if (domain.includes('unsplash')) return 'unsplash';
  if (domain.includes('supabase')) return 'supabase';
  if (domain.includes('streetviewpixels')) return 'google-streetview';
  if (domain.includes('googleapis.com') && domain.includes('places')) return 'google-places';
  if (domain.includes('googleusercontent')) return 'google-usercontentcontent';
  if (domain.includes('google')) return 'google';
  if (domain.includes('ggpht')) return 'google-ggpht';
  if (domain.includes('eventbrite') || domain.includes('evbuc')) return 'eventbrite';
  if (domain.includes('ebparks') || domain.includes('ebprd')) return 'ebparks';
  if (domain.includes('badm') || domain.includes('baykidsmuseum')) return 'badm';
  if (domain.includes('bibliocommons')) return 'bibliocommons';
  if (domain.includes('libnet.info')) return 'libnet';
  if (domain.includes('cloudinary')) return 'cloudinary';
  if (domain.includes('cdn') || domain.includes('assets')) return 'cdn';
  if (domain.includes('amazonaws') || domain.includes('s3.')) return 'aws-s3';
  if (domain.includes('airtable')) return 'airtable';
  if (domain.includes('flickr') || domain.includes('staticflickr')) return 'flickr';
  return domain; // Return full domain if no category matched
}

// Test a single image URL
async function testImageUrl(url, timeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ImageTest/1.0)'
      }
    });
    const responseTime = Date.now() - startTime;

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || 'unknown';
    const contentLength = response.headers.get('content-length');
    const isImage = contentType.startsWith('image/');

    return {
      url,
      status: response.status,
      contentType,
      contentLength: contentLength ? parseInt(contentLength) : null,
      isImage,
      responseTime,
      working: response.ok && isImage,
      error: null
    };
  } catch (error) {
    clearTimeout(timeoutId);
    return {
      url,
      status: null,
      contentType: null,
      contentLength: null,
      isImage: false,
      responseTime: null,
      working: false,
      error: error.name === 'AbortError' ? 'Timeout' : error.message
    };
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log('IMAGE URL TEST SCRIPT - COMPREHENSIVE');
  console.log('='.repeat(70));
  console.log(`\nFetching ALL listings to analyze image URL distribution...`);

  // Fetch all listings (without limit) to understand the full distribution
  // Use pagination to get all records
  let allListings = [];
  let offset = 0;
  const pageSize = 1000;

  while (true) {
    const { data: batch, error } = await supabase
      .from('listings')
      .select('airtable_id, title, image, city, type')
      .not('image', 'is', null)
      .not('image', 'eq', '')
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error('Error fetching listings:', error);
      process.exit(1);
    }

    if (batch.length === 0) break;

    allListings = allListings.concat(batch);
    offset += pageSize;

    if (batch.length < pageSize) break;
  }

  console.log(`Total listings with images: ${allListings.length}`);

  // Analyze URL distribution first
  const urlDistribution = {};
  for (const listing of allListings) {
    const domain = extractDomain(listing.image);
    const source = categorizeSource(domain);
    if (!urlDistribution[source]) {
      urlDistribution[source] = { count: 0, domains: new Set(), samples: [] };
    }
    urlDistribution[source].count++;
    urlDistribution[source].domains.add(domain);
    // Store more samples for broken sources to test comprehensively
    if (urlDistribution[source].samples.length < 10) {
      urlDistribution[source].samples.push(listing);
    }
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log('IMAGE URL DISTRIBUTION (Before Testing)');
  console.log('='.repeat(70));

  const sortedDistribution = Object.entries(urlDistribution).sort((a, b) => b[1].count - a[1].count);
  for (const [source, data] of sortedDistribution) {
    const pct = ((data.count / allListings.length) * 100).toFixed(1);
    console.log(`  ${source}: ${data.count} (${pct}%)`);
    console.log(`    Domains: ${[...data.domains].join(', ')}`);
  }

  // Now test samples from each source
  console.log(`\n${'='.repeat(70)}`);
  console.log('TESTING SAMPLE IMAGES FROM EACH SOURCE');
  console.log('='.repeat(70));

  const results = [];

  for (const [source, data] of sortedDistribution) {
    // Test more samples for smaller or suspected broken sources
    const samplesToTest = Math.min(data.samples.length, source.includes('google') ? data.samples.length : 5);
    console.log(`\nTesting ${source} (${samplesToTest} samples of ${data.count} total)...`);

    for (let i = 0; i < samplesToTest; i++) {
      const listing = data.samples[i];
      const domain = extractDomain(listing.image);

      process.stdout.write(`  [${i + 1}/${samplesToTest}] "${listing.title.substring(0, 35)}..."... `);

      const result = await testImageUrl(listing.image);
      results.push({
        ...result,
        listing_id: listing.airtable_id,
        listing_title: listing.title,
        listing_city: listing.city,
        listing_type: listing.type,
        domain,
        source,
        totalInSource: data.count
      });

      if (result.working) {
        console.log(`OK (${result.status}, ${result.contentType}, ${result.responseTime}ms)`);
      } else {
        console.log(`FAILED (${result.error || `Status: ${result.status}, Type: ${result.contentType}`})`);
      }
    }
  }

  // Analyze results by source
  console.log('\n' + '='.repeat(70));
  console.log('TEST RESULTS BY IMAGE SOURCE');
  console.log('='.repeat(70));

  const bySource = {};
  for (const result of results) {
    if (!bySource[result.source]) {
      bySource[result.source] = {
        tested: 0,
        working: 0,
        failed: 0,
        totalInDb: result.totalInSource,
        errors: [],
        domains: new Set()
      };
    }
    bySource[result.source].tested++;
    bySource[result.source].domains.add(result.domain);
    if (result.working) {
      bySource[result.source].working++;
    } else {
      bySource[result.source].failed++;
      bySource[result.source].errors.push({
        id: result.listing_id,
        title: result.listing_title,
        url: result.url,
        error: result.error || `Status ${result.status}`,
        contentType: result.contentType
      });
    }
  }

  // Sort by total in DB descending
  const sortedSources = Object.entries(bySource).sort((a, b) => b[1].totalInDb - a[1].totalInDb);

  for (const [source, data] of sortedSources) {
    const successRate = ((data.working / data.tested) * 100).toFixed(1);
    const statusLabel = data.failed === 0 ? '[RELIABLE]' : data.working === 0 ? '[BROKEN]  ' : '[PARTIAL] ';
    const estimatedBroken = Math.round((data.failed / data.tested) * data.totalInDb);

    console.log(`\n${statusLabel} ${source.toUpperCase()}`);
    console.log(`    Total in DB: ${data.totalInDb}`);
    console.log(`    Tested: ${data.tested} | Working: ${data.working} | Failed: ${data.failed}`);
    console.log(`    Sample Success Rate: ${successRate}%`);
    if (data.failed > 0) {
      console.log(`    Estimated broken in DB: ~${estimatedBroken} images`);
    }
    console.log(`    Domains: ${[...data.domains].join(', ')}`);

    if (data.errors.length > 0) {
      console.log(`    Failed URLs:`);
      for (const err of data.errors.slice(0, 5)) {
        console.log(`      - ID: ${err.id}`);
        console.log(`        Title: "${err.title.substring(0, 40)}..."`);
        console.log(`        Error: ${err.error}`);
        if (err.url.length <= 100) {
          console.log(`        URL: ${err.url}`);
        } else {
          console.log(`        URL: ${err.url.substring(0, 100)}...`);
        }
      }
      if (data.errors.length > 5) {
        console.log(`      ... and ${data.errors.length - 5} more`);
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));

  const totalWorking = results.filter(r => r.working).length;
  const totalFailed = results.filter(r => !r.working).length;
  const overallSuccessRate = ((totalWorking / results.length) * 100).toFixed(1);

  console.log(`\nTotal Images Tested: ${results.length}`);
  console.log(`Working: ${totalWorking} (${overallSuccessRate}%)`);
  console.log(`Failed: ${totalFailed} (${(100 - overallSuccessRate).toFixed(1)}%)`);

  // Estimate total broken images in DB
  let estimatedTotalBroken = 0;
  for (const [, data] of sortedSources) {
    if (data.failed > 0) {
      estimatedTotalBroken += Math.round((data.failed / data.tested) * data.totalInDb);
    }
  }

  console.log(`\nEstimated total broken images in database: ~${estimatedTotalBroken} of ${allListings.length}`);

  console.log('\nSource Reliability Summary:');
  const reliable = sortedSources.filter(([, d]) => d.failed === 0);
  const partial = sortedSources.filter(([, d]) => d.failed > 0 && d.working > 0);
  const broken = sortedSources.filter(([, d]) => d.working === 0);

  if (reliable.length > 0) {
    console.log(`\n  RELIABLE (100% working):`);
    for (const [source, data] of reliable) {
      console.log(`    - ${source}: ${data.totalInDb} images in DB`);
    }
  }
  if (partial.length > 0) {
    console.log(`\n  PARTIAL (some failing):`);
    for (const [source, data] of partial) {
      const rate = ((data.working / data.tested) * 100).toFixed(0);
      console.log(`    - ${source}: ${data.totalInDb} images in DB (${rate}% working)`);
    }
  }
  if (broken.length > 0) {
    console.log(`\n  BROKEN (0% working):`);
    for (const [source, data] of broken) {
      console.log(`    - ${source}: ${data.totalInDb} images in DB (ALL FAILING)`);
    }
  }

  // List all broken image IDs for easy fixing
  if (broken.length > 0) {
    console.log('\n' + '='.repeat(70));
    console.log('BROKEN IMAGE LISTING IDs (for fixing)');
    console.log('='.repeat(70));

    // Get all listings with broken sources
    const brokenSourceNames = broken.map(([source]) => source);
    const brokenListings = allListings.filter(listing => {
      const domain = extractDomain(listing.image);
      const source = categorizeSource(domain);
      return brokenSourceNames.includes(source);
    });

    console.log(`\nTotal listings with broken images: ${brokenListings.length}`);
    console.log('\nIDs:');
    for (const listing of brokenListings) {
      console.log(`  ${listing.airtable_id}: "${listing.title.substring(0, 50)}"`);
    }
  }

  // Recommendations
  console.log('\n' + '='.repeat(70));
  console.log('RECOMMENDATIONS');
  console.log('='.repeat(70));

  if (broken.length > 0) {
    console.log('\nCRITICAL - The following sources are completely broken and need immediate attention:');
    for (const [source, data] of broken) {
      console.log(`  - ${source}: ${data.totalInDb} images affected`);
      console.log(`    Recommendation: Replace with Unsplash fallback images`);
    }
  }

  if (partial.length > 0) {
    console.log('\nWARNING - The following sources have intermittent failures:');
    for (const [source, data] of partial) {
      const estimatedBroken = Math.round((data.failed / data.tested) * data.totalInDb);
      console.log(`  - ${source}: ~${estimatedBroken} of ${data.totalInDb} images may be broken`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('TEST COMPLETE');
  console.log('='.repeat(70));
}

main().catch(console.error);
