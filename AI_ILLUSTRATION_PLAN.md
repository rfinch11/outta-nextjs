# AI-Generated Event Illustrations - Implementation Plan

## Overview
Replace low-quality stock images from RSS feeds and Unsplash with high-quality, unique AI-generated illustrations for all events in the Outta platform. Each illustration will be generated using OpenAI DALL-E with a consistent flat geometric art style.

## Art Direction Specifications

### Visual Style
- Flat geometric vector illustration
- Abstract people and animals built from simple rounded shapes
- No outlines, no gradients, no shading, no texture
- Minimal faces, oversized or asymmetrical
- Dense, intimate composition with overlapping figures and little negative space
- Single flat background color from the palette
- Quiet, playful, slightly surreal tone
- Print-ready, crisp edges
- 4:3 aspect ratio (1024x768 pixels)

### Color Palette (Strict)
```
#fff407 - Yellow
#ff7e08 - Orange
#fd9bff - Pink
#35cb75 - Green
#06aaf1 - Blue
#06304b - Navy
#f6f6f6 - Light Gray
#000000 - Black
```

## Implementation Architecture

### Technology Stack
- **Image Generation**: OpenAI DALL-E 3 API
- **Image Storage**: Supabase Storage (with CDN)
- **Database**: Supabase PostgreSQL (existing `listings` table)
- **Execution**: Node.js script (manual trigger initially)

### Data Flow
```
1. Fetch event from Supabase →
2. Build prompt from (title + tags + description) →
3. Generate image via DALL-E API →
4. Download generated image →
5. Upload to Supabase Storage →
6. Update listing.image with new URL →
7. Log result
```

## Prompt Construction

### Template Structure
```
Context: {event_title}
Categories: {tags}
Setting: {first_sentence_of_description}

Art direction:
Flat geometric vector illustration.
Abstract people and animals built from simple rounded shapes.
No outlines, no gradients, no shading, no texture.
Minimal faces, oversized or asymmetrical.
Color palette strictly limited to: #fff407, #ff7e08, #fd9bff, #35cb75, #06aaf1, #06304b, #f6f6f6, #000000.
Dense, intimate composition with overlapping figures and little negative space.
Single flat background color from the palette.
Quiet, playful, slightly surreal tone.
Use the event title and tags only to suggest props and grouping, not literal scenes.
Print-ready, crisp edges.
4:3 aspect ratio
```

### Example Prompts

**Event**: "Summer Science Camp"
**Tags**: "education,STEM,outdoor"
**Description**: "Kids explore physics and chemistry through hands-on experiments..."

**Generated Prompt**:
```
Context: Summer Science Camp
Categories: education, STEM, outdoor
Setting: Kids explore physics and chemistry through hands-on experiments

Art direction:
Flat geometric vector illustration.
Abstract people and animals built from simple rounded shapes.
No outlines, no gradients, no shading, no texture.
Minimal faces, oversized or asymmetrical.
Color palette strictly limited to: #fff407, #ff7e08, #fd9bff, #35cb75, #06aaf1, #06304b, #f6f6f6, #000000.
Dense, intimate composition with overlapping figures and little negative space.
Single flat background color from the palette.
Quiet, playful, slightly surreal tone.
Use the event title and tags only to suggest props and grouping, not literal scenes.
Print-ready, crisp edges.
4:3 aspect ratio
```

## Technical Implementation

### 1. Script Setup

**File**: `scripts/generate-illustrations.js`

**Dependencies**:
```json
{
  "dependencies": {
    "openai": "^4.0.0",
    "@supabase/supabase-js": "^2.39.0",
    "dotenv": "^16.0.0",
    "node-fetch": "^3.0.0"
  }
}
```

**Environment Variables** (`.env`):
```env
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
SUPABASE_STORAGE_BUCKET=event-illustrations
```

### 2. Core Functions

#### `buildPrompt(event)`
```javascript
/**
 * Constructs DALL-E prompt from event data
 * @param {Object} event - Event object from Supabase
 * @param {string} event.title - Event title
 * @param {string} event.tags - Comma-separated tags
 * @param {string} event.description - Full description
 * @returns {string} Complete DALL-E prompt
 */
function buildPrompt(event) {
  const title = event.title || 'Untitled Event';
  const tags = event.tags || '';

  // Extract first sentence from description
  const description = event.description || '';
  const firstSentence = description
    .split(/[.!?]/)
    .filter(s => s.trim().length > 0)[0] || '';

  return `Context: ${title}
Categories: ${tags}
Setting: ${firstSentence}

Art direction:
Flat geometric vector illustration.
Abstract people and animals built from simple rounded shapes.
No outlines, no gradients, no shading, no texture.
Minimal faces, oversized or asymmetrical.
Color palette strictly limited to: #fff407, #ff7e08, #fd9bff, #35cb75, #06aaf1, #06304b, #f6f6f6, #000000.
Dense, intimate composition with overlapping figures and little negative space.
Single flat background color from the palette.
Quiet, playful, slightly surreal tone.
Use the event title and tags only to suggest props and grouping, not literal scenes.
Print-ready, crisp edges.
4:3 aspect ratio`;
}
```

#### `generateImage(prompt)`
```javascript
/**
 * Generates image using OpenAI DALL-E 3
 * @param {string} prompt - Complete art direction prompt
 * @returns {Promise<string>} URL of generated image
 */
async function generateImage(prompt) {
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: prompt,
    n: 1,
    size: "1024x1024", // Closest to 4:3, will crop to 1024x768
    quality: "standard", // or "hd" for $0.080/image
    style: "natural" // Better for geometric/flat styles than "vivid"
  });

  return response.data[0].url; // Temporary OpenAI URL (valid ~1 hour)
}
```

#### `uploadToSupabase(imageUrl, eventId)`
```javascript
/**
 * Downloads image and uploads to Supabase Storage
 * @param {string} imageUrl - Temporary OpenAI image URL
 * @param {string} eventId - Airtable ID for filename
 * @returns {Promise<string>} Public Supabase Storage URL
 */
async function uploadToSupabase(imageUrl, eventId) {
  // Download image from OpenAI
  const response = await fetch(imageUrl);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload to Supabase Storage
  const filename = `${eventId}.png`;
  const { data, error } = await supabase.storage
    .from('event-illustrations')
    .upload(filename, buffer, {
      contentType: 'image/png',
      upsert: true // Allow overwriting if regenerating
    });

  if (error) throw error;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('event-illustrations')
    .getPublicUrl(filename);

  return publicUrl;
}
```

#### `updateListingImage(eventId, imageUrl)`
```javascript
/**
 * Updates listing.image field in Supabase
 * @param {string} eventId - Airtable ID
 * @param {string} imageUrl - New Supabase Storage URL
 */
async function updateListingImage(eventId, imageUrl) {
  const { error } = await supabase
    .from('listings')
    .update({ image: imageUrl })
    .eq('airtable_id', eventId);

  if (error) throw error;
}
```

### 3. Main Execution Flow

```javascript
async function generateIllustrationsForEvents(options = {}) {
  const {
    limit = null,          // Process all by default
    type = null,           // Filter by type: 'Event', 'Activity', 'Camp'
    specificIds = null,    // Array of airtable_ids to process
    skipExisting = true,   // Skip if image already from Supabase Storage
    dryRun = false         // Log what would happen without API calls
  } = options;

  // 1. Fetch events from Supabase
  let query = supabase.from('listings').select('*');

  if (type) query = query.eq('type', type);
  if (specificIds) query = query.in('airtable_id', specificIds);
  if (limit) query = query.limit(limit);

  const { data: events, error } = await query;
  if (error) throw error;

  console.log(`Processing ${events.length} events...`);

  // 2. Process each event
  const results = {
    success: [],
    skipped: [],
    failed: []
  };

  for (const event of events) {
    try {
      // Skip if already has Supabase Storage image
      if (skipExisting && event.image?.includes('supabase.co/storage')) {
        console.log(`⏭️  Skipping ${event.airtable_id} - already has generated image`);
        results.skipped.push(event.airtable_id);
        continue;
      }

      console.log(`🎨 Generating illustration for: ${event.title}`);

      if (dryRun) {
        const prompt = buildPrompt(event);
        console.log(`   Prompt preview: ${prompt.substring(0, 100)}...`);
        results.success.push(event.airtable_id);
        continue;
      }

      // Generate prompt
      const prompt = buildPrompt(event);

      // Generate image
      const tempImageUrl = await generateImage(prompt);

      // Upload to Supabase Storage
      const storageUrl = await uploadToSupabase(tempImageUrl, event.airtable_id);

      // Update database
      await updateListingImage(event.airtable_id, storageUrl);

      console.log(`✅ Success: ${event.airtable_id} → ${storageUrl}`);
      results.success.push(event.airtable_id);

      // Rate limiting: Wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (err) {
      console.error(`❌ Failed for ${event.airtable_id}:`, err.message);
      results.failed.push({ id: event.airtable_id, error: err.message });
    }
  }

  // 3. Summary
  console.log('\n📊 Generation Summary:');
  console.log(`   ✅ Successful: ${results.success.length}`);
  console.log(`   ⏭️  Skipped: ${results.skipped.length}`);
  console.log(`   ❌ Failed: ${results.failed.length}`);

  return results;
}
```

### 4. CLI Usage Examples

```bash
# Dry run to preview prompts (no API calls)
node scripts/generate-illustrations.js --dry-run

# Generate for 5 events to test
node scripts/generate-illustrations.js --limit 5

# Generate only for Events (not Activities/Camps)
node scripts/generate-illustrations.js --type Event

# Generate for specific events
node scripts/generate-illustrations.js --ids "rec123,rec456,rec789"

# Process all 380 listings
node scripts/generate-illustrations.js --all

# Regenerate images even if already from Supabase
node scripts/generate-illustrations.js --force --ids "rec123"
```

## Supabase Storage Setup

### 1. Create Storage Bucket

In Supabase Dashboard:
1. Go to **Storage** → **New bucket**
2. Name: `event-illustrations`
3. Public: ✅ Yes (images need to be publicly accessible)
4. File size limit: 5MB
5. Allowed MIME types: `image/png`

### 2. Set Storage Policies

```sql
-- Allow public read access to all files
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'event-illustrations' );

-- Allow service role to upload/update
CREATE POLICY "Service Role Upload"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK ( bucket_id = 'event-illustrations' );

CREATE POLICY "Service Role Update"
ON storage.objects FOR UPDATE
TO service_role
USING ( bucket_id = 'event-illustrations' );
```

### 3. URL Format
Generated images will have URLs like:
```
https://[project-ref].supabase.co/storage/v1/object/public/event-illustrations/rec123abc.png
```

## Cost Estimation

### OpenAI DALL-E 3 Pricing
- **Standard quality** (1024x1024): $0.040/image
- **HD quality** (1024x1024): $0.080/image

### Costs for Full Migration
- **380 listings × $0.040** = **$15.20** (standard)
- **380 listings × $0.080** = **$30.40** (HD)

**Recommendation**: Start with standard quality. HD only improves fine details, which may not be necessary for the flat geometric style.

### Supabase Storage Pricing
- Storage: $0.021/GB/month
- Bandwidth: $0.09/GB
- **Estimated**: 380 images × 200KB average = ~76MB = **$0.002/month**

**Total one-time cost**: ~$15-30 for generation + negligible storage

## Optimization Strategies

### 1. Batch Processing with Rate Limits
- DALL-E 3 has rate limits (~5 images/minute for Tier 1)
- Add delays between requests (1-2 seconds)
- Process in batches of 50-100 at a time

### 2. Prompt Optimization
- Test prompts on 5-10 events first
- Adjust art direction if results aren't matching vision
- Consider adding negative prompts if DALL-E adds unwanted elements

### 3. Caching & Regeneration
- Store original DALL-E prompt in database for reference
- Allow selective regeneration if result is unsatisfactory
- Version images if you want to A/B test different styles

### 4. Error Handling
```javascript
// Retry logic for failed generations
async function generateWithRetry(prompt, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await generateImage(prompt);
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      console.log(`Retry ${i + 1}/${maxRetries}...`);
      await new Promise(r => setTimeout(r, 5000)); // Wait 5s
    }
  }
}
```

## Future Automation Options

### Option 1: Webhook on New Event Creation
When a new event is added to Airtable/Supabase:
1. Trigger serverless function (Supabase Edge Function or Vercel API route)
2. Generate illustration automatically
3. Update image field before event goes live

### Option 2: Scheduled Batch Job
- Run script daily via cron job
- Process only events created in last 24 hours
- Fully automated pipeline

### Option 3: Admin UI
Build simple admin interface:
- List all events without generated images
- Preview generated prompts
- One-click generate button per event
- Bulk generate selected events

## Testing Plan

### Phase 1: Validation (5-10 events)
1. Generate for diverse event types:
   - Outdoor activity (hiking, park)
   - Educational (STEM camp, workshop)
   - Arts & crafts
   - Sports event
   - Indoor activity (museum, library)

2. Validate:
   - ✅ Color palette adherence
   - ✅ Flat geometric style consistency
   - ✅ Appropriate context from title/tags
   - ✅ 4:3 aspect ratio
   - ✅ Image quality at 1024x768

### Phase 2: Small Batch (50 events)
1. Process 50 random events
2. Review for:
   - Prompt patterns that work well
   - Edge cases (missing tags, no description)
   - Rate limiting issues
   - Storage upload performance

### Phase 3: Full Migration (380 events)
1. Run overnight batch job
2. Spot-check 10% of results
3. Manually regenerate any failures

## Database Schema Extensions (Optional)

Consider adding metadata fields for tracking:

```sql
ALTER TABLE listings ADD COLUMN illustration_prompt TEXT;
ALTER TABLE listings ADD COLUMN illustration_generated_at TIMESTAMP;
ALTER TABLE listings ADD COLUMN illustration_model VARCHAR(50);
```

This allows:
- Prompt versioning and tweaking
- Audit trail of when images were generated
- Easy identification of which events need regeneration if you update style

## Rollback Strategy

If generated illustrations don't meet quality expectations:

1. **Preserve original URLs**: Store old image URLs before overwriting
   ```sql
   ALTER TABLE listings ADD COLUMN image_backup TEXT;
   UPDATE listings SET image_backup = image WHERE image IS NOT NULL;
   ```

2. **Selective rollback**: Revert specific events
   ```sql
   UPDATE listings
   SET image = image_backup
   WHERE airtable_id IN ('rec123', 'rec456');
   ```

3. **Full rollback**: Restore all original images
   ```sql
   UPDATE listings SET image = image_backup WHERE image_backup IS NOT NULL;
   ```

## Success Metrics

After implementation, measure:
1. **Visual consistency**: All images follow same art style
2. **Load performance**: Image file sizes < 300KB
3. **Relevance**: Illustrations contextually appropriate for events
4. **User engagement**: Monitor click-through rates on events with new images
5. **Cost efficiency**: Total generation cost vs. quality improvement

## Next Steps

1. **Immediate**: Set up OpenAI API account and get API key
2. **Week 1**: Create Supabase Storage bucket and test script on 5 events
3. **Week 2**: Refine prompts based on initial results
4. **Week 3**: Run full batch generation for all 380 events
5. **Ongoing**: Set up automation for new events (optional)

## Resources & References

- [OpenAI DALL-E 3 API Docs](https://platform.openai.com/docs/guides/images)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- [DALL-E 3 Prompting Guide](https://platform.openai.com/docs/guides/images/prompting)
- Flat geometric illustration examples for reference
  - [Malika Favre](https://www.malikafavre.com/)
  - [Noma Bar](https://www.nomabar.com/)
  - [Geoff McFetridge](https://championsdsgn.com/)

---

**Document Version**: 1.0
**Last Updated**: 2026-01-07
**Status**: Planning - Ready for Implementation
