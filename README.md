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

## Upsell ideas (paid extras)

- Admin panel so staff can update notices without editing `config.js` (e.g. Decap CMS on Netlify, or a Google Sheet as the data source)
- Real online tax payment through a payment gateway
- English version (add a second config and a language switch)
- Visitor counter, Google Analytics, yearly maintenance plan
