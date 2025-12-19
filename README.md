# Outta

**Production Site:** [outta.events](https://outta.events) • [www.outta.events](https://www.outta.events)
**GitHub:** [rfinch11/outta-nextjs](https://github.com/rfinch11/outta-nextjs)
**Status:** ✅ Live in Production

Outta is a kid-friendly adventures discovery platform built with Next.js 16, TypeScript, and Tailwind CSS. Find amazing activities, events, and camps for kids near you.

## 🛠 Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4
- **Database:** Supabase (PostgreSQL)
- **Deployment:** Vercel
- **Forms:** Typeform (@typeform/embed-react)
- **Icons:** React Icons (Lucide)

## 📦 Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Supabase account

### Installation

```bash
# Clone the repository
git clone https://github.com/rfinch11/outta-nextjs.git
cd outta-nextjs

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

### Development

```bash
# Run development server
npm run dev

# Run type checking
npm run type-check

# Run linter
npm run lint

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
outta-nextjs/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Homepage
│   │   └── listings/[id]/      # Dynamic listing detail pages
│   ├── components/             # React components
│   │   ├── Homepage.tsx        # Main homepage component
│   │   ├── ClickableCard.tsx   # Listing card component
│   │   ├── SearchModal.tsx     # Search modal
│   │   ├── FilterModal.tsx     # Filter modal
│   │   ├── LocationModal.tsx   # Location picker
│   │   ├── SubmitModal.tsx     # Typeform submission modal
│   │   ├── EventDetail.tsx     # Listing detail page
│   │   └── Footer.tsx          # Footer component
│   └── lib/                    # Utilities
│       └── supabase.ts         # Supabase client
├── public/                     # Static assets
│   ├── Outta_logo.svg
│   ├── hero.png
│   └── favicon.png
├── .env.local                  # Environment variables (not committed)
├── next.config.ts              # Next.js config
├── tailwind.config.ts          # Tailwind config
└── tsconfig.json               # TypeScript config
```

## 🔧 Development Workflow

We use Git pre-commit hooks to ensure code quality:
- TypeScript type checking
- ESLint linting

All checks must pass before committing.

## 🌍 Environment Variables

Required environment variables (see `.env.example`):

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🚀 Deployment

The site is deployed on Vercel with automatic deployments from the `main` branch:

- **Production:** [outta.events](https://outta.events) • [www.outta.events](https://www.outta.events)
- **Staging:** [outta-nextjs.vercel.app](https://outta-nextjs.vercel.app)

### Production Deployment

Push to `main` branch triggers automatic deployment:

```bash
git push origin main
```

Vercel automatically builds and deploys to outta.events with zero downtime.

## ✨ Features

- **Tab Navigation:** Browse Events, Activities, and Camps
- **Search:** Full-text search across all listings
- **Filters:** Distance, date, price, type, tags, and rating filters
- **Location:** Geolocation and zip code-based distance calculations
- **Listing Details:** Rich detail pages with maps, organizer info, and sharing
- **Submit Listings:** Integrated Airtable form for community submissions
- **Load More Pagination:** Infinite scroll with 15 items per page
- **Mobile Responsive:** Bottom sheet modals and mobile-first design

## 🗄 Database Schema

Powered by Supabase PostgreSQL with the following main tables:

- `listings` - Events, activities, and camps with geolocation data
- Future: `profiles`, `favorites`, `reviews`

## 📝 License

Private - All Rights Reserved

---

**Built with ❤️ by Ryan Finch**
