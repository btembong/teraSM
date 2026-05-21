# Tera SM — Onboarding & Registration Flow
## Session Log & Reference Document

---

## Overview

This document covers everything built for the school registration, deployment, and onboarding flow. Use this as a reference when picking up work on these features.

---

## Full User Journey

```
/register → /deploy → /login → /dashboard → /welcome (first time only) → /admin
```

---

## 1. Font — Exo 2

**Problem:** Font was not loading globally.
**Root cause:** `layout.tsx` was importing `Geist` + `Inter` from `next/font/google` and applying them as `font-sans`, overriding the Exo 2 CSS import.

**Fix applied to:**
- `apps/web/src/app/layout.tsx` — replaced with `Exo_2` from `next/font/google`
- `apps/web/tailwind.config.ts` — changed `fontFamily.sans` to `'var(--font-sans)'`
- `apps/web/src/app/globals.css` — removed the Google Fonts `@import` URL

```tsx
// layout.tsx
import { Exo_2 } from 'next/font/google'
const exo2 = Exo_2({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })
```

---

## 2. Registration Page — 7-Step Wizard

**File:** `apps/web/src/app/(auth)/register/page.tsx`

### Steps
| Step | Content |
|---|---|
| 1 | First name, last name, work email, password, confirm password, 4-digit PIN |
| 2 | Email OTP verification (6-digit code sent via Resend or printed to terminal) |
| 3 | School identity — name, short name, type, year, reg number, accreditation, motto, description, student/staff counts |
| 4 | Location & contact — country, state, city, address, postal code, phone, school email, website |
| 5 | Academic setup — calendar type, grading system, language, currency, timezone |
| 6 | Branding — logo upload, primary color, accent color, subdomain with availability check |
| 7 | Plan selection — Starter / Pro / Enterprise / University with monthly/annual toggle |

### Key behaviour
- Framer Motion slide transitions between steps
- Desktop sidebar shows step completion
- Step 1 → calls `POST /api/auth/send-otp` to send OTP
- Step 2 → calls `POST /api/auth/verify-otp` to verify
- Step 7 (Deploy button) → saves ALL form data to `sessionStorage` as `tera_deploy` → `router.push('/deploy')`

### Why sessionStorage (not URL params)
Passing a base64 logo in URL query params causes **HTTP 431 Request Header Fields Too Large**. SessionStorage avoids this completely.

### Data saved to sessionStorage
```js
sessionStorage.setItem('tera_deploy', JSON.stringify({
  // Visual
  name, subdomain, color, logo,
  // Admin credentials
  firstName, lastName, email, password, pin,
  // School identity
  schoolName, shortName, institutionType, yearEstablished,
  registrationNumber, accreditationBody, motto, description,
  studentCount, staffCount,
  // Location
  country, state, city, address, postalCode,
  phone, schoolEmail, website,
  // Academic
  academicCalendar, gradingSystem, language, timezone, currency,
  // Branding
  primaryColor, accentColor, logoUrl,
  // Plan
  plan (uppercased), billing,
}))
```

---

## 3. OTP System

### Send OTP
**File:** `apps/web/src/app/api/auth/send-otp/route.ts`
- Validates email format
- Rate-limits: blocks after `OTP_MAX_RESENDS` (5) within the TTL window
- Generates a 6-digit code, stores in `global.__otpStore` with expiry
- Sends branded HTML email via **Resend** if `RESEND_API_KEY` is set
- Dev fallback: prints OTP to terminal console in a box

### Verify OTP
**File:** `apps/web/src/app/api/auth/verify-otp/route.ts`
- Checks for entry in store
- Checks expiry (10 minutes)
- Tracks wrong attempts (max 5 before lockout)
- Deletes entry on correct verification (single-use)

### OTP Store
**File:** `apps/web/src/lib/otp-store.ts`
- Pinned to `global.__otpStore` so it is shared across all API route modules in the same Next.js process
- A plain module-level `Map` would be a different instance per route module — this fixes that

```ts
export const otpStore: Map<string, OtpEntry> =
  global.__otpStore ?? (global.__otpStore = new Map())
```

### Environment variables needed
```env
RESEND_API_KEY=re_xxxxxxxxxxxx        # in apps/web/.env.local
EMAIL_FROM=Tera SM <noreply@terasms.com>
```

---

## 4. Deploy Page

**File:** `apps/web/src/app/deploy/page.tsx`

### What it does
1. Reads form data from `sessionStorage` on mount
2. Immediately calls `POST /api/auth/register` (real provisioning) in background
3. Runs a 10-step animated checklist (~9 seconds)
4. Shows `PromoCarousel` below the loader while deployment runs
5. On completion → shows success card (or error card if API failed)

### Background layout
- Light gradient background (`#f0f4ff → #fafcff → #f0faf5`)
- Soft ambient color blobs using school's brand color
- Dot grid pattern
- Floating particles (client-only, generated in `useEffect` to avoid hydration mismatch)

### Loader features
- School avatar (monochrome dark slate) with pulsing glow ring
- Giant gradient percentage counter
- Gradient progress bar with shimmer
- Horizontal step timeline — 10 dot icons with connecting line that fills as steps complete
- Active step card showing current step label

### Success state features
- Burst rings radiating from gradient checkmark
- "System active" live badge
- Stats row: Modules / Status / SLA
- Dashboard URL with copy button
- Gradient CTA → "Go to Admin Dashboard" → `/admin`

### Error state
- Red error card with exact error message
- Link back to `/register`

### Hydration fix
The `Particle` component uses `Math.random()` which differs between server and client.
**Fix:** All particle data is generated inside a `useEffect` in the `Particles` wrapper component — server renders nothing, client generates and renders after mount.

---

## 5. Promo Carousel

**Component:** `PromoCarousel` inside `apps/web/src/app/deploy/page.tsx`

- Appears below the loader card, only during deployment (hidden after done)
- Auto-rotates every 3.5 seconds
- Smooth slide transition with Framer Motion
- Progress bar at card bottom counts down each slide
- Clickable dot indicators

### Slides
| # | Type | Content |
|---|---|---|
| 1 | Feature | Live classes — no Zoom needed |
| 2 | Feature | AI academic advisor |
| 3 | Feature | Online fee collection |
| 4 | Sponsored | School banking (amber badge + CTA link) |
| 5 | Feature | Branded mobile app add-on |

### Monetisation
Sponsored slides show an amber `Sponsored` badge and a "Learn more" CTA link. Charge businesses per impression or flat monthly fee. Add/edit slides in the `PROMO_SLIDES` array at the top of the deploy page file.

### To remove entirely
Delete the line: `{!done && <PromoCarousel />}` from the JSX.

---

## 6. Real Tenant Provisioning API

**File:** `apps/web/src/app/api/auth/register/route.ts`

### What it creates (in a single DB transaction)
1. **Tenant** — name, slug (subdomain), plan, status (TRIAL), email, phone, country, timezone, logoUrl, studentCap, storageCap, trialEndsAt
2. **User** — TENANT_ADMIN role, ACTIVE status, hashed password, hashed PIN, emailVerified set to now
3. **TenantSettings** — primaryColor, secondaryColor, accentColor

### Plan caps
| Plan | Student cap | Storage cap |
|---|---|---|
| STARTER | 500 | 10 GB |
| PRO | 3,000 | 100 GB |
| ENTERPRISE | 10,000 | 500 GB |
| UNIVERSITY | 99,999 | 9,999 GB |

### Trial period
- STARTER / PRO: 14-day trial (`trialEndsAt = now + 14 days`)
- ENTERPRISE / UNIVERSITY: no trial end date

### PIN storage
`pinHash` field added to the `User` model via `prisma db push`. Hashed with bcrypt (rounds: 10).
After `db push`, if Prisma client type is stale (Windows DLL lock), restart dev server and run `npx prisma generate`.

---

## 7. Middleware — Subdomain Routing

**File:** `apps/web/src/middleware.ts`

### Subdomain detection
```ts
const host = req.headers.get('host') // e.g. "fpui.terasms.com"
const isRootDomain = rootDomains.some(d => host ends with d or is localhost)
const subdomain = !isRootDomain ? host.split('.')[0] : null
// Attaches x-tenant-slug header for server components
```

### Public routes (no auth required)
```
/, /login, /register, /forgot-password, /pricing, /features,
/about, /contact, /solutions, /integrations, /security,
/status, /blog, /dashboard, /deploy, /welcome
```

### Protection
All other routes require an authenticated session. Unauthenticated users redirected to `/login?callbackUrl=<original path>`.

---

## 8. Session — onboardingComplete

**Files modified:**
- `apps/web/src/types/next-auth.d.ts` — added `onboardingComplete: boolean`
- `apps/web/src/lib/auth.ts` — added to JWT token and session callbacks
- `apps/web/src/app/dashboard/page.tsx` — checks flag before redirecting

### Dashboard redirect logic
```ts
// First-ever admin login → welcome letter
if (adminRoles.includes(role) && onboardingComplete === false) {
  redirect('/welcome')
}
// Otherwise → normal portal
redirect(ROLE_REDIRECT[role])
```

---

## 9. Welcome Letter Page

**File:** `apps/web/src/app/welcome/page.tsx`

### When it shows
First login only for admin roles where `onboardingComplete === false`. Never shows again after clicking "Enter my dashboard".

### Letter sections
| Section | Content |
|---|---|
| Letterhead | Logo, "Office of the CEO", date, ref number, addressed to |
| Welcome | Personal welcome from the CEO |
| What we built | 5 feature bullet points |
| Getting started | 3 numbered steps (academics → staff → fees) |
| Trial terms | 14-day trial, downgrade policy, data export |
| Data privacy | Encryption, no data selling, GDPR, ownership |
| Support | Help centre, email, WhatsApp contact grid |
| Disclaimer | SLA notice, change policy, legal responsibility |
| Signature | Bejumeh Tembong, CEO, italic serif font |

### Sticky bottom bar
- Checkbox: "I have read and understood..." (required before proceeding)
- "Enter my dashboard" button — disabled (grey) until checkbox is ticked
- On click: calls `POST /api/onboarding/complete` → sets `onboardingComplete: true` in DB → redirects to `/admin`

### Mark complete API
**File:** `apps/web/src/app/api/onboarding/complete/route.ts`
```ts
await prisma.user.update({
  where: { id: session.user.id },
  data:  { onboardingComplete: true },
})
```

### Scroll animations
Each section uses `IntersectionObserver` to fade in as the user scrolls — feels like reading a real document.

---

## 10. What Is Needed for Real Subdomain Routing

The subdomain (`school.terasms.com`) currently gives DNS error because the domain is not configured yet. Once you have `terasms.com`:

| Step | Action |
|---|---|
| 1 | Add wildcard DNS: `*.terasms.com → 76.76.21.21` (Vercel IP) on Cloudflare/Namecheap |
| 2 | Add `*.terasms.com` as a domain in the Vercel project settings |
| 3 | Middleware subdomain detection is already built — works automatically |
| 4 | Replace base64 logo with Cloudflare R2 upload (returns CDN URL) |
| 5 | Update deploy success CTA from `/admin` to real `https://${subdomain}.terasms.com/admin` |

---

## Key Files Reference

| File | Purpose |
|---|---|
| `apps/web/src/app/(auth)/register/page.tsx` | 7-step registration wizard |
| `apps/web/src/app/(auth)/login/page.tsx` | Institution search login |
| `apps/web/src/app/deploy/page.tsx` | Deployment animation + promo carousel |
| `apps/web/src/app/welcome/page.tsx` | CEO welcome letter (first login only) |
| `apps/web/src/app/api/auth/register/route.ts` | Full tenant provisioning API |
| `apps/web/src/app/api/auth/send-otp/route.ts` | Send OTP via Resend |
| `apps/web/src/app/api/auth/verify-otp/route.ts` | Verify OTP |
| `apps/web/src/app/api/onboarding/complete/route.ts` | Mark onboarding complete |
| `apps/web/src/lib/otp-store.ts` | Global in-memory OTP store |
| `apps/web/src/lib/auth.ts` | NextAuth config + session callbacks |
| `apps/web/src/middleware.ts` | Route protection + subdomain detection |
| `apps/web/src/app/dashboard/page.tsx` | Smart redirect by role + onboarding state |
| `apps/web/src/types/next-auth.d.ts` | Session type extensions |
| `prisma/schema.prisma` | DB schema (pinHash added to User) |

---

## Environment Variables Checklist

```env
# apps/web/.env.local

NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

DATABASE_URL=           # Neon pooled URL
DIRECT_URL=             # Neon direct URL (no -pooler, for migrations)

RESEND_API_KEY=         # Real OTP emails (optional in dev — prints to terminal)
EMAIL_FROM=Tera SM <noreply@terasms.com>

ANTHROPIC_API_KEY=      # AI features (Phase 9)
LIVEKIT_API_KEY=        # Live classes (Phase 5)
LIVEKIT_API_SECRET=
NEXT_PUBLIC_LIVEKIT_URL=

GOOGLE_CLIENT_ID=       # Google OAuth (optional)
GOOGLE_CLIENT_SECRET=
```

---

## Pending / Next Steps

- [ ] Obtain `terasms.com` domain → set wildcard DNS → add to Vercel
- [ ] Replace base64 logo with Cloudflare R2 upload during registration
- [ ] Add Resend API key and verify sender domain in Resend dashboard
- [ ] Add payment step after plan selection for paid plans (Paystack / Stripe)
- [ ] Gate subdomain field to Pro+ only (Starter gets auto-slug)
- [ ] Update deploy success CTA to real subdomain URL once DNS is live
- [ ] Add Google OAuth credentials
- [ ] Run `npx prisma generate` after stopping dev server (Windows DLL lock fix for pinHash type)
