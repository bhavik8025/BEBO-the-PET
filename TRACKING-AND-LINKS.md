# BEBO the PET — Tracking & Links Reference

_Last updated: 2026-07-15_

One place for every link that matters — downloads, analytics, the live site, and the QR codes for presentations. Bookmark this file or just reopen it here whenever you need a link.

---

## 📊 Snapshot (as of 2026-07-15)

| Metric | Value |
|---|---|
| Total downloads (all versions, all files) | **45** |
| v1.0.0 | 24 (installer) + 16 (portable) = 40 |
| v2.0.0 | 2 (installer) + 1 (portable) = 3 |
| v2.0.1 | 2 (installer) + 0 (portable) = 2 |
| GitHub stars | 1 |
| Pages status | ✅ Live and built |

---

## 🔗 Downloads

| What | Link |
|---|---|
| **Download page (what users click)** | https://bhavik8025.github.io/BEBO-the-PET/download.html |
| **Direct download link** (evergreen — always latest version, used in QR codes) | https://github.com/bhavik8025/BEBO-the-PET/releases/latest |
| Direct EXE link (skips the release page, starts download immediately) | https://github.com/bhavik8025/BEBO-the-PET/releases/latest/download/BEBO.the.PET.Setup.exe |
| All releases (version history) | https://github.com/bhavik8025/BEBO-the-PET/releases |
| **Live downloads badge** (auto-updates, embedded in README + site) | https://img.shields.io/github/downloads/bhavik8025/BEBO-the-PET/total |
| Per-file / per-version download breakdown | https://tooomm.github.io/github-release-stats/?username=bhavik8025&repository=BEBO-the-PET |

---

## 📈 Analytics — website visitors + active installs

| What | Link | Status |
|---|---|---|
| **GoatCounter dashboard** (site visits + daily active installs, split by version) | https://bebothepet.goatcounter.com | ⛔ **Dead until signup completed** |
| GoatCounter signup page | https://www.goatcounter.com/signup | Account name must be exactly `bebothepet` |

**How it works once live:** the website pings GoatCounter on every visit (script on all 5 pages). The installed app itself also pings once a day per active install — shows up as page path `/app/v2.0.1` etc., so you can see how many people are on each version. Both are anonymous (no cookies, no personal data). Users can turn the app ping off from the panel's ⚙ settings.

**Not used:** Vercel. Nothing BEBO-related is deployed there — GoatCounter covers this instead (a Vercel-hosted counter would have needed manual dashboard provisioning and would have miscounted unique installs).

---

## 🐙 GitHub — code, releases, CI

| What | Link |
|---|---|
| Repo home | https://github.com/bhavik8025/BEBO-the-PET |
| Actions / CI build runs | https://github.com/bhavik8025/BEBO-the-PET/actions |
| Repo traffic (views & clones, rolling 14 days) | https://github.com/bhavik8025/BEBO-the-PET/graphs/traffic |
| Pages deployment history | https://github.com/bhavik8025/BEBO-the-PET/deployments |

---

## 🌐 Website pages

| Page | Link |
|---|---|
| Home | https://bhavik8025.github.io/BEBO-the-PET/ |
| Download | https://bhavik8025.github.io/BEBO-the-PET/download.html |
| How It Works | https://bhavik8025.github.io/BEBO-the-PET/how-it-works.html |
| Compare vs browser AI | https://bhavik8025.github.io/BEBO-the-PET/compare.html |
| FAQ | https://bhavik8025.github.io/BEBO-the-PET/faq.html |

---

## 🔍 SEO / Trust building

| What | Link | Status |
|---|---|---|
| Google Search Console | https://search.google.com/search-console | ⬜ Pending — verify file already on site, just submit sitemap |
| Sitemap to submit | https://bhavik8025.github.io/BEBO-the-PET/sitemap.xml | ✅ Already live |
| SignPath (free code-signing for OSS) | https://signpath.org | ⬜ Pending — all local prereqs done (LICENSE, CI build, package.json), needs your application |

---

## 📱 QR Codes (for presentations)

Both saved in [`assets/qr/`](assets/qr/) — both point to the evergreen `releases/latest` link above, and are decode-verified (scanned back with an independent QR reader to confirm they resolve to the exact URL).

| File | Use case |
|---|---|
| [`assets/qr/bebo-qr-card.png`](assets/qr/bebo-qr-card.png) | Branded slide-ready card — title, BEBO logo, caption, backup URL text. Drop directly into a presentation. |
| [`assets/qr/bebo-qr-plain.png`](assets/qr/bebo-qr-plain.png) | Plain black-on-white, no logo — use when space is tight or for max scan reliability. |

---

## ⬜ Action items still open

1. **Sign up for GoatCounter** (2 min) — account name `bebothepet`, then visitor/install data starts flowing
2. **Post the LinkedIn carousel** — `assets/carousel/BEBO-LinkedIn-Carousel.pdf`
3. **Submit sitemap in Search Console**
4. **Apply to SignPath** for free code signing
5. **Aug 16, 2026** — remove v1.0.0's EXE assets once Groq retires the Llama model it depends on
