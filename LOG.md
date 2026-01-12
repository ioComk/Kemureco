## LOG.md Summary

### Project Overview
Kemureco is a web platform for shisha users, focused on accurate session/flavor recording, strong filtering UX, and stable deployment using Next.js, Supabase, and Cloudflare Pages.

---

### Core Timeline

#### Initial Setup (Nov 2025)
- Project initialized with Next.js + Supabase
- Added Email/Google authentication
- Implemented basic flavor list, mix creation, and session logging
- Stabilized Cloudflare Pages builds

#### Feature Expansion (Nov–Dec 2025)
- Implemented mix dashboard, sliders, and theme switching
- Added X (Twitter) OAuth authentication
- Added grid/list toggle and image upload for flavors
- Implemented calendar modal with view/edit/delete/X-post actions
- Improved flavor search accuracy, including Japanese input
- Added free-text suggestions for session flavor input

#### UX & UI Refinement (Late Dec 2025)
- Major UI/UX overhaul across Home, Calendar, Records, and Modals
- Unified light/dark themes, buttons, borders, and icons
- Refreshed authentication UI and user menu
- Improved accessibility (ARIA titles, contrast, focus handling)
- Refactored calendar modal to shadcn/ui Carousel layout
- Enhanced satisfaction icons, card layouts, and visual hierarchy
- Added session overview charts (weekly/monthly/yearly)
- Standardized date formats and record card actions
- Improved flavor mix visualization (stacked bars, grams-first display)

#### Location & Maps
- Migrated location input to Mapbox Searchbox API
- Added manual location entry for unregistered shops
- Generated Google Maps links from stored or manual locations
- Added location history suggestions from past sessions
- Prepared schema for future Google Places integration

#### Flavor & Filtering
- Improved flavor filtering by tags and brands (multi-select, URL sync)
- Switched brand/manufacturer filtering to ID-based logic
- Added client-side caching to avoid unnecessary refetching
- Ensured newly created flavors and brands appear immediately
- Improved kana-to-English flavor name matching

#### Stability & Build Fixes
- Fixed multiple TypeScript and Next.js build errors
- Resolved Supabase insert typing issues via explicit required columns
- Unified route/link typing to prevent build failures
- Stabilized Cloudflare Pages builds and dependencies

#### Recent Updates (Jan 2026)
- Synced flavor lists after creation without reload
- Removed unnecessary fields from flavor creation form
- Improved client-side caching for instant filter rendering
- Fixed post-login redirect to Home
- Prevented regressions by maintaining client-fetched data
- Prevented location autocomplete from opening automatically when entering session edit mode
- Applied the same card-style layout to the flavor section in the session list view

---

### Key Principles
- Prefer client-side state consistency over refetching
- Enforce type safety aligned with Supabase schemas
- Treat accessibility and dark mode as first-class concerns
- Centralize decisions and progress in LOG.md for handover
