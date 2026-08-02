# Gayatri Home Tutors — Next.js Full Stack

A fully-featured home tuition bureau platform migrated from Vite/React to **Next.js 14 (App Router)** with SSG public pages, a MySQL backend, and a complete admin dashboard.

---

## Tech Stack

| Layer        | Technology                                              |
|--------------|---------------------------------------------------------|
| Framework    | Next.js 14 (App Router)                                 |
| Rendering    | SSG for public pages · CSR for admin dashboard          |
| Database     | MySQL 8+ via `mysql2`                                   |
| Auth         | JWT via `jose` + bcrypt via `bcryptjs` (cookie-based)   |
| Telegram     | Bot API (admin-triggered broadcast)                     |
| SEO          | Metadata API, JSON-LD, sitemap.xml, robots.txt          |
| Analytics    | Custom DB-backed page-view tracking via middleware      |
| Styling      | CSS3                                                    |

---

## Project Structure

```
gayatri-home-tutors/
├── app/
│   ├── layout.js                    # Root layout — fonts, global CSS, metadata
│   ├── sitemap.js                   # Auto-generated sitemap.xml
│   ├── (public)/                    # Public route group (Header + Footer)
│   │   ├── layout.js
│   │   ├── page.js                  # / — Home (SSG)
│   │   ├── about/page.js
│   │   ├── services/page.js
│   │   ├── contact/page.js
│   │   ├── become-tutor/page.js
│   │   └── terms/page.js
│   ├── admin/
│   │   ├── layout.js                # Admin layout (no public nav)
│   │   ├── login/page.js
│   │   ├── dashboard/page.js        # Analytics overview
│   │   ├── demo-requests/
│   │   │   ├── page.js              # All enquiries + lifecycle actions
│   │   │   └── new/page.js          # Log call/email/walk-in manually
│   │   ├── tutors/page.js           # Smart tutor search & management
│   │   ├── classes/page.js          # Visual Kanban pipeline
│   │   └── analytics/page.js
│   └── api/
│       ├── auth/login/route.js
│       ├── auth/logout/route.js
│       ├── demo/route.js            # POST — public form submission
│       ├── tutors/
│       │   ├── route.js             # POST — tutor registration
│       │   └── featured/route.js    # GET  — featured tutors (public)
│       ├── analytics/track/route.js # POST — page view tracker (internal)
│       └── admin/
│           ├── demo-requests/
│           │   ├── route.js         # GET  — list with filters
│           │   ├── [id]/route.js    # GET/PATCH — single + lifecycle actions
│           │   └── manual/route.js  # POST — log manual enquiry
│           ├── tutors/
│           │   ├── route.js         # GET  — list with smart filters
│           │   └── [id]/route.js    # GET/PATCH/DELETE
│           ├── telegram/route.js    # GET preview · POST send
│           └── analytics/route.js   # GET — dashboard stats
├── components/
│   ├── layout/
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   ├── PagesHero.jsx
│   │   └── ScrollToTop.js
│   ├── sections/
│   │   ├── PageSection.jsx
│   │   └── TermsAccordion.jsx
│   ├── forms/
│   │   ├── BookDemoForm.jsx         # Wired to /api/demo
│   │   └── BecomeTutorForm.jsx      # Wired to /api/tutors
│   └── admin/
│       ├── AdminSidebar.js
│       ├── TutorPickerModal.js
│       └── TelegramModal.js
├── lib/
│   ├── db.js                        # MySQL pool + query helpers
│   ├── auth.js                      # JWT + bcrypt + cookie helpers
│   ├── adminAuth.js                 # requireAdmin() middleware wrapper
│   ├── telegram.js                  # Bot API + message formatter
│   └── analytics.js                 # Page view tracker
├── styles/
│   ├── style.css                    # Your original styles (unchanged)
│   ├── responsive.css               # Your original responsive (unchanged)
│   ├── globals.css                  # Additions (form feedback, etc.)
│   └── admin.css                    # Full admin dashboard styles
├── database/
│   └── schema.sql                   # All tables + default admin seed
├── middleware.js                    # Edge: analytics tracking + admin auth guard
├── next.config.js
├── jsconfig.json                    # @ path aliases
└── .env.local.example               # All required env vars
```

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment
```bash
cp .env.local.example .env.local
# Edit .env.local with your DB credentials, JWT secret, Telegram bot token
```

### 3. Set up MySQL database
```bash
mysql -u root -p < database/schema.sql
```
This creates all tables and seeds a default admin: **username:** `admin` **password:** `admin123`
> ⚠️ Change the admin password immediately after first login.

### 4. Run development server
```bash
npm run dev
```

Public site: `http://localhost:3000`
Admin panel: `http://localhost:3000/admin/login`

### 5. Build for production
```bash
npm run build
npm start
```

---

## Admin Dashboard

### Login
`/admin/login` → username: `admin`, password: `admin123` (change this!)

### Pages
| Route | Purpose |
|---|---|
| `/admin/dashboard` | Stats overview, top tutors, page views |
| `/admin/demo-requests` | All enquiries, filter by status, full lifecycle |
| `/admin/demo-requests/new` | Log call/email/walk-in manually |
| `/admin/tutors` | Smart filter tutors by subject/area/exp/gender |
| `/admin/classes` | Kanban pipeline view of all class assignments |

### Class Lifecycle States
```
PENDING
  ├── [assign tutor]   → ASSIGNED
  │     ├── [accept]   → ACCEPTED ✅
  │     └── [reject]   → REJECTED_BY_TUTOR
  │           ├── [reassign]  → REASSIGNED (loops back to ASSIGNED)
  │           └── [drop]      → DROPPED 🗑
  └── [cancel]         → CANCELLED ⛔
```

### Tutor Filtering
Filter tutors by: subject · area · status · gender · min experience · class group · featured

### Telegram Broadcast
1. Open any demo request row → click 📢
2. Preview the auto-formatted message
3. Optionally edit it
4. Click "Send to Channel" — broadcasts to your Telegram channel

---

## Telegram Bot Setup

1. Create a bot via [@BotFather](https://t.me/BotFather) → get `BOT_TOKEN`
2. Create a Telegram channel for tutors
3. Add the bot as **Admin** to the channel
4. Get the channel ID: either `@your_channel_username` or the numeric `-100xxxxxxxxxx`
5. Add both to `.env.local`

---

## SEO Features

- **SSG** for all 6 public pages (fastest load, best crawlability)
- Per-page `<title>` and `<meta description>` via Next.js Metadata API
- **JSON-LD** structured data on Home page (LocalBusiness schema)
- Auto-generated **sitemap.xml** at `/sitemap.xml`
- **Canonical URLs** on every page
- **OpenGraph** tags for social sharing
- Next.js `<Image>` component (lazy-load, WebP conversion)
- Google Fonts loaded via `next/font` (no render-blocking)

---

## Analytics

Page views are tracked automatically via `middleware.js` (Edge Runtime) for every public page visit. No third-party scripts. View stats in `/admin/dashboard` → **Top Pages** and **Total Visitors**.

---

## Components You Still Need to Migrate

The following section components from your original codebase need to be added. They were not uploaded, so just move them from your Vite project and add `"use client"` at the top if they use hooks:

- `components/sections/HeroSection.jsx`
- `components/sections/AboutSections.jsx`
- `components/sections/ServicesSections.jsx`
- `components/sections/ContactSections.jsx`
- `components/sections/OurTutorsSection.jsx`

For any component using `react-router-dom`, replace:
```js
// Before
import { Link } from "react-router-dom";
// After
import Link from "next/link";
```
And replace `<img>` tags with `<Image>` from `next/image` where possible.

---

## Password Management

To change/set admin password, run this in Node or a script:
```js
import bcrypt from "bcryptjs";
const hash = await bcrypt.hash("your-new-password", 10);
// UPDATE admin_users SET password_hash = '<hash>' WHERE username = 'admin';
```

---

## Env Variables Reference

| Variable | Description |
|---|---|
| `DB_HOST` | MySQL host |
| `DB_PORT` | MySQL port (default 3306) |
| `DB_USER` | MySQL user |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | Database name |
| `JWT_SECRET` | Long random string for signing tokens |
| `TELEGRAM_BOT_TOKEN` | From @BotFather |
| `TELEGRAM_CHANNEL_ID` | `@channel` or `-100xxxxxxxxxx` |
| `NEXT_PUBLIC_SITE_URL` | Your production domain |
| `NEXT_PUBLIC_PHONE` | Phone number shown on site |
