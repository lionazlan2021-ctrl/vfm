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

### 2.4 Get a real Anthropic API key (this powers the AI)
The AI search and chat features need this. Without it, search will return an error.

1. Go to **https://console.anthropic.com**
2. Sign up / log in
3. Click **Settings → API Keys** (or **Get API Keys** on the dashboard)
4. Click **Create Key**, give it any name (e.g. "VFM website")
5. Copy the key — it starts with `sk-ant-...`. **Save it somewhere safe — you can't view it again after closing this screen.**
6. Note: Anthropic API usage is billed by usage (pay-as-you-go), not a flat subscription. Check **https://console.anthropic.com/settings/billing** to add a payment method and see current pricing — this is required before the key will work for live requests.

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
3. Leave `DATABASE_URL="file:./dev.db"` as-is for now — that's correct for testing on your computer
4. Save the file

### 2.6 About the local database
There's nothing to do here — `npm run dev` in the next step creates a small
database file on your computer automatically, so signup/login/saved products
work. You'll see it mention "migrations" the first time; that's expected.

(If you ever want to do it separately, `npm run db:setup` does the same thing.)

> No Anthropic key yet, or want to avoid spending anything while you look
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
| `ANTHROPIC_API_KEY` | the same real key from step 2.4 |
| `AUTH_SECRET` | the same secret from step 2.5 |
| `DATABASE_URL` | see step 3.4 below — come back to this after setting up a real database |

### 3.4 Set up a real production database
SQLite (the file-based database) only works on your own computer — it won't
work on Vercel because Vercel doesn't keep files between requests. You need a
real cloud database. The easiest free option:

1. Go to **https://neon.tech** (or **https://supabase.com** — both work, Neon is slightly simpler for this)
2. Sign up, create a new project (any name, e.g. "vfm-production")
3. Once created, find the **Connection String** (sometimes called "Connection Details") — it looks like:
   ```
   postgresql://user:password@host.neon.tech/dbname?sslmode=require
   ```
4. Copy that entire string
5. Back in Vercel's environment variables (step 3.3), set `DATABASE_URL` to this value

Now switch the project over to Postgres. **Follow all four steps** — changing
only the provider line is not enough, and step 3.4b is the one people miss.

**3.4a — Change the database type.** Open `prisma/schema.prisma` and change:
```
provider = "sqlite"
```
to:
```
provider = "postgresql"
```

**3.4b — Rebuild the migration files for Postgres.**

The files in `prisma/migrations/` were written for SQLite and use SQLite-only
types (`DATETIME`, which Postgres does not have). Handing them to Postgres fails
with a syntax error. You need to regenerate them:

1. Delete the whole `prisma/migrations` folder.
   - **Mac/Linux:** `rm -rf prisma/migrations`
   - **Windows:** delete the folder in File Explorer
2. In your local `.env`, temporarily change `DATABASE_URL` to the **Neon/Supabase
   connection string** you copied above (keep a note of the old `file:./dev.db`
   value if you want to go back to local development later).
3. Run:
   ```
   npx prisma migrate dev --name init
   ```
   This writes fresh Postgres-flavoured migration files **and** creates the
   tables in your real database at the same time. That means step 3.6 below is
   already done.

**3.4c — Put your local database setting back** (optional, but it lets you keep
developing locally): change `DATABASE_URL` in `.env` back to
`file:./dev.db`. Note that with the provider now set to `postgresql`, local
SQLite development no longer works — see "Going back to local development"
at the end of this file if you need it.

**3.4d — Commit and push:**
```
git add .
git commit -m "Switch to Postgres for production"
git push
```

### 3.5 Deploy
Back on the Vercel import screen (or the project dashboard if you already
clicked deploy once), click **Deploy**.

Vercel will build your project. This takes 1–3 minutes. Watch the log — if it
finishes with a green checkmark, you're live.

### 3.6 Set up the production database tables

**If you followed step 3.4b, this is already done** — `prisma migrate dev`
created the tables (User, Search, SavedProduct, TrackedProduct) at the same time
as it wrote the migration files. You can skip to 3.7.

To confirm, or if you skipped it: with `DATABASE_URL` in your local `.env`
temporarily set to the Neon/Supabase connection string, run:
```
npx prisma migrate deploy
```
This applies any migrations the database doesn't have yet. It is safe to run
more than once — already-applied migrations are skipped.

From now on, any time you change `prisma/schema.prisma`, run
`npx prisma migrate dev --name describe-your-change` locally, then commit the new
file in `prisma/migrations/` and push. Vercel applies it on the next deploy.

> **If you get `type "DATETIME" does not exist`,** the old SQLite migration files
> are still in `prisma/migrations/`. Go back and do step 3.4b.

### 3.7 Visit your live site
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
→ Check that `DATABASE_URL` in Vercel points to your real Postgres database
(not the local SQLite path), and that you ran `npx prisma migrate deploy`
against that same database (step 3.6).

**AI search returns an error**
→ Check your Anthropic billing page — API keys stop working if there's no
payment method on file or you've hit a spending limit.

**Changes I make locally don't show up on the live site**
→ You need to `git push` your changes. Vercel automatically redeploys every
time you push to the `main` branch on GitHub.

**"The AI service isn't configured yet"**
→ Your `ANTHROPIC_API_KEY` is missing or still the placeholder. Changes to
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

**`type "DATETIME" does not exist` when setting up the production database**
→ The SQLite migration files are still present. See step 3.4b.

---

## Going back to local development after switching to Postgres

Once `prisma/schema.prisma` says `provider = "postgresql"`, the local SQLite
file no longer works — Prisma needs the provider to match the database. Two
options:

- **Simplest:** keep using the cloud database for local development too. Leave
  `DATABASE_URL` in your local `.env` set to the Neon/Supabase string. Your local
  and live sites then share one database, so test accounts show up on both.
- **Keep them separate:** create a second free Neon project (e.g. "vfm-dev") and
  point your local `.env` at that one instead. Your live site keeps its own data.

Switching the provider line back to `sqlite` also works, but then you'd have to
regenerate the migration files again — it isn't worth it once you're live.

---

## Working on the site without spending money

Every AI search costs a small amount on your Anthropic account. While you're
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
