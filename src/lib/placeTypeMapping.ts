/**
 * Place Type Mapping
 *
 * Maps Google Places API types to consolidated parent categories
 * for consistent categorization across all listings.
 *
 * Categories are designed for a family activity discovery app.
 */

// Parent categories for the app
export const PLACE_CATEGORIES = [
  'Playground',
  'Park',
  'Museum',
  'Library',
  'Amusement',
  'Sports & Fitness',
  'Arts & Culture',
  'Nature',
  'Learning',
  'Community',
  'Camp',
  'Other',
] as const;

export type PlaceCategory = (typeof PLACE_CATEGORIES)[number];

/**
 * Maps Google Places API types to parent categories
 * Based on: https://developers.google.com/maps/documentation/places/web-service/place-types
 */
const GOOGLE_TYPE_TO_CATEGORY: Record<string, PlaceCategory> = {
  // Playground
  playground: 'Playground',

  // Park
  park: 'Park',
  state_park: 'Park',
  national_park: 'Park',
  dog_park: 'Park',
  picnic_ground: 'Park',
  barbecue_area: 'Park',

  // Museum
  museum: 'Museum',
  aquarium: 'Museum',
  planetarium: 'Museum',
  science_museum: 'Museum',
  childrens_museum: 'Museum',

  // Library
  library: 'Library',

  // Amusement
  amusement_park: 'Amusement',
  amusement_center: 'Amusement',
  water_park: 'Amusement',
  zoo: 'Amusement',
  theme_park: 'Amusement',
  wildlife_park: 'Amusement',
  video_arcade: 'Amusement',
  bowling_alley: 'Amusement',
  miniature_golf: 'Amusement',
  mini_golf: 'Amusement',
  escape_room: 'Amusement',
  laser_tag: 'Amusement',
  trampoline_park: 'Amusement',
  go_kart_track: 'Amusement',
  ferris_wheel: 'Amusement',
  roller_coaster: 'Amusement',

  // Sports & Fitness
  gym: 'Sports & Fitness',
  fitness_center: 'Sports & Fitness',
  swimming_pool: 'Sports & Fitness',
  ice_skating_rink: 'Sports & Fitness',
  skating_rink: 'Sports & Fitness',
  sports_complex: 'Sports & Fitness',
  sports_club: 'Sports & Fitness',
  sports_coaching: 'Sports & Fitness',
  athletic_field: 'Sports & Fitness',
  stadium: 'Sports & Fitness',
  arena: 'Sports & Fitness',
  golf_course: 'Sports & Fitness',
  tennis_court: 'Sports & Fitness',
  basketball_court: 'Sports & Fitness',
  soccer_field: 'Sports & Fitness',
  skateboard_park: 'Sports & Fitness',
  cycling_park: 'Sports & Fitness',
  ski_resort: 'Sports & Fitness',
  marina: 'Sports & Fitness',

  // Arts & Culture
  art_gallery: 'Arts & Culture',
  art_studio: 'Arts & Culture',
  performing_arts_theater: 'Arts & Culture',
  movie_theater: 'Arts & Culture',
  concert_hall: 'Arts & Culture',
  opera_house: 'Arts & Culture',
  philharmonic_hall: 'Arts & Culture',
  theater: 'Arts & Culture',
  theatre: 'Arts & Culture',
  cultural_center: 'Arts & Culture',
  cultural_landmark: 'Arts & Culture',
  historical_landmark: 'Arts & Culture',
  historical_place: 'Arts & Culture',
  monument: 'Arts & Culture',
  sculpture: 'Arts & Culture',
  dance_hall: 'Arts & Culture',
  comedy_club: 'Arts & Culture',

  // Nature
  botanical_garden: 'Nature',
  garden: 'Nature',
  hiking_area: 'Nature',
  beach: 'Nature',
  wildlife_refuge: 'Nature',
  nature_reserve: 'Nature',
  campground: 'Nature',
  observation_deck: 'Nature',
  visitor_center: 'Nature',
  tourist_attraction: 'Nature',

  // Learning
  preschool: 'Learning',
  school: 'Learning',
  primary_school: 'Learning',
  secondary_school: 'Learning',
  university: 'Learning',
  education_center: 'Learning',
  tutoring_service: 'Learning',
  driving_school: 'Learning',
  language_school: 'Learning',
  music_school: 'Learning',
  dance_school: 'Learning',
  art_school: 'Learning',
  cooking_school: 'Learning',

  // Community
  community_center: 'Community',
  event_venue: 'Community',
  convention_center: 'Community',
  banquet_hall: 'Community',
  church: 'Community',
  mosque: 'Community',
  synagogue: 'Community',
  hindu_temple: 'Community',
  place_of_worship: 'Community',
  city_hall: 'Community',
  local_government_office: 'Community',

  // Camp
  childrens_camp: 'Camp',
  summer_camp: 'Camp',
  day_camp: 'Camp',
  camping_cabin: 'Camp',
  rv_park: 'Camp',
};

/**
 * Keywords to match in venue names/descriptions for non-Google listings
 * Order matters - more specific matches should come first
 */
const KEYWORD_TO_CATEGORY: Array<{ keywords: string[]; category: PlaceCategory }> = [
  // Playground (check before park)
  {
    keywords: ['indoor playground', 'play area', 'play space', 'playspace', 'soft play'],
    category: 'Playground',
  },
  { keywords: ['playground'], category: 'Playground' },

  // Amusement (check before other categories)
  {
    keywords: [
      'amusement park',
      'theme park',
      'water park',
      'trampoline',
      'bounce',
      'laser tag',
      'escape room',
      'arcade',
      'mini golf',
      'miniature golf',
      'go kart',
      'go-kart',
      'bowling',
    ],
    category: 'Amusement',
  },
  { keywords: ['zoo', 'aquarium'], category: 'Amusement' },

  // Museum
  { keywords: ['museum', 'science center', 'discovery center'], category: 'Museum' },

  // Library
  { keywords: ['library'], category: 'Library' },

  // Arts & Culture
  {
    keywords: [
      'theater',
      'theatre',
      'art gallery',
      'gallery',
      'art studio',
      'painting',
      'pottery',
      'ceramics',
      'dance studio',
      'music studio',
      'concert hall',
      'performing arts',
    ],
    category: 'Arts & Culture',
  },

  // Sports & Fitness
  {
    keywords: [
      'gymnastics',
      'gym',
      'fitness',
      'swimming',
      'pool',
      'skating',
      'ice rink',
      'sports',
      'martial arts',
      'karate',
      'judo',
      'taekwondo',
      'soccer',
      'baseball',
      'basketball',
      'tennis',
      'yoga',
      'rock climbing',
      'climbing gym',
    ],
    category: 'Sports & Fitness',
  },
  { keywords: ['recreation center', 'rec center'], category: 'Sports & Fitness' },

  // Nature
  {
    keywords: [
      'botanical garden',
      'garden',
      'nature center',
      'nature preserve',
      'hiking',
      'trail',
      'beach',
      'wildlife',
    ],
    category: 'Nature',
  },

  // Learning
  {
    keywords: [
      'preschool',
      'pre-school',
      'daycare',
      'day care',
      'childcare',
      'montessori',
      'learning center',
      'education center',
      'tutoring',
      'school',
      'academy',
      'enrichment',
    ],
    category: 'Learning',
  },

  // Camp
  { keywords: ['camp', 'summer camp', 'day camp'], category: 'Camp' },

  // Community
  {
    keywords: ['community center', 'community hall', 'civic center', 'ymca', 'ywca', 'boys & girls club'],
    category: 'Community',
  },

  // Park (check last among outdoor - it's a common substring)
  { keywords: ['park', 'regional park', 'state park', 'national park'], category: 'Park' },
];

/**
 * Get the parent category for a Google Places type
 */
export function getCategoryFromGoogleType(googleType: string): PlaceCategory {
  const normalized = googleType.toLowerCase().replace(/-/g, '_');
  return GOOGLE_TYPE_TO_CATEGORY[normalized] || 'Other';
}

/**
 * Get the parent category from an array of Google types
 * Returns the first matching category (Google returns types in priority order)
 */
export function getCategoryFromGoogleTypes(googleTypes: string[]): PlaceCategory {
  for (const type of googleTypes) {
    const category = getCategoryFromGoogleType(type);
    if (category !== 'Other') {
      return category;
    }
  }
  return 'Other';
}

/**
 * Get the parent category by matching keywords in text
 * Useful for listings without a place_id
 */
export function getCategoryFromKeywords(text: string): PlaceCategory {
  const normalized = text.toLowerCase();

  for (const { keywords, category } of KEYWORD_TO_CATEGORY) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        return category;
      }
    }
  }

  return 'Other';
}

/**
 * Maps legacy place_type values to new categories
 * Use this for migrating existing data
 */
const LEGACY_TYPE_TO_CATEGORY: Record<string, PlaceCategory> = {
  // Direct mappings
  playground: 'Playground',
  'indoor playground': 'Playground',
  park: 'Park',
  museum: 'Museum',
  "children's museum": 'Museum',
  library: 'Library',
  'amusement park': 'Amusement',
  'amusement center': 'Amusement',
  zoo: 'Amusement',
  aquarium: 'Amusement',
  'escape room': 'Amusement',
  'miniature golf': 'Amusement',
  arcade: 'Amusement',
  gymnastics: 'Sports & Fitness',
  'recreation center': 'Sports & Fitness',
  pool: 'Sports & Fitness',
  'skating rink': 'Sports & Fitness',
  'art gallery': 'Arts & Culture',
  'painting studio': 'Arts & Culture',
  theater: 'Arts & Culture',
  theatre: 'Arts & Culture',
  studio: 'Arts & Culture',
  garden: 'Nature',
  'botanical garden': 'Nature',
  'nature center': 'Nature',
  'historical landmark': 'Nature',
  'tourist attraction': 'Nature',
  'visitor center': 'Nature',
  preschool: 'Learning',
  'day care': 'Learning',
  daycare: 'Learning',
  'education center': 'Learning',
  'after school': 'Learning',
  school: 'Learning',
  'community center': 'Community',
  'convention center': 'Community',
  'non-profit': 'Community',
  camp: 'Camp',
  'summer camp': 'Camp',
  'day camp': 'Camp',
  online: 'Other',
  other: 'Other',
};

/**
 * Convert a legacy place_type to a new category
 */
export function getCategoryFromLegacyType(legacyType: string): PlaceCategory {
  const normalized = legacyType.toLowerCase().trim();
  return LEGACY_TYPE_TO_CATEGORY[normalized] || 'Other';
}

/**
 * Determine category using all available data
 * Priority: Google types > legacy type > keyword matching
 */
export function determineCategory(options: {
  googleTypes?: string[];
  legacyPlaceType?: string;
  venueName?: string;
  title?: string;
  description?: string;
}): PlaceCategory {
  const { googleTypes, legacyPlaceType, venueName, title, description } = options;

  // 1. Try Google types first (most reliable)
  if (googleTypes && googleTypes.length > 0) {
    const category = getCategoryFromGoogleTypes(googleTypes);
    if (category !== 'Other') {
      return category;
    }
  }

  // 2. Try legacy place_type
  if (legacyPlaceType) {
    const category = getCategoryFromLegacyType(legacyPlaceType);
    if (category !== 'Other') {
      return category;
    }
  }

  // 3. Try keyword matching on venue name (most specific)
  if (venueName) {
    const category = getCategoryFromKeywords(venueName);
    if (category !== 'Other') {
      return category;
    }
  }

  // 4. Try keyword matching on title
  if (title) {
    const category = getCategoryFromKeywords(title);
    if (category !== 'Other') {
      return category;
    }
  }

  // 5. Try keyword matching on description (least specific)
  if (description) {
    const category = getCategoryFromKeywords(description);
    if (category !== 'Other') {
      return category;
    }
  }

  return 'Other';
}
