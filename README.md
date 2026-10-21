# Rafi Book — Social Networking Website Starter

Rafi Book is a responsive React + Vite social-network starter with a Facebook-inspired layout. It includes a working UI preview, email/password auth wiring, feed loading and post publishing when configured with Supabase, plus database schema foundations for profiles, likes, comments, friend requests, groups, pages, messaging, and notifications.

## Important status note

This ZIP is a **starter project**, not a production-ready Facebook clone. The preview includes sample posts and interactive UI. Supabase sign-up/login and persistent post publishing can be enabled with your own Supabase project. Friends, groups/pages persistence, real likes/comments, stories, media uploads, and real-time messaging still need to be connected to the database and tested before public launch.

## 1. Run locally

Install Node.js LTS first: https://nodejs.org/

```bash
npm install
cp .env.example .env.local
npm run dev
```

On Windows PowerShell, copy the environment file with:

```powershell
Copy-Item .env.example .env.local
```

Then open the local URL printed by Vite, normally `http://localhost:5173`.

Without Supabase credentials, the website opens in **preview mode**. Sample feed, layout, tabs and temporary interactions work, but accounts/posts are not saved online.

## 2. Connect Supabase

1. Create a project at https://supabase.com/dashboard.
2. Open Project Settings / API (or the Connect panel).
3. Copy the project URL and publishable key into `.env.local`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
4. In Supabase Dashboard → SQL Editor, run the contents of `supabase/schema.sql`.
5. In Authentication settings, configure allowed site URLs and email confirmation according to your intended deployment.
6. Restart the Vite server after editing `.env.local`.

Only use the Supabase **publishable** key in frontend environment variables. Never put a service-role/secret key in a frontend app or commit `.env.local` to GitHub.

Official guide: https://supabase.com/docs/guides/auth/quickstarts/react

## 3. Deploy to Vercel

1. Extract this ZIP.
2. Upload the folder to a new GitHub repository, or push it with Git.
3. In Vercel, import that repository.
4. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` under Project Settings → Environment Variables.
5. Deploy. Add your deployed domain to Supabase Auth's allowed redirect/site URL configuration.
6. Test sign-up, email confirmation, sign-in, post publishing and access rules on the live site.

Vercel should detect Vite automatically. Build command: `npm run build`; output directory: `dist`.

## 4. Features included in this starter

- Responsive Rafi Book branding and social feed layout
- Sign-up and sign-in form wired to Supabase Auth
- Profile table and automatic profile creation trigger
- Feed loading and persistent post publishing with Supabase
- Preview feed, post cards, temporary likes/comments, search
- Groups and Pages UI previews
- Responsive mobile layout
- SQL schema foundations for friends, groups, pages, messaging, likes, comments and notifications
- Row Level Security policies in the starter SQL

## 5. Still required before production

- Implement and test database-backed friend requests, likes, comments, groups/pages creation and membership
- Implement real-time one-to-one/group chat and notification delivery
- Add Supabase Storage buckets and safe upload policies for profile pictures, photos, videos, and stories
- Add privacy controls, blocking/reporting, moderation tools, admin roles, spam/rate limits, and account deletion
- Review every RLS policy, especially membership and private group rules; test with multiple accounts
- Add accessibility, error handling, backups, abuse monitoring, and a privacy policy/terms
- Do load/security testing before inviting public users

Do not advertise unfinished controls as production features. This starter does not use Facebook's logo or proprietary assets.
