# AFC North Recap

A tiny, free, no-backend site for your weekly AFC North recap poems. Poems live as
markdown files in `content/poems/`, the site is a static React app, and it
publishes automatically to GitHub Pages whenever you add a new poem.

## One-time setup (~10 minutes)

1. **Create a new repo on GitHub.**
   Go to github.com → New repository. Name it whatever you like (e.g.
   `afc-north-poems`). Public or private both work with GitHub Pages, but
   private repos need a free GitHub account in good standing — public is
   simplest.

2. **Push this project to it.**
   From this folder:
   ```bash
   git init
   git add .
   git commit -m "Initial site"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```

3. **Turn on GitHub Pages.**
   In your repo: Settings → Pages → under "Build and deployment", set
   **Source** to **GitHub Actions**. (You don't need to pick a branch —
   the included workflow handles the build.)

4. **Let Actions write to your repo.**
   In your repo: Settings → Actions → General → scroll to "Workflow
   permissions" → select **Read and write permissions** → Save.
   (This is required so the "submit a poem via issue" automation can commit
   the new poem file for you.)

5. **Push anything** (or just re-run the "Deploy site" workflow from the
   Actions tab) to trigger the first build. After a minute or two, your site
   will be live at:
   ```
   https://<your-username>.github.io/<your-repo>/
   ```
   Send that link to your coworkers — it always shows the latest poem at the
   top, with older weeks in the archive below.

## Adding a poem each week (the easy way)

1. Go to your repo → **Issues** → **New issue** → pick the **New Poem**
   template.
2. Fill in the week number, season, date, title, matchup (optional), which
   team's colors to theme the page with, and paste in your poem.
3. Submit the issue.

A GitHub Action picks it up, creates the poem file, commits it, and closes
the issue with a confirmation comment. The site rebuilds automatically —
give it a minute or two, then your link is updated.

## Adding a poem manually (the fallback way)

If you'd rather just edit the repo directly (e.g. from GitHub.com's "Add
file" button, or locally):

1. Add a new file in `content/poems/`, named like `2026-week-05.md`.
2. Use this format:
   ```markdown
   ---
   title: "Your Poem Title"
   week: 5
   season: 2026
   date: 2026-10-06
   matchup: "BAL 24 - CIN 17"
   accentTeam: ravens
   ---
   Your poem text here,
   one line per line —
   line breaks are preserved exactly as written.
   ```
   `accentTeam` can be `ravens`, `bengals`, `browns`, `steelers`, or `mixed`
   — it just controls the accent color on that poem's page.
3. Commit/push (or commit directly on GitHub.com). The site rebuilds
   automatically.

## Local development (optional)

```bash
npm install
npm run dev
```

Opens the site at `http://localhost:5173` so you can preview before pushing.

## How it's built

- **React + TypeScript + Vite** — a static site, no server, no database.
- Poems are markdown files with simple frontmatter, loaded at build time.
- `.github/workflows/deploy.yml` builds and publishes to GitHub Pages on
  every push to `main`.
- `.github/workflows/add-poem.yml` + `.github/ISSUE_TEMPLATE/new-poem.yml`
  turn a GitHub issue into a committed poem file automatically.

Everything is free: GitHub Pages hosting and GitHub Actions minutes are free
for public repos (and Actions has a generous free tier for private repos
too, plenty for one poem a week).
