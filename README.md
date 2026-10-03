# Gram Panchayat Website Template

One codebase, one config file per panchayat. All content, colours and menu order live in `config.js`. You don't edit the HTML, CSS or JS for a new client.

## Folder layout

```
index.html          page shell (don't edit)
assets/style.css    design (don't edit unless rebranding the template)
assets/app.js       renders everything from config.js (don't edit)
config.js           ← the ONLY file that changes per panchayat
configs/demo.js     complete sample with every field filled
configs/arjuni.js   starter config for Arjuni (verified facts only, TODOs marked)
images/             put logo, hero photo, leader photos, gallery photos here
files/              PDFs uploaded from the admin panel (created on first upload)
admin/              password-protected admin panel (open /admin/ on the live site)
```

## Launch a new panchayat (about 30 minutes once you have their data)

1. Copy the whole folder, e.g. `gp-sundarwadi/`.
2. Copy `configs/demo.js` to `config.js` and replace the content.
3. Put photos in `images/` and reference them, e.g. `photo: "images/sarpanch.jpg"`.
4. Set `site.demo` to `false`.
5. Upload the folder to any hosting: cPanel `public_html`, Netlify, Cloudflare Pages, GitHub Pages. No database or PHP is needed.

Opening `index.html` directly from your computer also works, which is handy for showing a client offline.

## What you can configure

| Key | What it controls |
|---|---|
| `site` | Name, village, taluka, district, LGD code, logo, tagline, demo banner |
| `theme.brand` / `theme.accent` | Two colours. Everything else (dark mode, tints) is derived. |
| `theme.numerals` | `"devanagari"` (१२३) or `"latin"` (123) |
| `contact` | Phone, WhatsApp, email, address, office hours, map link or Google Maps embed URL |
| `hero` | Welcome text, background photo, buttons |
| `gramSabha` | Next Gram Sabha date, time and venue (shown in header and hero) |
| `announcements` | Scrolling notice ticker. `isNew: true` adds a "नवीन" badge. |
| `leaders`, `message` | Sarpanch / Upsarpanch / Officer cards and Sarpanch's message |
| `stats` | Population, households, wards, literacy etc. |
| `about` | History, vision, goals, facilities |
| `services` | Certificates and services with time, fee, documents, online link |
| `schemes` | Grouped automatically into tabs by `category` |
| `works` | Development works; `status`: `done`, `ongoing`, `approved`; `progress` 0–100 |
| `budget` | Income and expense heads; bars are drawn to one scale |
| `documents` | Notices, tenders, minutes, RTI; searchable; `file` = PDF path or link |
| `committees`, `wardMembers` | Committees and ward-wise elected members |
| `gallery` | Photos with captions and categories (filter tabs appear automatically) |
| `grievance` | `mode`: `whatsapp`, `email`, or `link` (Google Form) + escalation ladder |
| `links`, `social`, `footer` | Footer links and credit line |
| `sections` | Menu order and labels. Remove a line to hide a section. |

Any section whose data is empty (`[]` or `null`) is hidden automatically, along with its menu item.

## Built in

- Mobile-first layout, sticky menu, mobile drawer menu
- Automatic dark mode
- Font-size buttons (अ- / अ / अ+) for older citizens
- Skip link, keyboard focus states, reduced-motion support
- Indian number formatting with lakh/crore (₹१८.५ लाख)
- No backend: the complaint form opens WhatsApp or email with the message pre-filled

## Admin panel (`/admin/`)

Staff can edit everything in `config.js` from a password-protected page at `https://<your-site>/admin/`, with no coding: notices, works, budget, photos, PDFs, leaders, menu order, colours and so on. Clicking **जतन करा** (Save) commits the new `config.js` to GitHub, and GitHub Pages, Netlify or Cloudflare Pages republishes the site within a minute or two. Photos are resized in the browser before upload. **पूर्वावलोकन** (Preview) shows unsaved changes first.

**How the password protects it.** There is no server. The panel saves through the GitHub API using a fine-grained access token, and that token is stored only in `admin/auth.json`, encrypted with the admin password (PBKDF2-SHA256 with 600,000 iterations, then AES-256-GCM). Without the password the token can't be decrypted, so nothing can be changed. The panel also locks itself after 30 minutes of inactivity. Use a long password (at least 10 characters is enforced; 14+ is better), because `auth.json` is public and a weak password could be guessed offline.

### One-time setup (developer)

1. Deploy the site from the GitHub repo (GitHub Pages: Settings → Pages → Deploy from branch `main` / root).
2. Create a token at GitHub → Settings → Developer settings → [Fine-grained tokens](https://github.com/settings/personal-access-tokens/new):
   - Repository access: **Only select repositories** → this repo
   - Permissions: **Contents → Read and write** (nothing else)
   - Expiration: up to 1 year (set a reminder to renew)
3. Open `https://<your-site>/admin/`. The first visit shows the setup form. Enter the repo owner, repo name, branch, token and the admin password you'll give the panchayat staff.
4. Setup commits `admin/auth.json`. Give the staff the `/admin/` link and the password.

**Forgot the password?** Click "पासवर्ड विसरलात?" on the login screen and run setup again with a token. Only someone with write access to the repo can do this.
**Token expired?** Log in, then go to सेटिंग्ज (Settings) → GitHub ॲक्सेस की बदला.
**Change the password** under सेटिंग्ज (Settings). The new password applies everywhere.

Notes:
- Saving from the admin panel rewrites `config.js` in a clean format, so hand-written comments in it are dropped. The data itself is kept exactly.
- If two people edit at once, the second save warns before overwriting.
- Unsaved edits are kept in that browser, so a closed tab or auto-lock doesn't lose work.
- Every save is a Git commit, so the full history (and undo) is available on GitHub.
## Upsell ideas (paid extras)

- Real online tax payment through a payment gateway
- English version (add a second config and a language switch)
- Visitor counter, Google Analytics, yearly maintenance plan
