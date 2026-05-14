# Aurora Events — Accounting & Invoicing

A web app for tracking expenses, managing customers and payees, and issuing on-brand invoices for **Aurora Events Hire Ltd**.

Built with **Next.js 15**, **Supabase** (auth + Postgres + file storage), **TypeScript**, and **Tailwind CSS**. Deployed to **Vercel**.

---

## 📋 What's already set up

- ✅ A live Supabase project: `aurora-events-accounting` (London / eu-west-2)
- ✅ Database schema with row-level security (only you can see your data)
- ✅ Storage bucket for receipt uploads (with per-user access control)
- ✅ Auto-incrementing invoice numbers
- ✅ Magic-link email authentication
- ✅ All your company defaults pre-loaded (registered address, bank details, payment terms)

The Supabase project URL and anonymous API key are already filled into `.env.local.example` — they're safe to use publicly (Row Level Security on the database means even with the key, no one can see anyone else's data).

---

## 🚀 First-time setup on your computer

### 1. Install prerequisites

You'll need **Node.js 20 or higher** and **VS Code** (or any code editor).

- Download Node.js: <https://nodejs.org/> (pick "LTS")
- Download VS Code: <https://code.visualstudio.com/>

After installing Node, open a terminal/command prompt and run:
```bash
node --version
```
You should see something like `v20.x.x` or `v22.x.x`.

### 2. Get the code into VS Code

Unzip this project somewhere sensible like `Documents/aurora-accounting/`. Then open it in VS Code:
- Open VS Code → **File → Open Folder…** → pick the unzipped folder

### 3. Install dependencies

In VS Code, open a terminal (**Terminal → New Terminal**) and run:
```bash
npm install
```
This downloads all the libraries the app needs. Takes ~30 seconds.

### 4. Create your environment file

Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```
On Windows in PowerShell: `Copy-Item .env.local.example .env.local`

The values inside are already correct for your Supabase project. No editing needed.

### 5. Run the app locally

```bash
npm run dev
```

Open <http://localhost:3000> in your browser. You'll see the login screen — enter your email, and Supabase will send you a magic link. Click it, and you're in.

---

## ☁️ Deploying to Vercel (so you can use it from your phone)

### 1. Push the code to GitHub

If you don't have a GitHub account yet, create one at <https://github.com>.

Once installed and logged in:
```bash
git init
git add .
git commit -m "Initial commit"
```
Then on GitHub create a new **private** repo called `aurora-accounting` and follow the on-screen "push existing repository" instructions (it'll show you the commands).

### 2. Connect to Vercel

- Go to <https://vercel.com> and sign in with your GitHub account
- Click **"Add New… → Project"**
- Pick your `aurora-accounting` repo
- Vercel auto-detects Next.js. Before clicking deploy, expand **"Environment Variables"** and add both lines from your `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL` = `https://uqhxfhmpgdicnexthwew.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_HfiLer-osV4HULZdWfNWkQ_mf_C4KPW`
- Click **Deploy**

About 90 seconds later, you'll have a live URL like `aurora-accounting.vercel.app`.

### 3. Configure your Supabase Auth redirect URL

So magic-link sign-in works on your live site:

- Go to <https://supabase.com/dashboard/project/uqhxfhmpgdicnexthwew/auth/url-configuration>
- Under **Redirect URLs**, add: `https://your-vercel-url.vercel.app/auth/callback`
- (Optional) Set **Site URL** to the same Vercel URL

### 4. (Optional) Use your own domain

If you want `accounts.auroraeventshire.uk` instead of the random Vercel URL:
- In Vercel: **Project → Settings → Domains → Add** → enter your subdomain
- Vercel shows you a DNS record to add at your domain registrar
- Once it propagates (usually a few minutes), update the Supabase redirect URL to your new domain

---

## 📚 What's in the code

```
aurora-accounting/
├── app/                          # Next.js pages
│   ├── login/                    # Magic link sign-in
│   ├── auth/                     # Auth callback + signout
│   └── (app)/                    # Authenticated app section
│       ├── dashboard/            # Stats overview
│       ├── expenses/             # Expense tracking
│       ├── invoices/             # Invoicing
│       ├── contacts/             # Customers + payees
│       └── settings/             # Company details
├── components/                   # React components
├── lib/
│   ├── supabase/                 # DB connection clients
│   ├── types.ts                  # Shared TS types
│   ├── utils.ts                  # Formatters
│   └── image.ts                  # Client-side receipt compression
├── supabase/migrations/          # SQL schema (for reference)
└── middleware.ts                 # Auth session refresh
```

---

## 🛠️ Common commands

```bash
npm run dev          # run locally on :3000
npm run build        # build for production
npm run start        # run the production build locally
npm run lint         # check code for issues
```

---

## 🔒 Security notes

- The Supabase `anon` API key is **safe to expose** — it's designed to be used in the browser. Row Level Security on every table ensures users can only access their own rows.
- Receipts are stored in a private Supabase storage bucket. Each user's files live in a folder named with their user ID, and the storage policies prevent any user from accessing another user's folder.
- Magic-link auth means no passwords to manage or leak.

---

## 💡 Adding a second user (e.g. your accountant)

Right now, anyone with a valid Supabase user can sign in and they'll get their own empty workspace. To give your accountant read access to **your** data, you have two options:

1. **Share your magic link sign-in** — log in on their device with your email
2. **Add a "shared workspaces" feature** to the codebase — this is non-trivial development work (a few hours) and would let multiple users see the same business's data

If you want option 2, it's a chat away.

---

## ❓ Troubleshooting

**"Login screen shows, but my magic link doesn't work"**
Check that the redirect URL in Supabase Auth settings matches the URL you're using (localhost or vercel).

**"Receipt upload fails"**
Files must be under 10MB. Supported types: JPG, PNG, WebP, HEIC, PDF.

**"My invoice numbers got out of sync"**
Go to **Settings → Invoice defaults → Next invoice number** and set it manually.

---

**Built for Aurora Events Hire Ltd** — Company No. 16712612
# aurora-accounting
