/*
 * ग्रामपंचायत संकेतस्थळ टेम्पलेट — रेंडर इंजिन
 * सर्व माहिती window.GP_CONFIG (config.js) मधून येते. या फाइलमध्ये बदल करण्याची गरज नाही.
 */
(function () {
  "use strict";
  var C = window.GP_CONFIG;
  var app = document.getElementById("app");
  if (!C) { app.innerHTML = '<p style="padding:24px">config.js सापडली नाही. index.html शेजारी config.js ठेवा.</p>'; return; }

  /* ---------------- helpers ---------------- */
  var DEV = "०१२३४५६७८९";
  var useDev = (C.theme && C.theme.numerals) !== "latin";
  function digits(s) { s = String(s); return useDev ? s.replace(/[0-9]/g, function (d) { return DEV[d]; }) : s; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function num(n) { return digits(Number(n).toLocaleString("en-IN")); }
  function money(n) {
    n = Number(n) || 0;
    if (n >= 1e7) return "₹" + digits(+(n / 1e7).toFixed(2)) + " कोटी";
    if (n >= 1e5) return "₹" + digits(+(n / 1e5).toFixed(2)) + " लाख";
    return "₹" + num(n);
  }
  var MONTHS = ["जानेवारी", "फेब्रुवारी", "मार्च", "एप्रिल", "मे", "जून", "जुलै", "ऑगस्ट", "सप्टेंबर", "ऑक्टोबर", "नोव्हेंबर", "डिसेंबर"];
  function parseDate(s) { var p = String(s || "").split("-"); return p.length === 3 ? { y: +p[0], m: +p[1] - 1, d: +p[2] } : null; }
  function dateLong(s) { var d = parseDate(s); return d ? digits(d.d) + " " + MONTHS[d.m] + " " + digits(d.y) : esc(s); }
  function dateShort(s) { var d = parseDate(s); return d ? digits(String(d.d).padStart(2, "0") + "/" + String(d.m + 1).padStart(2, "0") + "/" + d.y) : esc(s); }
  function initials(name) {
    var clean = String(name || "").replace(/^(श्री|सौ|श्रीमती|कु|डॉ)\.?\s*/, "").trim();
    var m = clean.match(/^[ऀ-ॿ][ऀ-ःऺ-ॏ॑-ॗ]*/);
    return m ? m[0] : (clean[0] || "?").toUpperCase();
  }
  function has(a) { return Array.isArray(a) ? a.length > 0 : !!a; }
  function ext(href) { return /^https?:/i.test(href || "") ? ' target="_blank" rel="noopener"' : ""; }

  var ICONS = {
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    home: '<path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    up: '<path d="m18 15-6-6-6 6"/>',
    landmark: '<path d="M3 22h18M6 18v-7M10 18v-7M14 18v-7M18 18v-7M12 2l8 5H4z"/>',
    building: '<rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>',
    droplet: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5S12.5 5.5 12 3c-.5 2.5-2 4.9-4 6.5S5 13 5 15a7 7 0 0 0 7 7z"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
    heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/>',
    rupee: '<path d="M6 3h12M6 8h12M6 13l8.5 8M6 13h3M9 13c6.7 0 6.7-10 0-10"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
    megaphone: '<path d="m3 11 18-5v12L3 14v-3zM11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    external: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
    leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z"/><path d="M2 21c0-3 1.9-5.4 5.1-6"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
    road: '<path d="M4 22 9 2M20 22 15 2M12 6v2M12 12v2M12 18v2"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'
  };
  function ic(name, cls) { return '<svg class="icon ' + (cls || "") + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || ICONS.file) + "</svg>"; }

  /* ---------------- theme ---------------- */
  var root = document.documentElement;
  if (C.theme && C.theme.brand) root.style.setProperty("--brand", C.theme.brand);
  if (C.theme && C.theme.accent) root.style.setProperty("--accent", C.theme.accent);
  var S = C.site || {}, K = C.contact || {};
  document.title = S.name + (S.taluka ? " — ता. " + S.taluka : "");
  root.lang = "mr";

  /* ---------------- section registry ---------------- */
  var available = {
    about: has(C.about) || has(C.leaders),
    services: has(C.services),
    schemes: has(C.schemes),
    works: has(C.works),
    budget: C.budget && (has(C.budget.income) || has(C.budget.expense)),
    documents: has(C.documents),
    committees: has(C.committees) || has(C.wardMembers),
    gallery: has(C.gallery),
    grievance: !!C.grievance,
    contact: true
  };
  var sections = (C.sections || []).filter(function (s) { return available[s.id]; });

  /* ---------------- pages ----------------
   * One HTML file per tab (about.html, services.html, …) sets <body data-page="…">;
   * index.html is the home page. In-page anchors such as "#services" (used in
   * config.js for buttons and announcements) are turned into page links here. */
  var PAGE = document.body.getAttribute("data-page") || "home";
  var PAGE_IDS = ["about", "services", "schemes", "works", "budget", "documents", "committees", "gallery", "grievance", "contact"];
  function go(href) {
    href = String(href || "");
    if (href === "#top" || href === "#") return "index.html";
    var id = href.charAt(0) === "#" ? href.slice(1) : "";
    return PAGE_IDS.indexOf(id) >= 0 ? id + ".html" : href;
  }
  function here(id) { return id === PAGE ? ' class="active" aria-current="page"' : ""; }
  function label(id, fallback) { var s = (C.sections || []).find(function (x) { return x.id === id; }); return s ? s.label : fallback; }

  /* ---------------- renderers ---------------- */
  function head(eyebrow, title, desc, right) {
    return '<div class="sec-head"><div><div class="eyebrow">' + esc(eyebrow) + "</div><h2>" + esc(title) + "</h2>" + (desc ? '<p class="muted">' + esc(desc) + "</p>" : "") + "</div>" + (right || "") + "</div>";
  }

  function rTop() {
    var place = [S.village, S.taluka && "ता. " + S.taluka, S.district && "जि. " + S.district].filter(Boolean).join(", ");
    var gs = C.gramSabha && C.gramSabha.date;
    var seal = S.logo ? '<img src="' + esc(S.logo) + '" alt="">' : esc(initials(S.village || S.name));
    var h = '<a class="skip" href="#main">मुख्य मजकुराकडे जा</a><div class="tricolour"></div>';
    if (S.demo) h += '<div class="demo-strip">हे नमुना संकेतस्थळ आहे — यातील सर्व नावे व आकडेवारी काल्पनिक आहेत</div>';
    h += '<div class="utility"><div class="wrap"><div class="info">' +
      "<span>" + esc(S.state ? S.state + " शासन" : "") + "</span>" +
      (K.phone ? "<span>" + ic("phone") + '<span class="num">' + esc(digits(K.phone)) + "</span></span>" : "") +
      (K.officeHours ? "<span>" + ic("clock") + esc(K.officeHours) + "</span>" : "") +
      '</div><div class="tools" role="group" aria-label="अक्षराचा आकार"><button type="button" id="fs-down" aria-label="अक्षरे लहान करा">अ-</button><button type="button" id="fs-reset" aria-label="मूळ आकार">अ</button><button type="button" id="fs-up" aria-label="अक्षरे मोठी करा">अ+</button></div></div></div>';
    h += '<header class="masthead"><div class="wrap"><div class="seal" aria-hidden="true">' + seal + '</div><div class="titles">' +
      '<div class="eyebrow">' + esc(S.state || "") + (S.lgdCode ? ' · LGD <span class="num">' + esc(digits(S.lgdCode)) + "</span>" : "") + "</div>" +
      "<h1>" + esc(S.name) + "</h1>" + (place ? '<div class="sub">' + esc(place) + "</div>" : "") + "</div>" +
      '<div class="right">' + (gs ? '<div class="gs">पुढील ग्रामसभा<b>' + dateLong(C.gramSabha.date) + "</b>" + esc(C.gramSabha.time || "") + "</div>" : "") +
      '<button class="menu-btn" type="button" id="menu-open" aria-label="मेनू उघडा" aria-controls="site-nav" aria-expanded="false">' + ic("menu") + "</button></div></div></header>";
    h += '<nav class="nav" id="site-nav" aria-label="मुख्य मेनू"><button class="close" type="button" id="menu-close" aria-label="मेनू बंद करा">' + ic("x") + '</button><div class="wrap"><ul>' +
      '<li><a href="index.html"' + here("home") + ">मुख्यपृष्ठ</a></li>" +
      sections.map(function (s) { return '<li><a href="' + go("#" + s.id) + '"' + here(s.id) + ">" + esc(s.label) + "</a></li>"; }).join("") + "</ul></div></nav>";
    if (has(C.announcements)) {
      var items = C.announcements.map(function (a) { return '<a href="' + esc(go(a.href || "#documents")) + '"' + ext(a.href) + ">" + esc(a.text) + (a.isNew ? '<span class="new">नवीन</span>' : "") + "</a>"; }).join("");
      h += '<div class="ticker" aria-label="ताज्या घोषणा"><div class="wrap"><div class="tag">' + ic("megaphone") + 'घोषणा</div><div class="track"><div class="items">' + items + '<span aria-hidden="true" style="display:contents">' + items.replace(/<a /g, '<a tabindex="-1" ') + "</span></div></div></div></div>";
    }
    return h;
  }

  function rHero() {
    var H = C.hero || {};
    var facts = [];
    var findStat = function (k) { return (C.stats || []).find(function (s) { return s.label === k; }); };
    if (findStat("लोकसंख्या")) facts.push(["लोकसंख्या", num(findStat("लोकसंख्या").value)]);
    if (findStat("प्रभाग")) facts.push(["प्रभाग", num(findStat("प्रभाग").value)]);
    if (S.established) facts.push(["स्थापना", digits(S.established)]);
    if (S.taluka) facts.push(["तालुका", esc(S.taluka)]);
    if (S.district) facts.push(["जिल्हा", esc(S.district)]);
    var gs = C.gramSabha && C.gramSabha.date ? parseDate(C.gramSabha.date) : null;
    var side = (facts.length || gs) ? '<aside class="factsheet"><h3>गाव एका नजरेत</h3><dl>' + facts.map(function (f) { return "<dt>" + f[0] + '</dt><dd class="num">' + f[1] + "</dd>"; }).join("") + "</dl>" +
      (gs ? '<div class="gs-row"><div class="gs-date num">' + digits(gs.d) + "<small>" + MONTHS[gs.m] + "</small></div><div><b>पुढील ग्रामसभा</b><br>" + esc([C.gramSabha.time, C.gramSabha.venue].filter(Boolean).join(", ")) + "</div></div>" : "") + "</aside>" : "";
    return '<section class="hero' + (H.image ? " has-img" : "") + '" id="top">' + (H.image ? '<img class="bgimg" src="' + esc(H.image) + '" alt="">' : "") +
      '<div class="wrap"><div><div class="kicker">' + esc(H.welcome || "आपले स्वागत आहे") + "</div><h2>" + esc(S.name) + "</h2>" +
      (S.tagline ? '<p style="font-family:var(--font-display);font-size:1.3rem;color:#fff;margin-bottom:10px">' + esc(S.tagline) + "</p>" : "") +
      (H.text ? "<p>" + esc(H.text) + "</p>" : "") +
      '<div class="actions">' + (H.buttons || []).map(function (b, i) { return '<a class="btn ' + (i === 0 ? "btn-accent" : "btn-ghost") + '" href="' + esc(go(b.href)) + '"' + ext(b.href) + ">" + esc(b.label) + "</a>"; }).join("") + "</div></div>" + side + "</div></section>";
  }

  function rAbout(tint) {
    var A = C.about || {};
    var h = '<section class="block' + tint + '" id="about"><div class="wrap">' + head("ग्रामपंचायत", label("about", "आमच्याबद्दल"));
    if (has(C.leaders)) {
      h += '<div class="leaders">' + C.leaders.map(function (l) {
        return '<div class="card leader"><div class="avatar">' + (l.photo ? '<img src="' + esc(l.photo) + '" alt="' + esc(l.name) + '">' : esc(initials(l.name))) + '</div><div><div class="role">' + esc(l.role) + '</div><div class="name">' + esc(l.name) + "</div>" + (l.phone ? '<div class="muted num">' + esc(digits(l.phone)) + "</div>" : "") + "</div></div>";
      }).join("") + "</div>";
    }
    if (C.message && C.message.text) h += '<div class="message"><blockquote>' + esc(C.message.text) + "</blockquote><cite>— " + esc(C.message.from) + ", " + esc(C.message.role) + "</cite></div>";
    if (has(C.stats)) h += '<div class="stats">' + C.stats.map(function (s) { return '<div class="stat">' + ic(s.icon || "grid") + '<div class="v">' + num(s.value) + esc(s.suffix || "") + '</div><div class="l">' + esc(s.label) + "</div></div>"; }).join("") + "</div>";
    if (has(A.history) || A.vision || has(A.facilities)) {
      h += '<div class="about-grid" style="margin-top:40px"><div class="prose">' + (has(A.history) ? '<h3 class="subhead" style="margin:0">इतिहास</h3>' + A.history.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") : "") +
        (A.vision ? '<h3 class="subhead" style="margin:12px 0 0">दृष्टी</h3><p class="vision">' + esc(A.vision) + "</p>" : "") + "</div><div style=\"display:grid;gap:24px;align-content:start\">" +
        (has(A.goals) ? '<div class="card"><h3 style="font-family:var(--font-body);font-weight:600;font-size:1.05rem;margin-bottom:10px">उद्दिष्टे</h3><ul class="checklist">' + A.goals.map(function (g) { return "<li>" + ic("check") + "<span>" + esc(g) + "</span></li>"; }).join("") + "</ul></div>" : "") +
        (has(A.facilities) ? '<div><h3 style="font-family:var(--font-body);font-weight:600;font-size:1.05rem;margin-bottom:10px">गावातील सुविधा</h3><div class="chips">' + A.facilities.map(function (f) { return '<span class="chip">' + esc(f) + "</span>"; }).join("") + "</div></div>" : "") + "</div></div>";
    }
    return h + "</div></section>";
  }

  function rServices(tint) {
    return '<section class="block' + tint + '" id="services"><div class="wrap">' + head("ऑनलाइन व कार्यालयीन", label("services", "नागरिक सेवा"), "लागणारी कागदपत्रे, शुल्क आणि कालावधी पाहून अर्ज करा.") +
      '<div class="grid cols-3">' + C.services.map(function (s) {
        return '<article class="card service"><div class="top"><div class="ibox">' + ic(s.icon || "file") + "</div><h3>" + esc(s.title) + '</h3></div><div class="meta">' +
          (s.time ? "<span>कालावधी: <b>" + esc(s.time) + "</b></span>" : "") + (s.fee ? "<span>शुल्क: <b>" + esc(s.fee) + "</b></span>" : "") + "</div>" +
          (has(s.docs) ? '<details class="docs"><summary>आवश्यक कागदपत्रे (' + digits(s.docs.length) + ")</summary><ul>" + s.docs.map(function (d) { return "<li>" + esc(d) + "</li>"; }).join("") + "</ul></details>" : "") +
          (s.href ? '<a class="btn btn-line" style="justify-self:start" href="' + esc(s.href) + '"' + ext(s.href) + ">ऑनलाइन अर्ज " + ic("external") + "</a>" : '<span class="muted" style="font-size:var(--step--1)">ग्रामपंचायत कार्यालयात अर्ज करा</span>') +
          "</article>";
      }).join("") + "</div></div></section>";
  }

  function rSchemes(tint) {
    var cats = [];
    C.schemes.forEach(function (s) { if (cats.indexOf(s.category) < 0) cats.push(s.category); });
    var tabs = '<div class="tabs" role="tablist" aria-label="योजना प्रकार"><button class="tab" role="tab" aria-selected="true" data-cat="*">सर्व<span class="count num">' + digits(C.schemes.length) + "</span></button>" +
      cats.map(function (c) { return '<button class="tab" role="tab" aria-selected="false" data-cat="' + esc(c) + '">' + esc(c) + '<span class="count num">' + digits(C.schemes.filter(function (s) { return s.category === c; }).length) + "</span></button>"; }).join("") + "</div>";
    return '<section class="block' + tint + '" id="schemes"><div class="wrap">' + head("लाभार्थ्यांसाठी", label("schemes", "शासकीय योजना"), "केंद्र, राज्य आणि जिल्हा स्तरावरील योजना. पात्रतेसाठी ग्रामपंचायत कार्यालयाशी संपर्क साधा.") + tabs +
      '<div class="grid cols-3" id="scheme-grid">' + C.schemes.map(function (s) {
        return '<article class="card scheme" data-cat="' + esc(s.category) + '"><div class="cat">' + esc(s.category) + "</div><h3>" + esc(s.name) + '</h3><p class="muted">' + esc(s.desc) + "</p>" +
          (s.benefit ? '<span class="benefit">' + esc(s.benefit) + "</span>" : "") + (s.href ? '<a class="more" href="' + esc(s.href) + '"' + ext(s.href) + ">अधिकृत संकेतस्थळ " + ic("external") + "</a>" : "") + "</article>";
      }).join("") + "</div></div></section>";
  }

  var STATUS = { done: ["पूर्ण", "ok"], ongoing: ["प्रगतीपथावर", "warn"], approved: ["मंजूर", "info"] };
  function rWorks(tint) {
    var total = C.works.reduce(function (a, w) { return a + (Number(w.cost) || 0); }, 0);
    var counts = {}; C.works.forEach(function (w) { counts[w.status] = (counts[w.status] || 0) + 1; });
    var filters = '<div class="tabs" aria-label="कामाची स्थिती"><button class="tab on" data-st="*" aria-pressed="true">सर्व<span class="count num">' + digits(C.works.length) + "</span></button>" +
      Object.keys(STATUS).filter(function (k) { return counts[k]; }).map(function (k) { return '<button class="tab" data-st="' + k + '" aria-pressed="false">' + STATUS[k][0] + '<span class="count num">' + digits(counts[k]) + "</span></button>"; }).join("") + "</div>";
    return '<section class="block' + tint + '" id="works"><div class="wrap">' + head("पारदर्शकता", label("works", "विकासकामे"), "मंजूर, सुरू आणि पूर्ण झालेली कामे — निधीचा स्रोत आणि खर्चासह.") +
      '<div class="works-sum"><span>एकूण कामे: <b class="num">' + digits(C.works.length) + '</b></span><span>एकूण मंजूर निधी: <b class="num">' + money(total) + "</b></span></div>" + filters +
      '<div class="table-wrap"><table><thead><tr><th>काम</th><th>प्रभाग</th><th>निधी स्रोत</th><th>वर्ष</th><th class="r">रक्कम</th><th>स्थिती</th></tr></thead><tbody id="works-body">' +
      C.works.map(function (w) {
        var st = STATUS[w.status] || [w.status, "plain"];
        return '<tr data-st="' + esc(w.status) + '"><td><b style="font-weight:600">' + esc(w.title) + "</b>" + (w.status === "ongoing" ? '<div class="bar" role="progressbar" aria-valuenow="' + (w.progress || 0) + '" aria-valuemin="0" aria-valuemax="100"><i style="width:' + (w.progress || 0) + '%"></i></div><small class="muted num">' + digits(w.progress || 0) + "% पूर्ण</small>" : "") +
          '</td><td class="num">' + esc(digits(w.ward)) + "</td><td>" + esc(w.fund) + '</td><td class="num">' + esc(digits(w.year)) + '</td><td class="r num">' + money(w.cost) + '</td><td><span class="pill ' + st[1] + '">' + esc(st[0]) + "</span></td></tr>";
      }).join("") + "</tbody></table></div></div></section>";
  }

  function rBudget(tint) {
    var B = C.budget;
    var all = (B.income || []).concat(B.expense || []);
    var max = Math.max.apply(null, all.map(function (x) { return x.amount; }));
    function col(title, rows, cls) {
      var tot = rows.reduce(function (a, r) { return a + r.amount; }, 0);
      return '<div class="card ' + cls + '"><h3><span>' + title + '</span><span class="tot">' + money(tot) + "</span></h3>" + rows.map(function (r) {
        return '<div class="brow"><span>' + esc(r.label) + '</span><span class="amt">' + money(r.amount) + '</span><div class="track"><i style="width:' + (r.amount / max * 100).toFixed(1) + '%"></i></div></div>';
      }).join("") + "</div>";
    }
    var inc = (B.income || []).reduce(function (a, r) { return a + r.amount; }, 0), exp = (B.expense || []).reduce(function (a, r) { return a + r.amount; }, 0);
    return '<section class="block' + tint + '" id="budget"><div class="wrap">' + head("आर्थिक वर्ष " + digits(B.year || ""), label("budget", "अर्थसंकल्प"), "ग्रामपंचायतीचे अंदाजित उत्पन्न आणि खर्च. सर्व पट्ट्या एकाच प्रमाणात काढल्या आहेत.") +
      '<div class="budget">' + col("अंदाजित उत्पन्न", B.income || [], "inc") + col("अंदाजित खर्च", B.expense || [], "exp") + "</div>" +
      '<div class="balance"><span>शिल्लक (उत्पन्न − खर्च)</span><b class="num">' + money(inc - exp) + "</b></div></div></section>";
  }

  function rDocuments(tint) {
    var types = []; C.documents.forEach(function (d) { if (d.type && types.indexOf(d.type) < 0) types.push(d.type); });
    var docs = C.documents.slice().sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
    return '<section class="block' + tint + '" id="documents"><div class="wrap">' + head("जाहीर सूचना", label("documents", "सूचना व दस्तऐवज"), "ग्रामसभा इतिवृत्त, निविदा, लाभार्थी याद्या आणि माहिती अधिकारांतर्गत माहिती.") +
      '<div class="doc-tools"><label class="search" for="doc-q">' + ic("search") + '<input id="doc-q" type="search" placeholder="शोधा — उदा. निविदा, यादी"></label>' +
      '<select id="doc-type" class="btn-line" style="padding:9px 12px;border:1px solid var(--line);border-radius:8px;background:var(--surface)" aria-label="प्रकार"><option value="">सर्व प्रकार</option>' + types.map(function (t) { return "<option>" + esc(t) + "</option>"; }).join("") + "</select></div>" +
      '<ul class="doclist" id="doc-list">' + docs.map(function (d) {
        return '<li data-type="' + esc(d.type) + '" data-q="' + esc((d.title + " " + d.type).toLowerCase()) + '"><span class="d">' + dateShort(d.date) + '</span><span class="t">' + esc(d.title) + (d.type ? '<span class="pill plain">' + esc(d.type) + "</span>" : "") + "</span>" +
          (d.file ? '<a class="dl" href="' + esc(d.file) + '"' + ext(d.file) + ">" + ic("download") + "डाउनलोड</a>" : '<span class="dl off">कार्यालयात उपलब्ध</span>') + "</li>";
      }).join("") + '</ul><p class="empty" id="doc-empty" hidden>या शोधाशी जुळणारा दस्तऐवज नाही. दुसरा शब्द वापरून पाहा.</p></div></section>';
  }

  function rCommittees(tint) {
    var h = '<section class="block' + tint + '" id="committees"><div class="wrap">' + head("लोकप्रतिनिधी", label("committees", "समित्या व सदस्य"));
    if (has(C.committees)) h += '<div class="grid cols-4">' + C.committees.map(function (c) { return '<div class="card committee"><h3>' + esc(c.name) + "</h3><ul>" + (c.members || []).map(function (m) { return "<li>" + esc(m) + "</li>"; }).join("") + "</ul></div>"; }).join("") + "</div>";
    if (has(C.wardMembers)) h += '<h3 class="subhead">प्रभागनिहाय सदस्य</h3><div class="table-wrap"><table style="min-width:480px"><thead><tr><th>प्रभाग</th><th>सदस्याचे नाव</th><th>आरक्षण</th></tr></thead><tbody>' +
      C.wardMembers.map(function (m) { return '<tr><td class="num">' + esc(digits(m.ward)) + "</td><td>" + esc(m.name) + '</td><td class="muted">' + esc(m.category || "") + "</td></tr>"; }).join("") + "</tbody></table></div>";
    return h + "</div></section>";
  }

  function rGallery(tint) {
    var cats = []; C.gallery.forEach(function (g) { if (g.category && cats.indexOf(g.category) < 0) cats.push(g.category); });
    var tabs = cats.length > 1 ? '<div class="tabs"><button class="tab on" data-g="*" aria-pressed="true">सर्व</button>' + cats.map(function (c) { return '<button class="tab" data-g="' + esc(c) + '" aria-pressed="false">' + esc(c) + "</button>"; }).join("") + "</div>" : "";
    return '<section class="block' + tint + '" id="gallery"><div class="wrap">' + head("क्षणचित्रे", label("gallery", "छायाचित्रे")) + tabs +
      '<div class="gallery" id="gal">' + C.gallery.map(function (g, i) {
        return '<button type="button" class="gitem" data-i="' + i + '" data-g="' + esc(g.category || "") + '" aria-label="' + esc(g.caption) + ' — मोठे पाहा">' +
          (g.src ? '<img loading="lazy" src="' + esc(g.src) + '" alt="' + esc(g.caption) + '">' : '<span class="ph">' + ic("image") + "</span>") + "<figcaption>" + esc(g.caption) + "</figcaption></button>";
      }).join("") + '</div></div></section><dialog class="lightbox" id="lb" aria-label="छायाचित्र"><div class="frame"><div class="stage" id="lb-stage"></div><div class="bar2"><span id="lb-cap"></span><div><button class="ibtn" type="button" id="lb-prev" aria-label="मागील">' + ic("left") + '</button><button class="ibtn" type="button" id="lb-next" aria-label="पुढील">' + ic("right") + '</button><button class="ibtn" type="button" id="lb-close" aria-label="बंद करा">' + ic("x") + "</button></div></div></div></dialog>";
  }

  function rGrievance(tint) {
    var G = C.grievance;
    var wards = (C.stats || []).find(function (s) { return s.label === "प्रभाग"; });
    var nW = wards ? wards.value : 0;
    var formHtml = G.mode === "link" && G.formUrl
      ? '<div class="card" style="display:grid;gap:12px"><p>तक्रार नोंदवण्यासाठी खालील ऑनलाइन अर्ज भरा. तक्रार क्रमांक तुमच्या मोबाईलवर कळवला जाईल.</p><a class="btn btn-brand" style="justify-self:start" href="' + esc(G.formUrl) + '" target="_blank" rel="noopener">तक्रार अर्ज उघडा ' + ic("external") + "</a></div>"
      : '<form class="card form" id="gform" novalidate><div class="row2"><div class="field"><label for="g-name">पूर्ण नाव</label><input id="g-name" required autocomplete="name"><span class="err" hidden>नाव लिहा</span></div>' +
        '<div class="field"><label for="g-mob">मोबाईल क्रमांक</label><input id="g-mob" inputmode="numeric" maxlength="10" required autocomplete="tel"><span class="err" hidden>१० अंकी मोबाईल क्रमांक लिहा</span></div></div>' +
        '<div class="row2"><div class="field"><label for="g-ward">प्रभाग</label><select id="g-ward"><option value="">निवडा</option>' + Array.from({ length: nW }, function (_, i) { return "<option>" + digits(i + 1) + "</option>"; }).join("") + '</select></div>' +
        '<div class="field"><label for="g-cat">तक्रारीचा प्रकार</label><select id="g-cat">' + (G.categories || []).map(function (c) { return "<option>" + esc(c) + "</option>"; }).join("") + "</select></div></div>" +
        '<div class="field"><label for="g-text">तक्रारीचा तपशील</label><textarea id="g-text" rows="4" required placeholder="ठिकाण, कधीपासून समस्या आहे, इत्यादी"></textarea><span class="err" hidden>तक्रारीचा तपशील लिहा</span></div>' +
        '<button class="btn btn-brand" type="submit" style="justify-self:start">' + ic("message") + (G.mode === "email" ? "ई-मेलने तक्रार पाठवा" : "WhatsApp वर तक्रार पाठवा") + '</button><div id="g-result" hidden></div></form>';
    return '<section class="block' + tint + '" id="grievance"><div class="wrap">' + head("तक्रार निवारण", label("grievance", "तक्रार नोंदवा"), "पाणी, रस्ते, पथदिवे, स्वच्छता किंवा दाखल्यांबाबत तक्रार थेट ग्रामपंचायतीकडे पाठवा.") +
      '<div class="griev">' + formHtml + (has(G.escalation) ? '<div class="card"><h3 style="font-family:var(--font-body);font-weight:600;font-size:1.05rem;margin-bottom:6px">तक्रार निवारणाचे टप्पे</h3><p class="muted" style="font-size:var(--step--1);margin-bottom:6px">दिलेल्या कालावधीत निवारण न झाल्यास तक्रार पुढील स्तरावर जाते.</p><ol class="ladder">' +
        G.escalation.map(function (e) { return '<li><span class="lv">' + esc(e.level) + "</span><span>" + esc(e.who) + '</span><span class="pill plain">' + esc(e.days) + "</span></li>"; }).join("") + "</ol></div>" : "") + "</div></div></section>";
  }

  function rContact(tint) {
    function row(icon, k, v, copy) { return v ? '<li><span class="ibox">' + ic(icon) + '</span><div><div class="k">' + k + '</div><div class="v">' + v + (copy ? ' <button class="copy" type="button" data-copy="' + esc(copy) + '">कॉपी</button>' : "") + "</div></div></li>" : ""; }
    var map = K.mapEmbed ? '<iframe src="' + esc(K.mapEmbed) + '" loading="lazy" title="नकाशा" referrerpolicy="no-referrer-when-downgrade"></iframe>'
      : '<div class="noembed"><div><span class="ibox" style="margin:0 auto 8px">' + ic("pin") + "</span><b>" + esc(S.name) + "</b><br><span class=\"muted\">" + esc(K.address || "") + "</span></div>" + (K.mapLink ? '<a class="btn btn-brand" href="' + esc(K.mapLink) + '" target="_blank" rel="noopener">नकाशावर पाहा ' + ic("external") + "</a>" : "") + "</div>";
    return '<section class="block' + tint + '" id="contact"><div class="wrap">' + head("कार्यालय", label("contact", "संपर्क")) + '<div class="contact-grid"><div class="card"><ul class="clist">' +
      row("pin", "पत्ता", esc(K.address)) +
      row("phone", "दूरध्वनी", K.phone ? '<a class="num" href="tel:' + esc(K.phone) + '">' + esc(digits(K.phone)) + "</a>" : "", K.phone) +
      row("phone", "मोबाईल", K.mobile ? '<a class="num" href="tel:' + esc(K.mobile) + '">' + esc(digits(K.mobile)) + "</a>" : "", K.mobile) +
      row("mail", "ई-मेल", K.email ? '<a href="mailto:' + esc(K.email) + '">' + esc(K.email) + "</a>" : "", K.email) +
      row("clock", "कार्यालयीन वेळ", esc(K.officeHours) + (K.holidays ? '<br><span class="muted">सुट्टी: ' + esc(K.holidays) + "</span>" : "")) +
      '</ul></div><div class="mapbox">' + map + "</div></div></div></section>";
  }

  function rFooter() {
    var soc = C.social || {};
    var socials = Object.keys(soc).filter(function (k) { return soc[k]; });
    var names = { facebook: "Facebook", youtube: "YouTube", instagram: "Instagram", x: "X" };
    return '<footer class="site"><div class="wrap"><div class="fgrid"><div><h4>' + esc(S.name) + '</h4><p style="font-size:var(--step--1)">' + esc(K.address || "") + "</p>" + (K.phone ? '<p class="num" style="margin-top:6px">' + esc(digits(K.phone)) + "</p>" : "") + "</div>" +
      '<div><h4>विभाग</h4><ul>' + sections.slice(0, 6).map(function (s) { return '<li><a href="' + go("#" + s.id) + '">' + esc(s.label) + "</a></li>"; }).join("") + "</ul></div>" +
      (has(C.links) ? "<div><h4>महत्त्वाचे दुवे</h4><ul>" + C.links.map(function (l) { return '<li><a href="' + esc(l.href) + '"' + ext(l.href) + ">" + esc(l.label) + " " + ic("external") + "</a></li>"; }).join("") + "</ul></div>" : "") +
      (socials.length ? "<div><h4>समाजमाध्यमे</h4><ul>" + socials.map(function (k) { return '<li><a href="' + esc(soc[k]) + '" target="_blank" rel="noopener">' + (names[k] || k) + "</a></li>"; }).join("") + "</ul></div>" : "") +
      '</div><div class="base"><span>© ' + digits(new Date().getFullYear()) + " " + esc(S.name) + (S.lastUpdated ? " · शेवटचे अद्यतन: " + dateLong(S.lastUpdated) : "") + "</span><span>" + esc((C.footer || {}).credit || "") + "</span></div></div></footer>" +
      '<button class="totop" type="button" id="totop" aria-label="वर जा" hidden>' + ic("up") + "</button>";
  }

  // quick-access tiles: one per visible section, app-style (icon, label, hint, arrow)
  var QUICK = {
    about: ["users", "पदाधिकारी व गावाची माहिती"], services: ["file", "दाखले, शुल्क व कागदपत्रे"], schemes: ["landmark", "केंद्र, राज्य व जिल्हा योजना"],
    works: ["road", "कामे, निधी व स्थिती"], budget: ["rupee", "उत्पन्न व खर्च"], documents: ["megaphone", "सूचना फलक व निविदा"],
    committees: ["grid", "समित्या व प्रभाग सदस्य"], gallery: ["image", "कार्यक्रम व कामांचे फोटो"], grievance: ["message", "तक्रार थेट पाठवा"], contact: ["phone", "पत्ता, फोन व वेळ"]
  };
  function rQuick() {
    var tiles = sections.filter(function (s) { return QUICK[s.id]; }).slice(0, 8);
    if (!tiles.length) return "";
    return '<section class="quick" aria-label="झटपट सेवा"><div class="wrap"><div class="qgrid">' + tiles.map(function (s) {
      return '<a class="qtile" href="' + go("#" + s.id) + '"><span class="qi">' + ic(QUICK[s.id][0]) + '</span><span class="qt"><b>' + esc(s.label) + "</b><small>" + esc(QUICK[s.id][1]) + '</small></span><span class="qa">' + ic("right") + "</span></a>";
    }).join("") + "</div></div></section>";
  }

  // emergency numbers (config: emergency: [{ label, number }])
  function rEmergency() {
    if (!has(C.emergency)) return "";
    return '<section class="sos" aria-label="आपत्कालीन संपर्क"><div class="wrap"><div class="sos-box"><div class="sos-head"><span class="sos-dot">SOS</span><div><b>आपत्कालीन संपर्क</b><small>एका क्लिकवर फोन लावा</small></div></div><div class="sos-list">' +
      C.emergency.map(function (e) { return '<a href="tel:' + esc(String(e.number).replace(/[^\d+]/g, "")) + '">' + ic("phone") + "<span>" + esc(e.label) + '</span><b class="num">' + esc(digits(e.number)) + "</b></a>"; }).join("") +
      "</div></div></div></section>";
  }

  // phone bottom tab bar: home + up to four key sections
  function rTabbar() {
    var picks = [["top", "home", "मुख्यपृष्ठ"]];
    [["services", "file", "सेवा"], ["documents", "megaphone", "सूचना"], ["grievance", "message", "तक्रार"], ["contact", "phone", "संपर्क"]].forEach(function (p) {
      if (sections.some(function (s) { return s.id === p[0]; })) picks.push(p);
    });
    return '<nav class="tabbar" aria-label="झटपट मेनू">' + picks.map(function (p) { return '<a href="' + go("#" + p[0]) + '"' + here(p[0] === "top" ? "home" : p[0]) + ">" + ic(p[1]) + "<span>" + p[2] + "</span></a>"; }).join("") + "</nav>";
  }

  /* ---------------- assemble ---------------- */
  var R = { about: rAbout, services: rServices, schemes: rSchemes, works: rWorks, budget: rBudget, documents: rDocuments, committees: rCommittees, gallery: rGallery, grievance: rGrievance, contact: rContact };
  // home: latest few notices, linking on to the documents page
  function rLatest() {
    if (!available.documents) return "";
    var docs = C.documents.slice().sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); }).slice(0, 4);
    return '<section class="block" id="latest"><div class="wrap">' + head("ताज्या घडामोडी", "नवीन सूचना", "", '<a class="btn btn-line" href="documents.html">सर्व सूचना ' + ic("right") + "</a>") +
      '<ul class="doclist">' + docs.map(function (d) {
        return '<li><span class="d">' + dateShort(d.date) + '</span><span class="t">' + esc(d.title) + (d.type ? '<span class="pill plain">' + esc(d.type) + "</span>" : "") + "</span>" +
          (d.file ? '<a class="dl" href="' + esc(d.file) + '"' + ext(d.file) + ">" + ic("download") + "डाउनलोड</a>" : '<a class="dl" href="documents.html">' + ic("right") + "पाहा</a>") + "</li>";
      }).join("") + "</ul></div></section>";
  }
  function rCrumbs(text) {
    return '<div class="crumbs"><div class="wrap"><a href="index.html">' + ic("home") + 'मुख्यपृष्ठ</a><span aria-hidden="true">›</span><span aria-current="page">' + esc(text) + "</span></div></div>";
  }
  var page;
  if (PAGE === "home") page = rHero() + rQuick() + rEmergency() + rLatest();
  else if (R[PAGE] && available[PAGE]) {
    page = rCrumbs(label(PAGE, PAGE)) + R[PAGE]("");
    document.title = label(PAGE, PAGE) + " — " + S.name;
  } else {
    page = rCrumbs("पान सापडले नाही") + '<section class="block"><div class="wrap"><div class="card" style="text-align:center;display:grid;gap:12px;justify-items:center"><h2>ही माहिती सध्या उपलब्ध नाही</h2><p class="muted">हा विभाग अजून भरलेला नाही. कृपया मुख्यपृष्ठावर परत जा.</p><a class="btn btn-accent" href="index.html">मुख्यपृष्ठ</a></div></div></section>';
  }
  var body = rTop() + '<main id="main">' + page + "</main>" + rFooter() + rTabbar();
  app.innerHTML = body;

  /* ---------------- behaviour ---------------- */
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  function toast(msg) { var t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); t.textContent = msg; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2200); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  // font size
  var scale = parseFloat(store("gp-fs")) || 1;
  function setFs(v) { scale = Math.min(1.3, Math.max(.9, v)); root.style.setProperty("--fs-scale", scale); store("gp-fs", String(scale)); }
  setFs(scale);
  $("#fs-up").onclick = function () { setFs(scale + .1); };
  $("#fs-down").onclick = function () { setFs(scale - .1); };
  $("#fs-reset").onclick = function () { setFs(1); };

  // mobile menu
  var nav = $("#site-nav"), openBtn = $("#menu-open");
  function closeMenu() { nav.classList.remove("open"); openBtn.setAttribute("aria-expanded", "false"); document.body.style.overflow = ""; }
  openBtn.onclick = function () { nav.classList.add("open"); openBtn.setAttribute("aria-expanded", "true"); document.body.style.overflow = "hidden"; $("a", nav).focus(); };
  $("#menu-close").onclick = closeMenu;
  nav.addEventListener("click", function (e) { if (e.target.closest("a")) closeMenu(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && nav.classList.contains("open")) closeMenu(); });

  // back to top (the current page's menu item is marked when the nav is rendered)
  var topBtn = $("#totop");
  function onScroll() { topBtn.hidden = window.scrollY < 600; }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  topBtn.onclick = function () { window.scrollTo({ top: 0 }); };

  // schemes tabs
  $$("#schemes .tab").forEach(function (b) {
    b.onclick = function () {
      $$("#schemes .tab").forEach(function (x) { x.setAttribute("aria-selected", x === b ? "true" : "false"); });
      var c = b.dataset.cat; $$("#scheme-grid .scheme").forEach(function (el) { el.hidden = c !== "*" && el.dataset.cat !== c; });
    };
  });
  // works filter
  $$("#works .tab").forEach(function (b) {
    b.onclick = function () {
      $$("#works .tab").forEach(function (x) { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", x === b); });
      var s = b.dataset.st; $$("#works-body tr").forEach(function (tr) { tr.hidden = s !== "*" && tr.dataset.st !== s; });
    };
  });
  // documents search
  var dq = $("#doc-q"), dt = $("#doc-type");
  function filterDocs() {
    var q = dq.value.trim().toLowerCase(), t = dt.value, n = 0;
    $$("#doc-list li").forEach(function (li) { var ok = (!q || li.dataset.q.indexOf(q) >= 0) && (!t || li.dataset.type === t); li.hidden = !ok; if (ok) n++; });
    $("#doc-empty").hidden = n > 0; $("#doc-list").hidden = n === 0;
  }
  if (dq) { dq.oninput = filterDocs; dt.onchange = filterDocs; }

  // gallery
  var gal = $("#gal");
  if (gal) {
    var lb = $("#lb"), cur = 0, visible = function () { return $$(".gitem", gal).filter(function (b) { return !b.hidden; }).map(function (b) { return +b.dataset.i; }); };
    function show(i) {
      cur = i; var g = C.gallery[i];
      $("#lb-stage").innerHTML = g.src ? '<img src="' + esc(g.src) + '" alt="' + esc(g.caption) + '">' : '<span class="gitem" style="position:absolute;inset:0;border-radius:0;cursor:default"><span class="ph">' + ic("image") + "</span></span>";
      $("#lb-cap").textContent = g.caption;
    }
    function step(d) { var v = visible(), p = v.indexOf(cur); show(v[(p + d + v.length) % v.length]); }
    gal.addEventListener("click", function (e) { var b = e.target.closest(".gitem"); if (!b) return; show(+b.dataset.i); if (lb.showModal) lb.showModal(); else lb.setAttribute("open", ""); });
    $("#lb-close").onclick = function () { lb.close(); };
    $("#lb-prev").onclick = function () { step(-1); };
    $("#lb-next").onclick = function () { step(1); };
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener("keydown", function (e) { if (e.key === "ArrowLeft") step(-1); if (e.key === "ArrowRight") step(1); });
    $$("#gallery .tab").forEach(function (b) {
      b.onclick = function () {
        $$("#gallery .tab").forEach(function (x) { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", x === b); });
        $$(".gitem", gal).forEach(function (el) { el.hidden = b.dataset.g !== "*" && el.dataset.g !== b.dataset.g; });
      };
    });
  }

  // copy buttons
  function copyText(text, btn) {
    var done = function () { toast("कॉपी केले"); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { selectFallback(btn); });
    else selectFallback(btn);
  }
  function selectFallback(btn) { var el = btn && btn.closest(".v, .result"); if (!el) return; var r = document.createRange(); r.selectNodeContents(el.querySelector("pre") || el); var s = getSelection(); s.removeAllRanges(); s.addRange(r); toast("मजकूर निवडला आहे — Ctrl+C दाबा"); }
  document.addEventListener("click", function (e) { var b = e.target.closest("[data-copy]"); if (b) copyText(b.dataset.copy, b); });

  // grievance form
  var gf = $("#gform");
  if (gf) {
    gf.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = $("#g-name"), mob = $("#g-mob"), txt = $("#g-text"), ok = true;
      [[name, name.value.trim().length > 1], [mob, /^[6-9]\d{9}$/.test(mob.value.trim())], [txt, txt.value.trim().length > 5]].forEach(function (p) {
        p[0].nextElementSibling.hidden = p[1]; p[0].setAttribute("aria-invalid", !p[1]); if (!p[1]) ok = false;
      });
      if (!ok) { $("[aria-invalid=true]", gf).focus(); return; }
      var msg = "तक्रार — " + S.name + "\nनाव: " + name.value.trim() + "\nमोबाईल: " + mob.value.trim() + "\nप्रभाग: " + ($("#g-ward").value || "—") + "\nप्रकार: " + $("#g-cat").value + "\nतपशील: " + txt.value.trim();
      var G = C.grievance, href = G.mode === "email"
        ? "mailto:" + (K.email || "") + "?subject=" + encodeURIComponent("तक्रार — " + $("#g-cat").value) + "&body=" + encodeURIComponent(msg)
        : "https://wa.me/" + (K.whatsapp || "") + "?text=" + encodeURIComponent(msg);
      var res = $("#g-result");
      res.hidden = false; res.className = "result";
      res.innerHTML = "<b>तक्रारीचा मजकूर तयार आहे</b><p class=\"muted\" style=\"font-size:var(--step--1)\">खालील बटण दाबून " + (G.mode === "email" ? "ई-मेल" : "WhatsApp") + " उघडा आणि संदेश पाठवा. ते उघडले नाही तर मजकूर कॉपी करून " + esc(G.mode === "email" ? K.email : digits(K.mobile || K.phone || "")) + " वर पाठवा.</p><pre>" + esc(msg) + '</pre><div class="acts"><a class="btn btn-brand" href="' + esc(href) + '" target="_blank" rel="noopener">' + (G.mode === "email" ? "ई-मेल उघडा" : "WhatsApp उघडा") + ' ' + ic("external") + '</a><button type="button" class="btn btn-line" data-copy="' + esc(msg) + '">' + ic("copy") + "मजकूर कॉपी करा</button></div>";
      res.scrollIntoView({ block: "nearest" });
    });
  }
})();
