/*
 * ग्रामपंचायत संकेतस्थळ — ॲडमिन पॅनेल
 * --------------------------------------------------
 * config.js मधील सर्व माहिती फॉर्ममधून बदलते आणि GitHub वर थेट जतन करते.
 * सुरक्षा: GitHub ॲक्सेस की (token) ॲडमिन पासवर्डने AES-GCM वापरून कूटबद्ध करून admin/auth.json मध्ये ठेवली जाते.
 * पासवर्डशिवाय की उघडत नाही, आणि कीशिवाय संकेतस्थळावर कोणताही बदल जतन होत नाही.
 */
(function () {
  "use strict";

  /* ================= helpers ================= */
  var root = document.getElementById("root");
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  var same = function (a, b) { return JSON.stringify(a) === JSON.stringify(b); };
  var enc = new TextEncoder(), dec = new TextDecoder();
  var uid = 0;
  function nextId() { return "f" + (++uid); }

  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === "class") el.className = v;
      else if (k === "html") el.innerHTML = v;
      else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), v);
      else if (k === "value" || k === "checked" || k === "open" || k === "disabled" || k === "hidden" || k === "selected") el[k] = v;
      else el.setAttribute(k, v === true ? "" : v);
    });
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, kid) {
    if (kid == null || kid === false) return;
    if (Array.isArray(kid)) kid.forEach(function (k) { add(el, k); });
    else el.appendChild(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }

  function store(k, v) {
    try {
      if (v === undefined) return localStorage.getItem(k);
      if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v);
    } catch (e) { return null; }
  }

  function b64FromBytes(bytes) {
    var s = "";
    for (var i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  }
  function bytesFromB64(b64) {
    var s = atob(String(b64).replace(/\s/g, "")), u = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
    return u;
  }
  function blobToB64(blob) { return blob.arrayBuffer().then(function (b) { return b64FromBytes(new Uint8Array(b)); }); }

  function today() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function money(n) {
    n = Number(n) || 0;
    if (n >= 1e7) return "₹" + +(n / 1e7).toFixed(2) + " कोटी";
    if (n >= 1e5) return "₹" + +(n / 1e5).toFixed(2) + " लाख";
    return "₹" + n.toLocaleString("en-IN");
  }

  var ICON = {
    plus: '<path d="M12 5v14M5 12h14"/>',
    up: '<path d="m18 15-6-6-6 6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
    undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    ext: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
    phone: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>'
  };
  function ic(name) { return h("span", { class: "ic", "aria-hidden": "true", html: '<svg viewBox="0 0 24 24">' + ICON[name] + "</svg>" }); }
  function btn(label, icon, onclick, cls, attrs) {
    return h("button", Object.assign({ type: "button", class: "btn " + (cls || ""), onclick: onclick }, attrs || {}), icon ? ic(icon) : null, label ? h("span", null, label) : null);
  }
  function iconBtn(icon, title, onclick, cls) {
    return h("button", { type: "button", class: "ibtn " + (cls || ""), title: title, "aria-label": title, onclick: onclick }, ic(icon));
  }

  function toast(msg, kind) {
    var t = h("div", { class: "toast " + (kind || ""), role: "status" }, msg);
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, kind === "err" ? 6000 : 3000);
  }
  var busyEl = null;
  function busy(msg) {
    if (busyEl) busyEl.remove();
    busyEl = msg ? h("div", { class: "busy" }, h("div", { class: "busy-box" }, h("span", { class: "spin" }), msg)) : null;
    if (busyEl) document.body.appendChild(busyEl);
  }

  /* ================= crypto ================= */
  var ITERATIONS = 600000;
  function deriveKey(password, salt, iterations) {
    return crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]).then(function (base) {
      return crypto.subtle.deriveKey({ name: "PBKDF2", salt: salt, iterations: iterations, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    });
  }
  function seal(secret, password) {
    var salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
    return deriveKey(password, salt, ITERATIONS).then(function (key) {
      return crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, enc.encode(JSON.stringify(secret)));
    }).then(function (ct) {
      return { v: 1, kdf: { name: "PBKDF2", hash: "SHA-256", iterations: ITERATIONS, salt: b64FromBytes(salt) }, iv: b64FromBytes(iv), data: b64FromBytes(new Uint8Array(ct)) };
    });
  }
  function unseal(blob, password) {
    return deriveKey(password, bytesFromB64(blob.kdf.salt), blob.kdf.iterations).then(function (key) {
      return crypto.subtle.decrypt({ name: "AES-GCM", iv: bytesFromB64(blob.iv) }, key, bytesFromB64(blob.data));
    }).then(function (pt) { return JSON.parse(dec.decode(pt)); });
  }

  /* ================= GitHub ================= */
  var S = null;         // उघडलेले सत्र: { token, owner, repo, branch, dir }
  var authBlob = null;  // admin/auth.json मधील कूटबद्ध माहिती
  var AUTH_CACHE = "gp-admin-auth";

  function gh(sess, path, opts) {
    opts = opts || {};
    var headers = { Authorization: "Bearer " + sess.token, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
    if (opts.body) headers["Content-Type"] = "application/json";
    return fetch("https://api.github.com/repos/" + sess.owner + "/" + sess.repo + path, {
      method: opts.method || "GET", headers: headers, cache: "no-store", body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(function (res) {
      if (res.ok) return res.status === 204 ? null : res.json();
      return res.json().catch(function () { return {}; }).then(function (j) {
        var e = new Error(j.message || ("GitHub त्रुटी " + res.status)); e.status = res.status; throw e;
      });
    });
  }
  function repoPath(sess, p) { var d = (sess.dir || "").replace(/^\/+|\/+$/g, ""); return (d ? d + "/" : "") + p; }
  function encPath(p) { return p.split("/").map(encodeURIComponent).join("/"); }
  function getFile(sess, p) {
    return gh(sess, "/contents/" + encPath(repoPath(sess, p)) + "?ref=" + encodeURIComponent(sess.branch)).then(function (j) {
      return { sha: j.sha, text: dec.decode(bytesFromB64(j.content)) };
    });
  }
  function fileSha(sess, p) { return getFile(sess, p).then(function (f) { return f.sha; }, function (e) { if (e.status === 404) return null; throw e; }); }
  function putFile(sess, p, b64, message, sha) {
    var body = { message: message, content: b64, branch: sess.branch };
    if (sha) body.sha = sha;
    return gh(sess, "/contents/" + encPath(repoPath(sess, p)), { method: "PUT", body: body });
  }
  function verifyAccess(sess) {
    return gh(sess, "").then(function (r) {
      if (!r.permissions || !r.permissions.push) throw new Error("या GitHub कीला रेपॉजिटरीमध्ये लिहिण्याची (Contents: Read and write) परवानगी नाही.");
      return r;
    }, function (e) {
      if (e.status === 401) throw new Error("GitHub की चुकीची किंवा कालबाह्य आहे.");
      if (e.status === 404) throw new Error("रेपॉजिटरी सापडली नाही, किंवा या कीला ती पाहण्याची परवानगी नाही.");
      throw e;
    });
  }
  function ghError(e) {
    if (e.status === 401) return "GitHub की कालबाह्य किंवा रद्द झाली आहे. सेटिंग्जमध्ये नवीन की टाका.";
    if (e.status === 403) return "GitHub ने परवानगी नाकारली: " + e.message;
    if (!navigator.onLine) return "इंटरनेट जोडणी नाही. जोडणी तपासून पुन्हा प्रयत्न करा.";
    return e.message || String(e);
  }

  function loadAuth() {
    return fetch("auth.json", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }).then(function (j) {
      if (j && j.data && j.kdf) { store(AUTH_CACHE, JSON.stringify(j)); return j; }
      try { return JSON.parse(store(AUTH_CACHE)); } catch (e) { return null; }
    });
  }
  function saveAuth(sess, blob) {
    return fileSha(sess, "admin/auth.json").then(function (sha) {
      return putFile(sess, "admin/auth.json", b64FromBytes(enc.encode(JSON.stringify(blob, null, 2) + "\n")), "Admin: update admin access", sha);
    }).then(function () { authBlob = blob; store(AUTH_CACHE, JSON.stringify(blob)); });
  }

  /* ================= config.js read / write ================= */
  function parseConfig(src) {
    var win = {};
    new Function("window", src)(win);
    if (!win.GP_CONFIG) throw new Error("config.js मध्ये window.GP_CONFIG सापडले नाही.");
    return JSON.parse(JSON.stringify(win.GP_CONFIG));
  }
  function key(k) { return /^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k); }
  function inline(v) {
    if (v === null || typeof v !== "object") return JSON.stringify(v);
    if (Array.isArray(v)) return "[" + v.map(inline).join(", ") + "]";
    var ks = Object.keys(v);
    return ks.length ? "{ " + ks.map(function (k) { return key(k) + ": " + inline(v[k]); }).join(", ") + " }" : "{}";
  }
  function fmt(v, ind, prefix) {
    if (v === null || typeof v !== "object") return JSON.stringify(v);
    var pad = "  ".repeat(ind), inner = "  ".repeat(ind + 1), one = inline(v);
    if (ind > 0 && pad.length + prefix + one.length <= 180) return one;
    if (Array.isArray(v)) return "[\n" + v.map(function (x) { return inner + fmt(x, ind + 1, 0); }).join(",\n") + "\n" + pad + "]";
    var sep = ind === 0 ? ",\n\n" : ",\n";
    return "{\n" + Object.keys(v).map(function (k) { return inner + key(k) + ": " + fmt(v[k], ind + 1, key(k).length + 2); }).join(sep) + "\n" + pad + "}";
  }
  function serialize(cfg) {
    return "/*\n * ग्रामपंचायत संकेतस्थळ — कॉन्फिगरेशन फाइल\n" +
      " * ही फाइल ॲडमिन पॅनेल (admin/) मधून जतन होते. माहिती बदलण्यासाठी ॲडमिन पॅनेल वापरा.\n" +
      " * हाताने बदल केल्यास चालतात, पण ॲडमिनमधून पुढच्या जतनावेळी या फाइलमधील टिप्पण्या (comments) निघून जातात.\n" +
      " * तारखा YYYY-MM-DD स्वरूपात. रक्कम रुपयांत (फक्त आकडे).\n */\n" +
      "window.GP_CONFIG = " + fmt(cfg, 0, 0) + ";\n";
  }

  /* ================= content schema ================= */
  function F(type, k, label, o) { return Object.assign({ type: type, k: k, label: label }, o || {}); }
  var T = F.bind(null, "text"), TA = F.bind(null, "textarea"), N = F.bind(null, "number"), D = F.bind(null, "date"),
    U = F.bind(null, "url"), IMG = F.bind(null, "image"), FILE = F.bind(null, "file"), BOOL = F.bind(null, "bool"),
    COLOR = F.bind(null, "color"), ICONF = F.bind(null, "icon"), STRS = F.bind(null, "strings");
  function SEL(k, label, options, o) { return F("select", k, label, Object.assign({ options: options }, o)); }
  function LIST(k, label, fields, o) { return F("list", k, label, Object.assign({ fields: fields }, o)); }

  var ICON_OPTS = [["file", "दस्तऐवज"], ["home", "घर"], ["landmark", "शासकीय इमारत"], ["building", "इमारत"], ["rupee", "रुपया / कर"], ["heart", "विवाह / आरोग्य"],
    ["users", "लोक"], ["user", "व्यक्ती"], ["grid", "प्रभाग"], ["book", "शिक्षण"], ["droplet", "पाणी"], ["leaf", "पर्यावरण / शेती"], ["zap", "वीज"], ["road", "रस्ता"],
    ["shield", "सुरक्षा"], ["phone", "फोन"], ["mail", "ई-मेल"], ["pin", "ठिकाण"], ["calendar", "दिनांक"], ["clock", "वेळ"], ["check", "बरोबर"], ["image", "फोटो"],
    ["megaphone", "घोषणा"], ["message", "संदेश"]];
  var STATUS_OPTS = [["done", "पूर्ण"], ["ongoing", "प्रगतीपथावर"], ["approved", "मंजूर"]];
  var STATUS_LABEL = { done: "पूर्ण", ongoing: "प्रगतीपथावर", approved: "मंजूर" };

  var PAGES = [
    { id: "basic", title: "मूलभूत माहिती", desc: "ग्रामपंचायतीचे नाव, ठिकाण, लोगो आणि संकेतस्थळाचे रंग.", blocks: [
      { type: "object", key: "site", title: "ग्रामपंचायत", fields: [
        T("name", "ग्रामपंचायतीचे पूर्ण नाव", { req: true, ph: "उदा. ग्रामपंचायत सुंदरवाडी" }), T("village", "गाव"),
        T("taluka", "तालुका"), T("district", "जिल्हा"), T("state", "राज्य"), T("tagline", "घोषवाक्य", { ph: "उदा. स्वच्छ, सुंदर आणि स्वयंपूर्ण गाव" }),
        T("established", "स्थापना वर्ष", { ph: "उदा. 1958" }), T("lgdCode", "LGD कोड"),
        IMG("logo", "लोगो / शिक्का", { hint: "रिकामे ठेवल्यास गावाच्या नावाचे पहिले अक्षर दिसते.", keepPng: true, max: 600 }),
        BOOL("demo", "\"नमुना संकेतस्थळ\" पट्टी दाखवा", { hint: "खरे संकेतस्थळ सुरू झाल्यावर हे बंद करा." })
      ] },
      { type: "object", key: "theme", title: "रंग व अंक", fields: [
        COLOR("brand", "मुख्य रंग", { hint: "हेडर, मेनू आणि बटणे" }), COLOR("accent", "दुय्यम रंग", { hint: "ठळक खुणा" }),
        SEL("numerals", "अंक कसे दिसावेत", [["devanagari", "मराठी अंक (१२३)"], ["latin", "इंग्रजी अंक (123)"]])
      ] }
    ] },
    { id: "contact", title: "संपर्क", desc: "कार्यालयाचा पत्ता, फोन, वेळ, नकाशा आणि समाजमाध्यमे.", blocks: [
      { type: "object", key: "contact", title: "कार्यालय संपर्क", fields: [
        T("phone", "दूरध्वनी"), T("mobile", "मोबाईल"), T("whatsapp", "WhatsApp क्रमांक", { hint: "देशकोडसह, + शिवाय. उदा. 919876543210" }), T("email", "ई-मेल"),
        TA("address", "पत्ता", { full: true }), T("officeHours", "कार्यालयीन वेळ"), T("holidays", "सुट्टी"),
        U("mapLink", "Google Maps दुवा", { full: true }), U("mapEmbed", "Google Maps \"Embed\" दुवा (ऐच्छिक)", { full: true, hint: "Google Maps → Share → Embed a map मधील src=\"…\" मधला दुवा." })
      ] },
      { type: "object", key: "social", title: "समाजमाध्यमे", desc: "रिकामे ठेवलेले दुवे दिसत नाहीत.", fields: [
        U("facebook", "Facebook"), U("youtube", "YouTube"), U("instagram", "Instagram"), U("x", "X (Twitter)")
      ] }
    ] },
    { id: "home", title: "मुख्यपृष्ठ व घोषणा", desc: "पहिल्या भागातील स्वागत मजकूर, ग्रामसभा आणि सरकणाऱ्या घोषणा.", blocks: [
      { type: "list", key: "announcements", title: "घोषणा (सरकणारी पट्टी)", addTop: true, addLabel: "नवीन घोषणा", item: { text: "", href: "#documents", isNew: true },
        summary: function (a) { return a.text; }, fields: [
          TA("text", "घोषणेचा मजकूर", { full: true, rows: 2 }), U("href", "क्लिक केल्यावर कुठे जावे", { hint: "उदा. #documents किंवा पूर्ण दुवा" }), BOOL("isNew", "\"नवीन\" खूण दाखवा")
        ] },
      { type: "object", key: "gramSabha", title: "पुढील ग्रामसभा", nullable: true, item: { date: "", time: "", venue: "" }, fields: [
        D("date", "दिनांक"), T("time", "वेळ", { ph: "उदा. सकाळी ११:००" }), T("venue", "ठिकाण", { full: true })
      ] },
      { type: "object", key: "hero", title: "स्वागत भाग", fields: [
        T("welcome", "छोटे शीर्षक", { ph: "आपले स्वागत आहे" }), IMG("image", "पार्श्वभूमी फोटो", { max: 2000 }),
        TA("text", "स्वागत मजकूर", { full: true }),
        LIST("buttons", "बटणे", [T("label", "बटणावरील मजकूर"), U("href", "दुवा", { hint: "उदा. #services, #grievance, #contact" })], { item: { label: "", href: "#contact" }, summary: function (b) { return b.label; }, addLabel: "बटण जोडा" })
      ] }
    ] },
    { id: "people", title: "पदाधिकारी व आकडेवारी", desc: "सरपंच, उपसरपंच, अधिकारी, सरपंचांचा संदेश आणि गावाची आकडेवारी.", blocks: [
      { type: "list", key: "leaders", title: "पदाधिकारी", addLabel: "पदाधिकारी जोडा", item: { name: "", role: "", photo: "", phone: "" },
        summary: function (l) { return [l.role, l.name].filter(Boolean).join(" — "); }, fields: [
          T("name", "नाव", { ph: "उदा. श्री. महेश जाधव" }), T("role", "पद", { ph: "उदा. सरपंच" }), T("phone", "फोन (ऐच्छिक)"), IMG("photo", "फोटो", { max: 800 })
        ] },
      { type: "object", key: "message", title: "सरपंचांचा संदेश", nullable: true, item: { from: "", role: "सरपंच", text: "" }, fields: [
        T("from", "नाव"), T("role", "पद"), TA("text", "संदेश", { full: true, rows: 5 })
      ] },
      { type: "list", key: "stats", title: "गावाची आकडेवारी", addLabel: "आकडा जोडा", item: { label: "", value: 0, icon: "grid" },
        hint: "\"लोकसंख्या\" आणि \"प्रभाग\" ही नावे मुख्यपृष्ठावर आणि तक्रार फॉर्ममध्येही वापरली जातात.",
        summary: function (s) { return s.label + (s.label ? ": " : "") + (s.value || 0) + (s.suffix || ""); }, fields: [
          T("label", "नाव", { ph: "उदा. लोकसंख्या" }), N("value", "आकडा"), T("suffix", "आकड्यानंतर (ऐच्छिक)", { ph: "उदा. %" }), ICONF("icon", "चिन्ह")
        ] }
    ] },
    { id: "about", title: "आमच्याबद्दल", desc: "गावाचा इतिहास, दृष्टी, उद्दिष्टे आणि सुविधा.", blocks: [
      { type: "object", key: "about", title: "गावाची माहिती", nullable: true, item: { history: [], vision: "", goals: [], facilities: [] }, fields: [
        STRS("history", "इतिहास (परिच्छेद)", { multiline: true, addLabel: "परिच्छेद जोडा" }), TA("vision", "दृष्टी", { full: true }),
        STRS("goals", "उद्दिष्टे", { addLabel: "उद्दिष्ट जोडा" }), STRS("facilities", "गावातील सुविधा", { addLabel: "सुविधा जोडा" })
      ] }
    ] },
    { id: "services", title: "नागरिक सेवा", desc: "दाखले व सेवा — कालावधी, शुल्क, कागदपत्रे आणि ऑनलाइन अर्जाचा दुवा.", blocks: [
      { type: "list", key: "services", title: "सेवा", addLabel: "सेवा जोडा", item: { title: "", icon: "file", time: "", fee: "", docs: [], href: "" },
        summary: function (s) { return s.title; }, fields: [
          T("title", "सेवेचे नाव", { full: true }), T("time", "कालावधी", { ph: "उदा. ७ दिवस" }), T("fee", "शुल्क", { ph: "उदा. ₹२०" }), ICONF("icon", "चिन्ह"),
          U("href", "ऑनलाइन अर्जाचा दुवा (ऐच्छिक)"), STRS("docs", "आवश्यक कागदपत्रे", { addLabel: "कागदपत्र जोडा" })
        ] }
    ] },
    { id: "schemes", title: "शासकीय योजना", desc: "प्रकारानुसार (केंद्र, राज्य, जिल्हा) टॅब आपोआप तयार होतात.", blocks: [
      { type: "list", key: "schemes", title: "योजना", addLabel: "योजना जोडा", item: { category: "केंद्र शासन", name: "", desc: "", benefit: "", href: "" },
        summary: function (s) { return [s.name, s.category && "(" + s.category + ")"].filter(Boolean).join(" "); }, fields: [
          T("name", "योजनेचे नाव", { full: true }), T("category", "प्रकार", { suggest: true, ph: "उदा. केंद्र शासन" }), T("benefit", "लाभ", { ph: "उदा. ₹१,२०,००० पर्यंत" }),
          TA("desc", "माहिती", { full: true, rows: 2 }), U("href", "अधिकृत संकेतस्थळ (ऐच्छिक)", { full: true })
        ] }
    ] },
    { id: "works", title: "विकासकामे", desc: "मंजूर, सुरू आणि पूर्ण झालेली कामे, निधीसह.", blocks: [
      { type: "list", key: "works", title: "कामे", addTop: true, addLabel: "काम जोडा", item: { title: "", ward: "", fund: "", cost: 0, year: "", status: "approved", progress: 0 },
        summary: function (w) { return w.title + (w.status ? " · " + (STATUS_LABEL[w.status] || w.status) : ""); }, fields: [
          T("title", "कामाचे नाव", { full: true }), T("ward", "प्रभाग", { ph: "उदा. २ किंवा सर्व" }), T("fund", "निधी स्रोत", { suggest: true, ph: "उदा. १५ वा वित्त आयोग" }),
          N("cost", "रक्कम (रुपये, फक्त आकडे)", { money: true }), T("year", "वर्ष", { ph: "उदा. 2026-27", suggest: true }),
          SEL("status", "स्थिती", STATUS_OPTS), N("progress", "प्रगती (%)", { min: 0, max: 100, hint: "फक्त \"प्रगतीपथावर\" कामांसाठी दिसते." })
        ] }
    ] },
    { id: "budget", title: "अर्थसंकल्प", desc: "अंदाजित उत्पन्न आणि खर्च. रक्कम रुपयांत, फक्त आकडे.", blocks: [
      { type: "object", key: "budget", title: "अर्थसंकल्प", nullable: true, item: { year: "", income: [], expense: [] }, fields: [
        T("year", "आर्थिक वर्ष", { ph: "उदा. 2026-27" }),
        LIST("income", "अंदाजित उत्पन्न", [T("label", "बाब"), N("amount", "रक्कम (रुपये)", { money: true })], { item: { label: "", amount: 0 }, summary: function (r) { return r.label + " — " + money(r.amount); }, addLabel: "उत्पन्न बाब जोडा" }),
        LIST("expense", "अंदाजित खर्च", [T("label", "बाब"), N("amount", "रक्कम (रुपये)", { money: true })], { item: { label: "", amount: 0 }, summary: function (r) { return r.label + " — " + money(r.amount); }, addLabel: "खर्च बाब जोडा" })
      ] }
    ] },
    { id: "documents", title: "सूचना व दस्तऐवज", desc: "जाहीर सूचना, निविदा, इतिवृत्त, लाभार्थी याद्या. संकेतस्थळावर नवीन आधी दिसतात.", blocks: [
      { type: "list", key: "documents", title: "दस्तऐवज", addTop: true, addLabel: "दस्तऐवज जोडा", item: function () { return { date: today(), title: "", type: "सूचना", file: "" }; },
        summary: function (d) { return [d.date, d.title].filter(Boolean).join(" · "); }, fields: [
          T("title", "शीर्षक", { full: true }), D("date", "दिनांक"), T("type", "प्रकार", { suggest: true, ph: "उदा. सूचना, निविदा, इतिवृत्त" }),
          FILE("file", "फाइल (PDF) किंवा दुवा", { full: true, hint: "रिकामे ठेवल्यास \"कार्यालयात उपलब्ध\" असे दिसते." })
        ] }
    ] },
    { id: "committees", title: "समित्या व सदस्य", desc: "ग्राम समित्या आणि प्रभागनिहाय निवडून आलेले सदस्य.", blocks: [
      { type: "list", key: "committees", title: "समित्या", addLabel: "समिती जोडा", item: { name: "", members: [] },
        summary: function (c) { return c.name; }, fields: [T("name", "समितीचे नाव", { full: true }), STRS("members", "सदस्य", { addLabel: "सदस्य जोडा", ph: "उदा. सौ. सुनीता पाटील — अध्यक्ष" })] },
      { type: "list", key: "wardMembers", title: "प्रभागनिहाय सदस्य", addLabel: "सदस्य जोडा", item: { ward: "", name: "", category: "" },
        summary: function (m) { return (m.ward ? "प्रभाग " + m.ward + " — " : "") + m.name; }, fields: [
          T("ward", "प्रभाग"), T("name", "नाव"), T("category", "आरक्षण", { suggest: true, ph: "उदा. सर्वसाधारण (महिला)" })
        ] }
    ] },
    { id: "gallery", title: "छायाचित्रे", desc: "कार्यक्रम आणि विकासकामांचे फोटो. प्रकारानुसार टॅब आपोआप तयार होतात.", blocks: [
      { type: "list", key: "gallery", title: "फोटो", addTop: true, addLabel: "फोटो जोडा", item: { src: "", caption: "", category: "" },
        summary: function (g) { return g.caption; }, thumb: "src", fields: [
          IMG("src", "फोटो", { max: 1600 }), T("caption", "फोटो ओळ", { full: true }), T("category", "प्रकार", { suggest: true, ph: "उदा. कार्यक्रम, विकासकामे" })
        ] }
    ] },
    { id: "grievance", title: "तक्रार", desc: "नागरिकांच्या तक्रारी कशा पोहोचाव्यात आणि निवारणाचे टप्पे.", blocks: [
      { type: "object", key: "grievance", title: "तक्रार निवारण", nullable: true, item: { mode: "whatsapp", formUrl: "", categories: [], escalation: [] }, fields: [
        SEL("mode", "तक्रार कशी पोहोचावी", [["whatsapp", "WhatsApp वर (संपर्क विभागातील क्रमांक)"], ["email", "ई-मेलने (संपर्क विभागातील ई-मेल)"], ["link", "Google Form दुव्यावर"]]),
        U("formUrl", "Google Form दुवा", { hint: "फक्त \"Google Form\" निवडल्यास वापरला जातो." }),
        STRS("categories", "तक्रारीचे प्रकार", { addLabel: "प्रकार जोडा" }),
        LIST("escalation", "निवारणाचे टप्पे", [T("level", "स्तर", { ph: "उदा. स्तर १" }), T("who", "अधिकारी"), T("days", "कालावधी", { ph: "उदा. ७ दिवस" })],
          { item: { level: "", who: "", days: "" }, summary: function (e) { return [e.level, e.who, e.days].filter(Boolean).join(" · "); }, addLabel: "टप्पा जोडा" })
      ] }
    ] },
    { id: "menu", title: "मेनू व फूटर", desc: "मेनूमधील विभागांचा क्रम व नावे, महत्त्वाचे दुवे आणि फूटर.", blocks: [
      { type: "sections", title: "मेनूतील विभाग" },
      { type: "list", key: "links", title: "महत्त्वाचे दुवे (फूटर)", addLabel: "दुवा जोडा", item: { label: "", href: "" },
        summary: function (l) { return l.label; }, fields: [T("label", "नाव"), U("href", "दुवा")] },
      { type: "object", key: "footer", title: "फूटर", fields: [T("credit", "निर्मिती ओळ", { full: true, ph: "उदा. संकेतस्थळ निर्मिती: आपल्या एजन्सीचे नाव" })] }
    ] },
    { id: "settings", title: "सेटिंग्ज", desc: "SitePragati नूतनीकरण, पासवर्ड, GitHub की आणि लॉग आउट.", blocks: [
      { type: "object", key: "renewal", title: "SitePragati नूतनीकरण", desc: "हा Customer ID संकेतस्थळाच्या नूतनीकरणाची देय तारीख तपासण्यासाठी वापरला जातो.", fields: [
        T("customerId", "SitePragati Customer ID", { ph: "उदा. EmblynAQ1qENZ91", mono: true,
          hint: "रिकामे ठेवल्यास नूतनीकरण तपासणी बंद राहते. हा ग्राहक sitepragati.in वर आधी तयार असावा आणि त्याची देय तारीख भविष्यातील असावी — अन्यथा जतन केल्यावर संकेतस्थळ लगेच बंद होईल." })
      ] },
      { type: "settings" }
    ] }
  ];
  var SECTION_DEFS = [["about", "आमच्याबद्दल"], ["services", "नागरिक सेवा"], ["schemes", "योजना"], ["works", "विकासकामे"], ["budget", "अर्थसंकल्प"],
    ["documents", "सूचना व दस्तऐवज"], ["committees", "समित्या"], ["gallery", "छायाचित्रे"], ["grievance", "तक्रार"], ["contact", "संपर्क"]];

  /* ================= editor state ================= */
  var data = null, original = null, sha = null, page = "basic", openItem = null;
  var localUrls = {};   // नुकत्याच अपलोड केलेल्या फाइल्सचे पूर्वावलोकन (संकेतस्थळ अद्ययावत होईपर्यंत)
  var draftTimer = null;
  function draftKey() { return "gp-admin-draft:" + S.owner + "/" + S.repo; }
  function isDirty() { return data && !same(data, original); }
  function changed() {
    updateBar();
    clearTimeout(draftTimer);
    draftTimer = setTimeout(function () {
      if (isDirty()) store(draftKey(), JSON.stringify({ sha: sha, ts: Date.now(), data: data }));
      else store(draftKey(), null);
    }, 600);
  }
  function assetUrl(p) {
    if (!p) return "";
    if (localUrls[p]) return localUrls[p];
    return /^(https?:|data:|blob:)/i.test(p) ? p : "../" + p.replace(/^\.?\//, "");
  }

  /* ================= screens ================= */
  function screen(cls) { root.innerHTML = ""; var el = h("div", { class: "screen " + cls }); root.appendChild(el); return el; }
  function authCard(title, sub) {
    var el = screen("auth");
    var card = h("div", { class: "auth-card" }, h("div", { class: "auth-mark" }, ic("lock")), h("h1", null, title), sub ? h("p", { class: "muted" }, sub) : null);
    el.appendChild(card);
    return card;
  }
  function errBox() { return h("p", { class: "form-err", role: "alert", hidden: true }); }
  function showErr(el, msg) { el.textContent = msg; el.hidden = !msg; }
  function field(label, input, hint) {
    var id = input.id || (input.id = nextId());
    return h("div", { class: "field" }, h("label", { for: id }, label), input, hint ? h("small", { class: "hint" }, hint) : null);
  }

  function showLogin() {
    S = null; data = null;
    var card = authCard("ॲडमिन पॅनेल", "संकेतस्थळावरील माहिती बदलण्यासाठी पासवर्ड टाका.");
    var pw = h("input", { type: "password", autocomplete: "current-password", required: true, autofocus: true });
    var err = errBox();
    var submit = h("button", { type: "submit", class: "btn primary wide" }, "उघडा");
    var form = h("form", { class: "stack", onsubmit: function (e) {
      e.preventDefault();
      if (!pw.value) return showErr(err, "पासवर्ड टाका.");
      submit.disabled = true; submit.textContent = "तपासत आहे…"; showErr(err, "");
      unseal(authBlob, pw.value).then(function (secret) {
        S = secret; startEditor();
      }, function () {
        setTimeout(function () { submit.disabled = false; submit.textContent = "उघडा"; showErr(err, "पासवर्ड चुकीचा आहे."); pw.select(); }, 800);
      });
    } }, field("पासवर्ड", pw), err, submit);
    card.appendChild(form);
    card.appendChild(h("div", { class: "auth-foot" },
      h("a", { href: "../" }, "← संकेतस्थळावर जा"),
      h("button", { type: "button", class: "link", onclick: function () { showSetup(true); } }, "पासवर्ड विसरलात?")));
    pw.focus();
  }

  function guessRepo() {
    var host = location.hostname, m = host.match(/^([^.]+)\.github\.io$/i);
    if (!m) return { owner: "", repo: "" };
    var seg = location.pathname.split("/").filter(Boolean);
    return { owner: m[1], repo: seg.length > 1 ? seg[0] : host };
  }

  function showSetup(isReset) {
    var g = guessRepo();
    var card = authCard(isReset ? "पासवर्ड पुन्हा सेट करा" : "ॲडमिन पॅनेल सेटअप",
      isReset ? "पासवर्ड विसरल्यास, GitHub ची नवीन ॲक्सेस की वापरून नवीन पासवर्ड ठेवा. GitHub रेपॉजिटरीवर लिहिण्याचा हक्क असलेली व्यक्तीच हे करू शकते."
        : "हे फक्त एकदाच करायचे आहे (संकेतस्थळ बनवणाऱ्या व्यक्तीने). त्यानंतर कर्मचारी फक्त पासवर्डने लॉग इन करतील.");
    card.classList.add("wide-card");
    var owner = h("input", { value: g.owner, placeholder: "उदा. swapniluser100-byte", autocomplete: "off", spellcheck: "false" });
    var repo = h("input", { value: g.repo, placeholder: "उदा. Grampanchayat", autocomplete: "off", spellcheck: "false" });
    var branch = h("input", { value: "main", autocomplete: "off", spellcheck: "false" });
    var dir = h("input", { value: "", placeholder: "रिकामे = रेपॉजिटरीचे मूळ फोल्डर", autocomplete: "off", spellcheck: "false" });
    var token = h("input", { type: "password", autocomplete: "off", spellcheck: "false", placeholder: "github_pat_…" });
    var pw1 = h("input", { type: "password", autocomplete: "new-password" });
    var pw2 = h("input", { type: "password", autocomplete: "new-password" });
    var err = errBox();
    var submit = h("button", { type: "submit", class: "btn primary wide" }, "सेटअप पूर्ण करा");
    var steps = h("ol", { class: "steps" },
      h("li", null, "GitHub वर ", h("a", { href: "https://github.com/settings/personal-access-tokens/new", target: "_blank", rel: "noopener" }, "Fine-grained personal access token"), " तयार करा."),
      h("li", null, "Repository access: ", h("b", null, "Only select repositories"), " → या संकेतस्थळाची रेपॉजिटरी निवडा."),
      h("li", null, "Permissions → Repository permissions → ", h("b", null, "Contents: Read and write"), ". इतर काहीही देऊ नका."),
      h("li", null, "Expiration शक्यतो १ वर्ष ठेवा. की कालबाह्य झाल्यावर सेटिंग्जमधून नवीन की टाकता येते."));
    var form = h("form", { class: "stack", onsubmit: function (e) {
      e.preventDefault(); showErr(err, "");
      var sess = { owner: owner.value.trim(), repo: repo.value.trim(), branch: branch.value.trim() || "main", dir: dir.value.trim(), token: token.value.trim() };
      if (!sess.owner || !sess.repo) return showErr(err, "GitHub खाते आणि रेपॉजिटरीचे नाव भरा.");
      if (!sess.token) return showErr(err, "GitHub ॲक्सेस की टाका.");
      if (pw1.value.length < 10) return showErr(err, "पासवर्ड किमान १० अक्षरांचा असावा.");
      if (pw1.value !== pw2.value) return showErr(err, "दोन्ही पासवर्ड जुळत नाहीत.");
      submit.disabled = true;
      busy("GitHub तपासत आहे…");
      verifyAccess(sess).then(function () {
        return getFile(sess, "config.js").catch(function (e2) {
          if (e2.status === 404) throw new Error("रेपॉजिटरीमध्ये " + repoPath(sess, "config.js") + " सापडली नाही. फोल्डर तपासा.");
          throw e2;
        });
      }).then(function () {
        busy("पासवर्ड सुरक्षित करत आहे…");
        return seal(sess, pw1.value);
      }).then(function (blob) {
        busy("जतन करत आहे…");
        return saveAuth(sess, blob);
      }).then(function () {
        busy(null); S = sess; toast("सेटअप पूर्ण झाला. पुढील वेळी फक्त पासवर्ड लागेल.", "ok"); startEditor();
      }).catch(function (e3) { busy(null); submit.disabled = false; showErr(err, ghError(e3)); });
    } },
      h("details", { class: "help", open: !isReset }, h("summary", null, "GitHub ॲक्सेस की कशी मिळवायची?"), steps),
      h("div", { class: "grid2" }, field("GitHub खाते (owner)", owner), field("रेपॉजिटरी", repo), field("ब्रँच", branch), field("संकेतस्थळ फोल्डर (ऐच्छिक)", dir)),
      field("GitHub ॲक्सेस की", token, "ही की कुठेही साध्या स्वरूपात जतन होत नाही. ती पासवर्डने कूटबद्ध होते."),
      h("div", { class: "grid2" }, field("नवीन ॲडमिन पासवर्ड", pw1, "किमान १० अक्षरे. शब्द + आकडे वापरा."), field("पासवर्ड पुन्हा टाका", pw2)),
      err, submit);
    card.appendChild(form);
    if (authBlob) card.appendChild(h("div", { class: "auth-foot" }, h("button", { type: "button", class: "link", onclick: showLogin }, "← लॉग इनकडे परत")));
  }

  /* ================= editor ================= */
  var bar = null, main = null, nav = null;

  function startEditor() {
    busy("माहिती आणत आहे…");
    getFile(S, "config.js").then(function (f) {
      var cfg = parseConfig(f.text);
      sha = f.sha; original = clone(cfg); data = clone(cfg);
      busy(null);
      var draft = null;
      try { draft = JSON.parse(store(draftKey())); } catch (e) { draft = null; }
      if (draft && draft.data && !same(draft.data, data)) {
        var when = new Date(draft.ts).toLocaleString("mr-IN");
        var msg = "जतन न केलेले बदल सापडले (" + when + ").\nते पुन्हा उघडायचे?" + (draft.sha !== sha ? "\n\nसूचना: त्यानंतर संकेतस्थळावर दुसरीकडून बदल झाले आहेत. तुमचे बदल जतन केल्यास ते बदल बदलले जाऊ शकतात." : "");
        if (confirm(msg)) data = draft.data; else store(draftKey(), null);
      }
      renderShell();
      lockTimerStart();
    }).catch(function (e) {
      busy(null);
      var card = authCard("माहिती आणता आली नाही", ghError(e));
      card.appendChild(h("div", { class: "stack" }, btn("पुन्हा प्रयत्न करा", null, startEditor, "primary wide"), btn("लॉग आउट", null, showLogin, "wide")));
    });
  }

  function renderShell() {
    var el = screen("app");
    bar = h("header", { class: "topbar" });
    nav = h("nav", { class: "side", "aria-label": "विभाग" });
    main = h("main", { class: "main", id: "main" });
    el.appendChild(bar);
    el.appendChild(h("div", { class: "body" }, nav, main));
    renderNav(); renderBar(); renderPage();
  }

  function renderNav() {
    nav.innerHTML = "";
    var ul = h("ul");
    PAGES.forEach(function (p) {
      ul.appendChild(h("li", null, h("a", { href: "#" + p.id, class: p.id === page ? "on" : "", "aria-current": p.id === page ? "page" : null, onclick: function (e) {
        e.preventDefault(); page = p.id; openItem = null; renderNav(); renderPage(); main.scrollTop = 0; window.scrollTo(0, 0);
      } }, p.title, h("i", { class: "dot", hidden: !pageDirty(p) }))));
    });
    nav.appendChild(ul);
  }
  function pageDirty(p) {
    return p.blocks.some(function (b) {
      var k = b.type === "sections" ? "sections" : b.key;
      return k && !same(data[k], original[k]);
    });
  }

  var statusEl = null, saveBtn = null, undoBtn = null;
  function renderBar() {
    bar.innerHTML = "";
    statusEl = h("span", { class: "status" });
    saveBtn = btn("जतन करा", "save", function () { save(false); }, "primary");
    undoBtn = btn("बदल रद्द करा", "undo", discard, "ghost hide-sm");
    bar.appendChild(h("div", { class: "brand" }, h("b", null, (data.site && data.site.name) || "ग्रामपंचायत"), h("small", null, "ॲडमिन पॅनेल")));
    bar.appendChild(h("div", { class: "actions" }, statusEl,
      h("a", { class: "btn ghost hide-sm", href: "../", target: "_blank", rel: "noopener" }, ic("ext"), h("span", null, "संकेतस्थळ")),
      btn("पूर्वावलोकन", "eye", preview, "ghost"), undoBtn, saveBtn));
    updateBar();
  }
  function updateBar() {
    if (!statusEl) return;
    var d = isDirty();
    statusEl.textContent = d ? "जतन न केलेले बदल" : "सर्व बदल जतन झाले";
    statusEl.className = "status " + (d ? "warn" : "ok");
    saveBtn.disabled = !d; undoBtn.disabled = !d;
    if (nav) Array.prototype.forEach.call(nav.querySelectorAll("a"), function (a, i) { $(".dot", a).hidden = !pageDirty(PAGES[i]); });
  }

  function renderPage() {
    var p = PAGES.find(function (x) { return x.id === page; });
    main.innerHTML = "";
    main.appendChild(h("div", { class: "page-head" }, h("h1", null, p.title), p.desc ? h("p", { class: "muted" }, p.desc) : null));
    p.blocks.forEach(function (b) { main.appendChild(renderBlock(b)); });
  }

  function card(title, desc, right) {
    var c = h("section", { class: "card" });
    if (title) c.appendChild(h("div", { class: "card-head" }, h("div", null, h("h2", null, title), desc ? h("p", { class: "muted" }, desc) : null), right || null));
    return c;
  }

  function renderBlock(b) {
    if (b.type === "settings") return renderSettings();
    if (b.type === "sections") return renderSections(b);
    if (b.type === "list") {
      var c = card(b.title, b.hint);
      c.appendChild(renderList(function () { return Array.isArray(data[b.key]) ? data[b.key] : (data[b.key] = []); }, function () { return data[b.key] || []; }, b));
      return c;
    }
    // object
    if (data[b.key] == null) {
      if (b.nullable) {
        var off = card(b.title);
        off.classList.add("off");
        off.appendChild(h("p", { class: "muted" }, "हा विभाग सध्या बंद आहे आणि संकेतस्थळावर दिसत नाही."));
        off.appendChild(btn("हा विभाग सुरू करा", "plus", function () { data[b.key] = clone(b.item || {}); changed(); renderPage(); }, "primary"));
        return off;
      }
      data[b.key] = {}; original[b.key] = {};
    }
    var right = b.nullable ? btn("विभाग बंद करा", "x", function () {
      if (!confirm("\"" + b.title + "\" विभाग बंद करायचा? यातील माहिती काढली जाईल.")) return;
      data[b.key] = null; changed(); renderPage();
    }, "ghost small") : null;
    var c2 = card(b.title, b.desc, right);
    c2.appendChild(renderFields(data[b.key], b.fields));
    return c2;
  }

  function renderFields(obj, fields, ctx) {
    var grid = h("div", { class: "fields" });
    fields.forEach(function (f) { grid.appendChild(renderField(f, obj, ctx)); });
    return grid;
  }

  function renderField(f, obj, ctx) {
    var id = nextId();
    var wide = f.full || f.type === "textarea" || f.type === "strings" || f.type === "list" || f.type === "file";
    var wrap = h("div", { class: "field" + (wide ? " full" : "") });
    var label = h("label", { for: id }, f.label, f.req ? h("span", { class: "req", "aria-hidden": "true" }, " *") : null);
    var hint = f.hint ? h("small", { class: "hint" }, f.hint) : null;
    var v = obj[f.k];
    function set(val) { obj[f.k] = val; changed(); if (ctx && ctx.onChange) ctx.onChange(); }

    switch (f.type) {
      case "text": case "url": case "date": {
        var inp = h("input", { id: id, type: f.type === "date" ? "date" : "text", value: v == null ? "" : String(v), placeholder: f.ph || null, required: f.req || null,
          inputmode: f.type === "url" ? "url" : null, spellcheck: f.type === "url" || f.mono ? "false" : null, autocomplete: f.mono ? "off" : null,
          class: f.mono ? "mono" : null, oninput: function () { set(f.mono ? inp.value.trim() : inp.value); } });
        if (f.suggest && ctx && ctx.siblings) {
          var listId = id + "-dl", vals = [];
          ctx.siblings().forEach(function (s) { var x = s[f.k]; if (x && vals.indexOf(x) < 0) vals.push(x); });
          inp.setAttribute("list", listId);
          wrap.appendChild(h("datalist", { id: listId }, vals.map(function (x) { return h("option", { value: x }); })));
        }
        wrap.prepend(label); wrap.appendChild(inp); break;
      }
      case "number": {
        var out = f.money ? h("small", { class: "hint money" }, money(v)) : null;
        var num = h("input", { id: id, type: "number", inputmode: "numeric", value: v == null ? "" : String(v), min: f.min, max: f.max, step: "any", oninput: function () {
          var n = num.value === "" ? 0 : Number(num.value);
          if (f.max != null) n = Math.min(f.max, n);
          if (f.min != null) n = Math.max(f.min, n);
          set(isNaN(n) ? 0 : n);
          if (out) out.textContent = money(obj[f.k]);
        } });
        wrap.append(label, num); if (out) wrap.appendChild(out); break;
      }
      case "textarea": {
        var ta = h("textarea", { id: id, rows: f.rows || 3, placeholder: f.ph || null, oninput: function () { set(ta.value); } });
        ta.value = v == null ? "" : String(v);
        wrap.append(label, ta); break;
      }
      case "select": case "icon": {
        var opts = f.type === "icon" ? ICON_OPTS.map(function (o) { return [o[0], o[1] + " (" + o[0] + ")"]; }) : f.options;
        if (v && !opts.some(function (o) { return o[0] === v; })) opts = opts.concat([[v, v]]);
        var sel = h("select", { id: id, onchange: function () { set(sel.value); } }, opts.map(function (o) { return h("option", { value: o[0], selected: o[0] === v }, o[1]); }));
        if (!v && opts.length) sel.value = opts[0][0];
        wrap.append(label, sel); break;
      }
      case "bool": {
        var cb = h("input", { id: id, type: "checkbox", checked: !!v, onchange: function () { set(cb.checked); } });
        wrap.classList.add("check");
        wrap.append(h("label", { class: "switch", for: id }, cb, h("span", { class: "track" }), h("span", null, f.label))); break;
      }
      case "color": {
        var hex = h("input", { type: "text", value: v || "", class: "hex", spellcheck: "false", "aria-label": f.label + " (hex)", oninput: function () {
          if (/^#[0-9a-f]{6}$/i.test(hex.value)) { col.value = hex.value; set(hex.value); }
        } });
        var col = h("input", { id: id, type: "color", value: /^#[0-9a-f]{6}$/i.test(v || "") ? v : "#0f5a46", oninput: function () { hex.value = col.value; set(col.value); } });
        wrap.append(label, h("div", { class: "color-row" }, col, hex)); break;
      }
      case "image": wrap.append(label, imageField(f, obj, set, id)); break;
      case "file": wrap.append(label, fileField(f, obj, set, id)); break;
      case "strings": {
        label = h("div", { class: "label" }, f.label);
        wrap.append(label, renderStrings(obj, f, ctx)); break;
      }
      case "list": {
        label = h("div", { class: "label" }, f.label);
        wrap.append(label, renderList(function () { return Array.isArray(obj[f.k]) ? obj[f.k] : (obj[f.k] = []); }, function () { return obj[f.k] || []; }, f, true)); break;
      }
    }
    if (hint) wrap.appendChild(hint);
    return wrap;
  }

  /* ---------- lists of objects ---------- */
  function newItem(def) { return typeof def.item === "function" ? def.item() : clone(def.item || {}); }

  function renderList(getArr, peekArr, def, nested) {
    var box = h("div", { class: "list" + (nested ? " nested" : "") });
    var items = h("div", { class: "items" });
    var filter = null;
    function title(item) { var t = def.summary ? def.summary(item) : ""; return t && String(t).trim() ? t : "(नवीन — माहिती भरा)"; }
    function draw() {
      items.innerHTML = "";
      var arr = peekArr();
      if (!arr.length) items.appendChild(h("p", { class: "empty" }, "अजून काहीही जोडलेले नाही."));
      arr.forEach(function (item, i) { items.appendChild(row(item, i, arr)); });
      applyFilter();
    }
    function move(i, d) { var arr = getArr(), j = i + d; if (j < 0 || j >= arr.length) return; var t = arr[i]; arr[i] = arr[j]; arr[j] = t; openItem = arr[j]; changed(); draw(); }
    function row(item, i, arr) {
      var titleEl = h("span", { class: "it-title" }, title(item));
      var thumb = def.thumb ? h("span", { class: "it-thumb" }) : null;
      function setThumb() { if (!thumb) return; thumb.innerHTML = ""; var u = assetUrl(item[def.thumb]); thumb.appendChild(u ? h("img", { src: u, alt: "" }) : ic("image")); }
      setThumb();
      var stop = function (fn) { return function (e) { e.preventDefault(); e.stopPropagation(); fn(); }; };
      var det = h("details", { class: "item", open: openItem === item });
      var body = h("div", { class: "it-body" });
      var built = false;
      function build() {
        if (built) return; built = true;
        body.appendChild(renderFields(item, def.fields, { siblings: peekArr, onChange: function () { titleEl.textContent = title(item); setThumb(); } }));
      }
      det.addEventListener("toggle", function () { if (det.open) { build(); openItem = item; } });
      if (det.open) build();
      det.appendChild(h("summary", null, h("span", { class: "it-n" }, String(i + 1)), thumb, titleEl,
        h("span", { class: "it-actions" },
          iconBtn("up", "वर हलवा", stop(function () { move(i, -1); }), i === 0 ? "dim" : ""),
          iconBtn("down", "खाली हलवा", stop(function () { move(i, 1); }), i === arr.length - 1 ? "dim" : ""),
          iconBtn("copy", "प्रत बनवा", stop(function () { var a = getArr(), c = clone(item); a.splice(i + 1, 0, c); openItem = c; changed(); draw(); })),
          iconBtn("trash", "काढा", stop(function () {
            if (!confirm("\"" + title(item) + "\" काढायचे?")) return;
            getArr().splice(i, 1); changed(); draw();
          }), "danger"))));
      det.appendChild(body);
      return det;
    }
    function applyFilter() {
      if (!filter) return;
      var q = filter.value.trim().toLowerCase();
      Array.prototype.forEach.call(items.querySelectorAll(".item"), function (d) { d.hidden = q && $(".it-title", d).textContent.toLowerCase().indexOf(q) < 0; });
    }
    var addBtn = btn(def.addLabel || "जोडा", "plus", function () {
      var arr = getArr(), it = newItem(def);
      if (def.addTop) arr.unshift(it); else arr.push(it);
      openItem = it; changed(); draw();
      var opened = items.querySelector("details[open] input, details[open] textarea");
      if (opened) opened.focus();
    }, "add");
    if (!nested && peekArr().length > 8) {
      filter = h("input", { type: "search", class: "filter", placeholder: "शोधा…", "aria-label": "यादीत शोधा", oninput: applyFilter });
      box.appendChild(h("div", { class: "list-tools" }, filter, addBtn));
    } else if (def.addTop) box.appendChild(h("div", { class: "list-tools" }, addBtn));
    box.appendChild(items);
    if (!def.addTop && !filter) box.appendChild(addBtn);
    draw();
    return box;
  }

  /* ---------- lists of plain text ---------- */
  function renderStrings(obj, f, ctx) {
    var box = h("div", { class: "strings" });
    function arr() { return Array.isArray(obj[f.k]) ? obj[f.k] : (obj[f.k] = []); }
    function draw() {
      box.innerHTML = "";
      var a = obj[f.k] || [];
      a.forEach(function (s, i) {
        var inp = f.multiline ? h("textarea", { rows: 3, "aria-label": f.label + " " + (i + 1) }) : h("input", { type: "text", placeholder: f.ph || null, "aria-label": f.label + " " + (i + 1) });
        inp.value = s;
        inp.addEventListener("input", function () { arr()[i] = inp.value; changed(); if (ctx && ctx.onChange) ctx.onChange(); });
        box.appendChild(h("div", { class: "srow" }, inp, h("span", { class: "it-actions" },
          iconBtn("up", "वर हलवा", function () { if (i > 0) { var x = arr(); x.splice(i - 1, 0, x.splice(i, 1)[0]); changed(); draw(); } }, i === 0 ? "dim" : ""),
          iconBtn("down", "खाली हलवा", function () { var x = arr(); if (i < x.length - 1) { x.splice(i + 1, 0, x.splice(i, 1)[0]); changed(); draw(); } }, i === a.length - 1 ? "dim" : ""),
          iconBtn("trash", "काढा", function () { arr().splice(i, 1); changed(); draw(); }, "danger"))));
      });
      box.appendChild(btn(f.addLabel || "जोडा", "plus", function () {
        arr().push(""); changed(); draw();
        var all = box.querySelectorAll("input, textarea"); if (all.length) all[all.length - 1].focus();
      }, "add small"));
    }
    draw();
    return box;
  }

  /* ---------- uploads ---------- */
  function slug(name) {
    var base = String(name).replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
    return base || "file";
  }
  function stamp() { var d = new Date(); return today().replace(/-/g, "") + "-" + String(d.getHours()).padStart(2, "0") + String(d.getMinutes()).padStart(2, "0") + String(d.getSeconds()).padStart(2, "0"); }

  function prepareImage(file, f) {
    if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) return Promise.resolve({ blob: file, ext: (file.name.split(".").pop() || "img").toLowerCase() });
    return createImageBitmap(file).then(function (bmp) {
      var max = f.max || 1600, scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
      var png = f.keepPng && file.type === "image/png";
      if (scale === 1 && file.size < 400 * 1024) return { blob: file, ext: png ? "png" : file.type === "image/webp" ? "webp" : "jpg" };
      var c = document.createElement("canvas");
      c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
      var g = c.getContext("2d");
      if (!png) { g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); }
      g.drawImage(bmp, 0, 0, c.width, c.height);
      return new Promise(function (res) { c.toBlob(function (b) { res(b); }, png ? "image/png" : "image/jpeg", 0.85); }).then(function (b) {
        return b && b.size < file.size ? { blob: b, ext: png ? "png" : "jpg" } : { blob: file, ext: png ? "png" : "jpg" };
      });
    });
  }
  function upload(file, kind, f) {
    var maxMb = kind === "image" ? 25 : 20;
    if (file.size > maxMb * 1024 * 1024) return Promise.reject(new Error("फाइल " + maxMb + " MB पेक्षा मोठी आहे."));
    var prep = kind === "image" ? prepareImage(file, f) : Promise.resolve({ blob: file, ext: (file.name.split(".").pop() || "pdf").toLowerCase() });
    var path;
    busy(kind === "image" ? "फोटो अपलोड होत आहे…" : "फाइल अपलोड होत आहे…");
    return prep.then(function (p) {
      path = (kind === "image" ? "images/" : "files/") + stamp() + "-" + slug(file.name) + "." + p.ext;
      localUrls[path] = URL.createObjectURL(p.blob);
      return blobToB64(p.blob);
    }).then(function (b64) {
      return putFile(S, path, b64, "Admin: upload " + path);
    }).then(function () { busy(null); toast("अपलोड झाले. माहिती जतन केल्यावर संकेतस्थळावर दिसेल.", "ok"); return path; },
      function (e) { busy(null); if (path) delete localUrls[path]; throw e; });
  }
  function pick(accept, cb) {
    var inp = h("input", { type: "file", accept: accept, hidden: true });
    inp.addEventListener("change", function () { if (inp.files[0]) cb(inp.files[0]); inp.remove(); });
    document.body.appendChild(inp); inp.click();
  }

  function imageField(f, obj, set, id) {
    var box = h("div", { class: "media" });
    function draw() {
      box.innerHTML = "";
      var v = obj[f.k], u = assetUrl(v);
      box.appendChild(h("div", { class: "media-prev" }, u ? h("img", { src: u, alt: "", onerror: function () { this.replaceWith(h("span", { class: "muted small" }, "संकेतस्थळ अद्ययावत झाल्यावर दिसेल")); } }) : ic("image")));
      var path = h("input", { id: id, type: "text", value: v || "", placeholder: "फोटो निवडा किंवा दुवा टाका", spellcheck: "false", onchange: function () { set(path.value.trim()); draw(); } });
      box.appendChild(h("div", { class: "media-side" },
        h("div", { class: "row" },
          btn(v ? "फोटो बदला" : "फोटो निवडा", "upload", function () {
            pick("image/*", function (file) { upload(file, "image", f).then(function (p) { set(p); draw(); }, function (e) { toast(ghError(e), "err"); }); });
          }, "small"),
          v ? btn("काढा", "x", function () { set(""); draw(); }, "small ghost") : null),
        path));
    }
    draw();
    return box;
  }
  function fileField(f, obj, set, id) {
    var box = h("div", { class: "media file" });
    var inp = h("input", { id: id, type: "text", value: obj[f.k] || "", placeholder: "PDF अपलोड करा किंवा दुवा टाका", spellcheck: "false", oninput: function () { set(inp.value.trim()); syncOpen(); } });
    var open = h("a", { class: "btn small ghost", target: "_blank", rel: "noopener" }, ic("ext"), h("span", null, "उघडा"));
    function syncOpen() { var u = assetUrl(obj[f.k]); open.hidden = !u; if (u) open.href = u; }
    syncOpen();
    box.appendChild(h("div", { class: "row" }, inp,
      btn("PDF अपलोड", "upload", function () {
        pick("application/pdf,.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png", function (file) {
          upload(file, "file", f).then(function (p) { inp.value = p; set(p); syncOpen(); }, function (e) { toast(ghError(e), "err"); });
        });
      }, "small"), open));
    return box;
  }

  /* ---------- menu sections ---------- */
  function renderSections(b) {
    var c = card(b.title, "विभाग चालू/बंद करा, नाव बदला किंवा क्रम बदला. ज्या विभागात माहिती नाही तो चालू असला तरी आपोआप लपतो.");
    var defs = {}; SECTION_DEFS.forEach(function (d) { defs[d[0]] = d[1]; });
    var rows = (data.sections || []).filter(function (s) { return defs[s.id]; }).map(function (s) { return { id: s.id, label: s.label, on: true }; });
    SECTION_DEFS.forEach(function (d) { if (!rows.some(function (r) { return r.id === d[0]; })) rows.push({ id: d[0], label: d[1], on: false }); });
    var list = h("div", { class: "sec-list" });
    function commit() { data.sections = rows.filter(function (r) { return r.on; }).map(function (r) { return { id: r.id, label: r.label.trim() || defs[r.id] }; }); changed(); }
    function draw() {
      list.innerHTML = "";
      rows.forEach(function (r, i) {
        var cb = h("input", { type: "checkbox", checked: r.on, "aria-label": defs[r.id] + " दाखवा", onchange: function () { r.on = cb.checked; commit(); draw(); } });
        var lab = h("input", { type: "text", value: r.label, disabled: !r.on, "aria-label": defs[r.id] + " — मेनूतील नाव", oninput: function () { r.label = lab.value; commit(); } });
        list.appendChild(h("div", { class: "sec-row" + (r.on ? "" : " off") },
          h("label", { class: "switch" }, cb, h("span", { class: "track" })),
          h("span", { class: "sec-id" }, defs[r.id]), lab,
          h("span", { class: "it-actions" },
            iconBtn("up", "वर हलवा", function () { if (i > 0) { rows.splice(i - 1, 0, rows.splice(i, 1)[0]); commit(); draw(); } }, i === 0 ? "dim" : ""),
            iconBtn("down", "खाली हलवा", function () { if (i < rows.length - 1) { rows.splice(i + 1, 0, rows.splice(i, 1)[0]); commit(); draw(); } }, i === rows.length - 1 ? "dim" : ""))));
      });
    }
    draw();
    c.appendChild(list);
    return c;
  }

  /* ---------- settings ---------- */
  function renderSettings() {
    var wrap = h("div");
    // password
    var c1 = card("पासवर्ड बदला", "नवीन पासवर्ड सर्व कर्मचाऱ्यांसाठी लागू होईल.");
    var cur = h("input", { type: "password", autocomplete: "current-password" }), n1 = h("input", { type: "password", autocomplete: "new-password" }), n2 = h("input", { type: "password", autocomplete: "new-password" });
    var e1 = errBox();
    c1.appendChild(h("form", { class: "stack narrow", onsubmit: function (e) {
      e.preventDefault(); showErr(e1, "");
      if (n1.value.length < 10) return showErr(e1, "नवीन पासवर्ड किमान १० अक्षरांचा असावा.");
      if (n1.value !== n2.value) return showErr(e1, "नवीन पासवर्ड जुळत नाहीत.");
      busy("तपासत आहे…");
      unseal(authBlob, cur.value).then(function () { return seal(S, n1.value); }, function () { throw new Error("सध्याचा पासवर्ड चुकीचा आहे."); })
        .then(function (blob) { busy("जतन करत आहे…"); return saveAuth(S, blob); })
        .then(function () { busy(null); cur.value = n1.value = n2.value = ""; toast("पासवर्ड बदलला.", "ok"); })
        .catch(function (err) { busy(null); showErr(e1, ghError(err)); });
    } }, field("सध्याचा पासवर्ड", cur), h("div", { class: "grid2" }, field("नवीन पासवर्ड", n1), field("नवीन पासवर्ड पुन्हा", n2)), e1, h("button", { type: "submit", class: "btn primary" }, "पासवर्ड बदला")));
    wrap.appendChild(c1);

    // token
    var c2 = card("GitHub ॲक्सेस की बदला", "की कालबाह्य झाल्यास किंवा नवीन की बनवल्यास येथे टाका.");
    var tk = h("input", { type: "password", autocomplete: "off", spellcheck: "false", placeholder: "github_pat_…" }), cur2 = h("input", { type: "password", autocomplete: "current-password" });
    var e2 = errBox();
    c2.appendChild(h("form", { class: "stack narrow", onsubmit: function (e) {
      e.preventDefault(); showErr(e2, "");
      var next = Object.assign({}, S, { token: tk.value.trim() });
      if (!next.token) return showErr(e2, "नवीन की टाका.");
      busy("तपासत आहे…");
      unseal(authBlob, cur2.value).catch(function () { throw new Error("पासवर्ड चुकीचा आहे."); })
        .then(function () { return verifyAccess(next); })
        .then(function () { return seal(next, cur2.value); })
        .then(function (blob) { busy("जतन करत आहे…"); return saveAuth(next, blob); })
        .then(function () { busy(null); S = next; tk.value = cur2.value = ""; toast("GitHub की बदलली.", "ok"); })
        .catch(function (err) { busy(null); showErr(e2, ghError(err)); });
    } }, field("नवीन GitHub की", tk), field("ॲडमिन पासवर्ड", cur2), e2, h("button", { type: "submit", class: "btn primary" }, "की बदला")));
    wrap.appendChild(c2);

    // info
    var c3 = card("माहिती");
    c3.appendChild(h("dl", { class: "info" },
      h("dt", null, "रेपॉजिटरी"), h("dd", null, h("a", { href: "https://github.com/" + S.owner + "/" + S.repo, target: "_blank", rel: "noopener" }, S.owner + "/" + S.repo)),
      h("dt", null, "ब्रँच"), h("dd", null, S.branch + (S.dir ? " · " + S.dir : "")),
      h("dt", null, "बदलांचा इतिहास"), h("dd", null, h("a", { href: "https://github.com/" + S.owner + "/" + S.repo + "/commits/" + S.branch, target: "_blank", rel: "noopener" }, "GitHub वर पाहा"))));
    c3.appendChild(h("p", { class: "muted small" }, "३० मिनिटे काहीही न केल्यास पॅनेल आपोआप लॉक होते. जतन न केलेले बदल या संगणकावर सुरक्षित राहतात."));
    c3.appendChild(btn("लॉग आउट", "lock", logout, ""));
    wrap.appendChild(c3);
    return wrap;
  }

  /* ---------- save / discard / preview ---------- */
  function validate() {
    if (!data.site || !String(data.site.name || "").trim()) return { page: "basic", msg: "ग्रामपंचायतीचे नाव रिकामे आहे." };
    var cid = String((data.renewal || {}).customerId || "");
    if (cid && !/^[A-Za-z0-9_-]{1,64}$/.test(cid)) return { page: "settings", msg: "SitePragati Customer ID मध्ये फक्त इंग्रजी अक्षरे, आकडे, - आणि _ चालतात." };
    return null;
  }
  function save(force) {
    var bad = validate();
    if (bad) { page = bad.page; renderNav(); renderPage(); return toast(bad.msg, "err"); }
    var keys = Object.keys(data).filter(function (k) { return !same(data[k], original[k]); });
    var out = clone(data);
    out.site.lastUpdated = today();
    busy("जतन करत आहे…");
    var go = force ? fileSha(S, "config.js").then(function (s) { sha = s; }) : Promise.resolve();
    go.then(function () {
      return putFile(S, "config.js", b64FromBytes(enc.encode(serialize(out))), "Admin: update " + (keys.join(", ") || "content"), sha);
    }).then(function (r) {
      busy(null);
      sha = r.content.sha; data.site.lastUpdated = out.site.lastUpdated; original = clone(data);
      store(draftKey(), null); clearTimeout(draftTimer);
      renderBar(); renderNav();
      toast("जतन झाले. संकेतस्थळ १–२ मिनिटांत अद्ययावत होईल.", "ok");
    }).catch(function (e) {
      busy(null);
      if ((e.status === 409 || e.status === 422) && !force) {
        if (confirm("तुम्ही पॅनेल उघडल्यानंतर संकेतस्थळाची माहिती दुसरीकडून बदलली गेली आहे.\n\n\"OK\" दाबल्यास तुमचे बदल जतन होतील आणि ते दुसरे बदल बदलले जातील.\n\"Cancel\" दाबल्यास काहीही जतन होणार नाही (तुमचे बदल या संगणकावर राहतील).")) save(true);
        return;
      }
      toast("जतन झाले नाही: " + ghError(e), "err");
    });
  }
  function discard() {
    if (!confirm("सर्व जतन न केलेले बदल रद्द करायचे?")) return;
    data = clone(original); store(draftKey(), null); openItem = null;
    renderBar(); renderNav(); renderPage();
  }

  var PREVIEW_HTML = '<!doctype html><html lang="mr"><head><meta charset="utf-8"><base href="{BASE}"><meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Eczar:wght@500;600;700&family=Hind:wght@400;500;600;700&display=swap">' +
    '<link rel="stylesheet" href="assets/style.css"></head><body><div id="app"></div><script>window.GP_CONFIG={CFG};' +
    // <base> मुळे #विभाग दुवे खरे संकेतस्थळ उघडतात; पूर्वावलोकनात त्याच पानावर स्क्रोल करा
    'document.addEventListener("click",function(e){var a=e.target.closest("a[href^=\'#\']");if(!a)return;e.preventDefault();var t=document.getElementById(a.getAttribute("href").slice(1));if(t)t.scrollIntoView();});' +
    '<\/script><script src="assets/app.js"><\/script></body></html>';
  function preview() {
    var cfg = clone(data);
    (function swap(o) {
      Object.keys(o).forEach(function (k) {
        var v = o[k];
        if (typeof v === "string" && localUrls[v]) o[k] = localUrls[v];
        else if (v && typeof v === "object") swap(v);
      });
    })(cfg);
    var html = PREVIEW_HTML.replace("{BASE}", new URL("../", location.href).href).replace("{CFG}", function () { return JSON.stringify(cfg).replace(/</g, "\\u003c"); });
    var frame = h("iframe", { title: "पूर्वावलोकन", sandbox: "allow-scripts allow-same-origin allow-popups" });
    frame.srcdoc = html;
    var stage = h("div", { class: "pv-stage" }, frame);
    var dlg = h("dialog", { class: "preview" },
      h("div", { class: "pv-bar" }, h("b", null, "पूर्वावलोकन — अजून जतन केलेले नाही"),
        h("span", { class: "row" },
          btn("डेस्कटॉप", "monitor", function () { stage.classList.remove("mobile"); }, "small ghost"),
          btn("मोबाईल", "phone", function () { stage.classList.add("mobile"); }, "small ghost"),
          btn("बंद करा", "x", function () { dlg.close(); }, "small"))),
      stage);
    dlg.addEventListener("close", function () { dlg.remove(); });
    document.body.appendChild(dlg);
    dlg.showModal();
  }

  /* ---------- auto lock ---------- */
  var lastActive = Date.now(), lockTimer = null, LOCK_MS = 30 * 60 * 1000;
  ["pointerdown", "keydown", "scroll"].forEach(function (ev) { window.addEventListener(ev, function () { lastActive = Date.now(); }, { passive: true, capture: true }); });
  function lockTimerStart() {
    clearInterval(lockTimer);
    lockTimer = setInterval(function () { if (S && Date.now() - lastActive > LOCK_MS) { logout(true); toast("बराच वेळ काहीही न केल्याने पॅनेल लॉक झाले.", "err"); } }, 30000);
  }
  function logout(auto) {
    if (isDirty()) store(draftKey(), JSON.stringify({ sha: sha, ts: Date.now(), data: data }));
    else if (auto !== true && !confirm("लॉग आउट करायचे?")) return;
    clearInterval(lockTimer);
    var d = document.querySelector("dialog.preview"); if (d) d.close();
    statusEl = null; showLogin();
  }

  window.addEventListener("beforeunload", function (e) { if (S && isDirty()) { e.preventDefault(); e.returnValue = ""; } });

  /* ================= boot ================= */
  if (!window.crypto || !crypto.subtle) {
    authCard("हा ब्राउझर चालणार नाही", "ॲडमिन पॅनेल सुरक्षित (https) पत्त्यावरून आणि अद्ययावत Chrome, Edge किंवा Firefox मध्ये उघडा.");
    return;
  }
  loadAuth().then(function (blob) {
    authBlob = blob;
    if (blob) showLogin(); else showSetup(false);
  });
})();
