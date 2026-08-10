# SETUP.md — From ZIP File to Live Website

This guide takes you from the ZIP file you downloaded to a real, published
website that anyone can visit in a browser. Follow it in order — don't skip
steps even if they look optional.

Estimated time: 30–45 minutes the first time.

---

## What you'll have at the end

A real website at a URL like `https://vfm-yourname.vercel.app` (and later,
optionally, your own domain like `vfm.com`) that:
- Lets visitors search for products and get real AI-powered price comparisons
- Lets visitors create accounts and log in
- Saves their searches, saved products, and price-tracking list in a real database

---

## PART 1 — Get the tools you need (one-time setup)

### 1.1 Install Node.js
This lets you run the website on your own computer before publishing it.

1. Go to **https://nodejs.org**
2. Download the version marked **LTS** (Long Term Support)
3. Run the installer, click Next through all the defaults
4. To check it worked: open a terminal (Mac: "Terminal" app, Windows: "Command Prompt" or "PowerShell") and type:
   ```
   node --version
   ```
   You should see something like `v20.x.x`. If you see "command not found," restart your computer and try again.

### 1.2 Create a free GitHub account
GitHub stores your code online so the hosting service can find it.

1. Go to **https://github.com**
2. Click **Sign up**, follow the steps
3. Verify your email when asked

### 1.3 Create a free Vercel account
Vercel is the hosting service that will make your site live on the internet.
It's made by the same company that built Next.js, so it works with zero
configuration for this kind of project.

1. Go to **https://vercel.com**
2. Click **Sign Up**
3. Choose **Continue with GitHub** (this links the two accounts, which makes Part 3 much easier)

---

## PART 2 — Get your AI key and run the site on your own computer

### 2.1 Unzip the project
Unzip the file you downloaded into a folder, e.g. `vfm-website` on your Desktop.

### 2.2 Open the folder in a terminal
- **Mac:** Right-click the `vfm-website` folder → "New Terminal at Folder" (or open Terminal and type `cd ~/Desktop/vfm-website`)
- **Windows:** Open the `vfm-website` folder in File Explorer, click the address bar, type `cmd`, press Enter

### 2.3 Install the project's dependencies
In the terminal, type:
```
npm install
```
This downloads everything the project needs. It can take 1–3 minutes. You'll see a lot of text scroll by — that's normal.

### 2.4 Get a real Gemini API key (this powers the AI)
The AI search and chat features need this. Without it, search will return an error.

1. Go to **https://aistudio.google.com/apikey**
2. Sign in with a Google account
3. Click **Create API key**, choose or create a Google Cloud project when prompted
4. Copy the key.
5. Note: Gemini API usage is billed by usage (pay-as-you-go) once you exceed the free tier. Check **https://aistudio.google.com/apikey** for current limits and pricing, and enable billing on the linked Google Cloud project before relying on it for production traffic.

### 2.5 Create your environment file
In the project folder, find the file called `.env.example`. Make a copy of it
and rename the copy to exactly `.env` (no `.example` at the end).

- **Mac/Linux terminal:**
  ```
  cp .env.example .env
  ```
- **Windows terminal:**
  ```
  copy .env.example .env
  ```

Now open `.env` in any text editor (Notepad, TextEdit, VS Code) and:

1. Replace `sk-ant-REPLACE-WITH-YOUR-REAL-KEY` with the real key you copied in step 2.4
2. Replace `REPLACE-WITH-A-RANDOM-32-BYTE-STRING` with a random secret. To generate one:
   - **Mac/Linux terminal:** `openssl rand -base64 32`
   - **Windows:** go to **https://generate-secret.vercel.app/32** and copy the result
   - Paste whatever it gives you in place of the placeholder text
3. Set `DATABASE_URL` to a real Postgres connection string — see 2.6 below
4. Save the file

### 2.6 Set up the database
This project's schema targets Postgres, both locally and in production — there
is no zero-setup SQLite fallback. You need one cloud database before the site
will run anywhere, including on your own computer.

1. Go to **https://supabase.com** (or **https://neon.tech** — both work) and
   sign up
2. Create a new project (any name)
3. Find the connection string — in Supabase, click **Connect** near the top of
   the project page, and under **Connection Method** choose **Session
   pooler**, not "Direct connection". Copy the URI. It looks like:
   ```
   postgresql://postgres.xxxx:[YOUR-PASSWORD]@aws-0-<region>.pooler.supabase.com:5432/postgres
   ```
   Supabase's "Direct connection" is IPv6-only unless you pay for their IPv4
   add-on, which breaks on most laptops and always breaks on Vercel (IPv4-only
   by default) — you'll get `P1001: Can't reach database server`. Session
   pooler avoids this and, unlike Transaction pooler, still supports the
   advisory locks Prisma's migration tool needs.
4. Replace `[YOUR-PASSWORD]` with your actual database password (the one you
   set when creating the project) and paste the whole string into
   `DATABASE_URL` in `.env`
5. Create the tables:
   ```
   npm run db:setup
   ```
   This applies the committed migrations in `prisma/migrations/` to your
   database. Safe to re-run — already-applied migrations are skipped.

You're using one database for both local development and production. That's
fine for a solo project — test accounts and real accounts share one table,
which is simplest until you outgrow it. If you'd rather keep them separate,
create a second Supabase/Neon project for local dev and point your local
`.env` at that one instead; use the same steps above.

> No Gemini key yet, or want to avoid spending anything while you look
> around? Set `VFM_MOCK_SEARCH=1` in `.env`. Searches then return fixed example
> results instantly and for free — everything else (signup, saving, history,
> chat) still works. See "Working on the site without spending money" near the
> end of this file.

### 2.7 Run the website on your computer
```
npm run dev
```
Then open your browser and go to **http://localhost:3000**

You should see the VFM homepage. Try searching for something like "wireless
earbuds under $100" — if your API key is set up correctly, you'll get real
results in about 10–20 seconds.

**If something doesn't work here, fix it before moving to Part 3** — publishing
a broken version doesn't help. Common issues:
- "AI service is not configured" → double check your `.env` file has the real key, then stop the server (Ctrl+C) and run `npm run dev` again (changes to `.env` require a restart)
- Page won't load at all → make sure `npm install` finished without red error text

---

## PART 3 — Publish it to the internet

### 3.1 Put your code on GitHub
1. Go to **https://github.com/new**
2. Name the repository `vfm-website` (or anything you like)
3. Leave it **Public** or **Private** — both work fine with Vercel
4. Don't check any of the boxes (no README, no .gitignore — you already have these)
5. Click **Create repository**
6. GitHub will show you some commands. Back in your terminal (still in the `vfm-website` folder), run:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/vfm-website.git
   git push -u origin main
   ```
   (Replace `YOUR-USERNAME` with your actual GitHub username — GitHub shows you the exact URL to copy on the page from step 5.)

Your code is now on GitHub. Refresh the GitHub page and you should see all your files there.

> **Security check:** Look at the file list on GitHub. You should **NOT** see a file
> called `.env` listed. If you do see it, stop — it means your real API key is now
> public. Delete the repository, make sure `.env` is listed in `.gitignore` (it
> already is in this project), and redo this step.

### 3.2 Import the project into Vercel
1. Go to **https://vercel.com/new**
2. Find your `vfm-website` repository in the list and click **Import**
3. Vercel will detect it's a Next.js project automatically — leave the default settings

### 3.3 Add your environment variables to Vercel
Before clicking deploy, scroll to **Environment Variables** on the same screen
and add these three, one at a time (Name → Value → Add):

| Name | Value |
|---|---|
| `GEMINI_API_KEY` | the same real key from step 2.4 |
| `AUTH_SECRET` | the same secret from step 2.5 |
| `DATABASE_URL` | the same Postgres connection string from step 2.6 |

Production uses the same database you already set up for local development —
no separate database step needed here. (If you'd rather keep production data
separate from local testing, create a second Supabase/Neon project and use
its connection string here instead; the tables get created automatically the
first time you run `npm run db:setup` against it locally.)

### 3.4 Deploy
Back on the Vercel import screen (or the project dashboard if you already
clicked deploy once), click **Deploy**.

Vercel will build your project. This takes 1–3 minutes. Watch the log — if it
finishes with a green checkmark, you're live.

### 3.5 The database tables are already there
If you ran `npm run db:setup` in step 2.6 against the same connection string
you put in Vercel, the tables already exist — nothing else to do here.

From now on, any time you change `prisma/schema.prisma`, run
`npx prisma migrate dev --name describe-your-change` locally (against the same
database Vercel uses, per step 3.3) — this both writes the migration file and
applies it. Commit the new file in `prisma/migrations/` and push. Vercel's
build only runs `prisma generate`, not `migrate deploy`, so the table change
itself has to happen from your machine as shown here, not just from a push.

### 3.6 Visit your live site
Vercel gives you a URL like `https://vfm-website-yourname.vercel.app`. Open it
in a browser — on your phone, on a friend's computer, anywhere. It's now a
real, published website.

---

## PART 4 — Optional: use a real domain name like vfm.com

1. Buy a domain from any registrar (Namecheap, Google Domains, GoDaddy) — note that `vfm.com` itself is very likely already owned by someone else, so you'll probably need a variant
2. In your Vercel project, go to **Settings → Domains**
3. Type in your domain and click **Add**
4. Vercel shows you DNS records to add at your domain registrar (usually one or two lines)
5. Add those records in your registrar's DNS settings page
6. Wait 10 minutes to a few hours for DNS to update — then your domain points at your site

---

## Troubleshooting

**"Internal Server Error" on the live site, but it worked locally**
→ Almost always a missing or incorrect environment variable in Vercel. Go to
your Vercel project → Settings → Environment Variables and double-check all
three are set correctly, then redeploy (Deployments tab → "..." menu → Redeploy).

**Signup/login doesn't work on the live site**
→ Check that `DATABASE_URL` in Vercel matches the connection string you ran
`npm run db:setup` against (step 3.5) — a typo'd string means Vercel is
pointed at a database with no tables in it.

**AI search returns an error**
→ Check your Gemini API billing/quota page at https://aistudio.google.com/apikey —
keys stop working if you've hit a rate limit or free-tier quota with no billing
enabled.

**Changes I make locally don't show up on the live site**
→ You need to `git push` your changes. Vercel automatically redeploys every
time you push to the `main` branch on GitHub.

**"The AI service isn't configured yet"**
→ Your `GEMINI_API_KEY` is missing or still the placeholder. Changes to
`.env` only take effect after restarting the server (Ctrl+C, then `npm run dev`).
If you just want to look at the site without a key, set `VFM_MOCK_SEARCH=1`
instead — see below.

**Search results look identical every time / mention "sample data"**
→ `VFM_MOCK_SEARCH=1` is set in your `.env`. That's the offline sample mode.
Set it to `0` and restart to get live results.

**"Search limit reached" when I've only done a few searches**
→ That's the built-in rate limit protecting your API bill: 5 searches per hour
for logged-out visitors, 30 for logged-in accounts. Log in, or wait an hour.
The numbers live in `LIMITS` in `lib/rate-limit.ts` if you want to change them.

**"the URL must start with the protocol `postgresql://`" or similar**
→ `DATABASE_URL` still has the old `file:./dev.db` value, or a typo. Check
step 2.6.

---

## Plans, and how to put someone on a paid one

The site has three tiers — Free, Pro and Premium — and they are real: each one
decides which AI model runs the search, how carefully it thinks, and how many
searches that account gets per month. You can see them at `/pricing`.

**What is not built is the payment step.** Nothing on the site takes money, so
everyone who signs up is on Free. That's deliberate — a checkout button that
didn't charge anything would be worse than none at all.

To move an account onto a paid plan yourself (for a friend, a tester, or you):

```
npm run plan:set -- their@email.com pro
```

Use `free`, `pro` or `premium`. The change takes effect on their next click —
they don't need to log out. To put someone back: `npm run plan:set -- their@email.com free`.

If you later add Stripe, its webhook writes to the same place, and everything
above keeps working.

---

## Working on the site without spending money

Every AI search costs a small amount on your Gemini account. While you're
changing the design or testing signup and saving, you can turn the AI off:

1. In `.env`, set `VFM_MOCK_SEARCH=1`
2. Restart the server (Ctrl+C, then `npm run dev`)

Searches now return the same fixed example results instantly, at no cost. Every
other feature still works normally. Set it back to `0` when you want real
results — and make sure it is `0` (or absent) in Vercel.

---

## You're done

From here, any time you want to change something: edit the code locally, test
it with `npm run dev`, then `git add . && git commit -m "describe your change" && git push`.
Vercel redeploys automatically within a minute or two.
