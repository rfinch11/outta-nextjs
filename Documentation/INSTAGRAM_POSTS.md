# Adding Instagram Posts to Listings

This guide explains how to add Instagram post embeds to listing detail pages.

---

## Overview

Listings can display embedded Instagram posts in a dedicated section between the description and reviews. Posts are stored as an array of URLs in the `instagram_posts` column.

---

## Step-by-Step Process

### Step 1: Get the Instagram Post URL

1. Go to the Instagram post on web (instagram.com)
2. Click the three dots (...) on the post
3. Click "Copy link"
4. The URL format should be: `https://www.instagram.com/p/ABC123/` or `https://www.instagram.com/reel/ABC123/`

**Note:** The post must be from a **public account** for the embed to work.

---

### Step 2: Add the Database Column (One-time Setup)

Run this SQL in the Supabase SQL Editor if the column doesn't exist yet:

```sql
ALTER TABLE listings ADD COLUMN instagram_posts TEXT[];
```

---

### Step 3: Add Posts to a Listing

#### Option A: Supabase Dashboard (Recommended for one-off edits)

1. Go to Supabase Dashboard → Table Editor → listings
2. Find the listing you want to update
3. Click the row to edit
4. Find the `instagram_posts` column
5. Enter the URLs as a PostgreSQL array:
   ```
   {"https://www.instagram.com/p/ABC123/","https://www.instagram.com/p/XYZ789/"}
   ```
6. Save

#### Option B: SQL Query (For bulk updates)

**Add a single post:**
```sql
UPDATE listings
SET instagram_posts = ARRAY['https://www.instagram.com/p/ABC123/']
WHERE airtable_id = 'your_listing_id';
```

**Add multiple posts:**
```sql
UPDATE listings
SET instagram_posts = ARRAY[
  'https://www.instagram.com/p/ABC123/',
  'https://www.instagram.com/p/XYZ789/',
  'https://www.instagram.com/reel/DEF456/'
]
WHERE airtable_id = 'your_listing_id';
```

**Append a post to existing array:**
```sql
UPDATE listings
SET instagram_posts = array_append(instagram_posts, 'https://www.instagram.com/p/NEW123/')
WHERE airtable_id = 'your_listing_id';
```

**Remove a post from array:**
```sql
UPDATE listings
SET instagram_posts = array_remove(instagram_posts, 'https://www.instagram.com/p/OLD123/')
WHERE airtable_id = 'your_listing_id';
```

#### Option C: Node.js Script

```javascript
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function addInstagramPosts(listingId, posts) {
  const { error } = await supabase
    .from('listings')
    .update({ instagram_posts: posts })
    .eq('airtable_id', listingId);

  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Posts added successfully');
  }
}

// Usage
addInstagramPosts('rec123ABC', [
  'https://www.instagram.com/p/ABC123/',
  'https://www.instagram.com/p/XYZ789/'
]);
```

---

### Step 4: Verify

1. Visit the listing detail page: `https://outta.events/listings/{airtable_id}`
2. Scroll down past the description
3. You should see "From Instagram" section with embedded posts

---

## Troubleshooting

### Embed Not Loading

**Problem:** The embed shows a loading state or blank area.

**Solutions:**
- Verify the post is from a **public account**
- Check the URL is correct (should match `instagram.com/p/...` or `instagram.com/reel/...`)
- Try refreshing the page (Instagram's embed script needs to load)
- Check browser console for errors

### Post Was Deleted

**Problem:** A previously working embed shows an error or blank.

**Solution:** The original Instagram post was deleted or the account went private. Remove the URL from the array:

```sql
UPDATE listings
SET instagram_posts = array_remove(instagram_posts, 'https://www.instagram.com/p/DELETED/')
WHERE airtable_id = 'your_listing_id';
```

### Slow Page Load

**Problem:** Page loads slowly with many Instagram embeds.

**Solution:** Instagram's embed script adds ~200KB and each embed makes additional requests. Limit to 3-5 posts per listing for best performance.

---

## Best Practices

1. **Limit posts:** 1-3 posts is ideal, 5 max
2. **Relevance:** Only add posts directly related to the listing (the venue, event, or organizer)
3. **Recency:** Prefer recent posts over old ones
4. **Verification:** Always verify the post is from a public account before adding
5. **Backup:** Consider keeping a local note of which listings have Instagram posts for easy auditing

---

## Technical Details

### Files Involved

| File | Purpose |
|------|---------|
| `src/components/InstagramEmbed.tsx` | Single post embed component |
| `src/components/InstagramSection.tsx` | Section wrapper for multiple posts |
| `src/components/EventDetail.tsx` | Listing detail page (includes Instagram section) |
| `src/lib/supabase.ts` | TypeScript type includes `instagram_posts` |

### Database Schema

```sql
-- Column in listings table
instagram_posts TEXT[]  -- Array of Instagram post URLs
```

### How It Works

1. Listing page fetches data from Supabase including `instagram_posts`
2. Data is passed to `EventDetail` component as props
3. If `instagram_posts` has entries, `InstagramSection` renders
4. `InstagramEmbed` loads Instagram's official embed.js script
5. Script processes `<blockquote>` elements and renders interactive embeds

---

## Example Listings with Instagram

To find listings that have Instagram posts:

```sql
SELECT airtable_id, title, instagram_posts
FROM listings
WHERE instagram_posts IS NOT NULL
  AND array_length(instagram_posts, 1) > 0;
```
