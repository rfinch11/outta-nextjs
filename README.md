# Outta - Next.js Migration

**Status:** 🚧 Active Development - Phase 1 Complete
**Original Site:** [outta.events](https://outta.events)
**GitHub:** [rfinch11/outta-nextjs](https://github.com/rfinch11/outta-nextjs)

This is the Next.js 14 migration of Outta, a kid-friendly adventures discovery platform. We're migrating from a CDN-based React application to a production-ready Next.js platform with TypeScript, Tailwind CSS, and server-side rendering.

## Migration Status

See [MIGRATION_PLAN.md](https://github.com/rfinch11/outta/blob/main/MIGRATION_PLAN.md) in the original repository for the complete migration roadmap.

- ✅ Phase 0: Pre-Migration Prep
- ✅ Phase 1: Initialize Next.js
- ⏸️ Phase 2: Migrate Core Components
- ⏸️ Phase 3: Testing Infrastructure
- ⏸️ Phase 4: Performance Optimization
- ⏸️ Phase 5: Production Cutover
- ⏸️ Phase 6: Authentication & User Accounts
- ⏸️ Phase 7: Advanced Features
- ⏸️ Phase 8: Analytics & Monetization

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Deployment:** Vercel

## Getting Started

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

# Format code
npm run format
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
outta-nextjs/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Homepage
│   ├── components/          # React components (coming in Phase 2)
│   └── lib/                 # Utilities
│       └── supabase.ts      # Supabase client
├── public/                  # Static assets
├── .env.local               # Environment variables (not committed)
├── .env.example             # Environment variables template
├── next.config.ts           # Next.js config
├── tailwind.config.ts       # Tailwind config
└── tsconfig.json            # TypeScript config
```

## Development Workflow

We use Git pre-commit hooks to ensure code quality:
- TypeScript type checking
- ESLint linting

All checks must pass before committing.

## Environment Variables

Required environment variables (see `.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Deployment

The site will be deployed on Vercel:
- **Staging:** TBD
- **Production:** TBD (after Phase 5)

## Contributing

This is a personal project, but feedback and suggestions are welcome! Please open an issue to discuss.

## Related Repositories

- [outta](https://github.com/rfinch11/outta) - Original CDN-based React application (production)

## License

Private - All Rights Reserved
