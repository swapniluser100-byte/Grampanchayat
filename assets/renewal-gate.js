/*
 * संकेतस्थळ नूतनीकरण तपासणी (SitePragati renewal gate)
 * --------------------------------------------------
 * SitePragati वरील ग्राहक नोंद तपासते. देय दिनांक उलटून गेल्यास सार्वजनिक संकेतस्थळ आणि ॲडमिन पॅनेल
 * (data-mode="admin") दोन्हीवर रक्कम, UPI QR, UPI ID आणि "भरणा केला — पुन्हा तपासा" बटण असलेली पूर्ण-स्क्रीन सूचना दिसते.
 * देय दिनांकापूर्वी REMIND_DAYS दिवस फक्त ॲडमिन पॅनेलमध्ये आठवण पट्टी दिसते.
 *
 * Fails open: नेटवर्क त्रुटी, /api/renewal-status नसणे (उदा. GitHub Pages किंवा स्थानिक चाचणी),
 * किंवा चुकीचा/रिकामा दिनांक असल्यास संकेतस्थळ नेहमीप्रमाणे चालते.
 * API: functions/api/renewal-status.js (Cloudflare Pages Function) मार्फत, कारण SitePragati API CORS हेडर पाठवत नाही.
 *
 * Customer ID: config.js मधील renewal.customerId (ॲडमिन पॅनेल → सेटिंग्ज). रिकामा असल्यास तपासणी बंद राहते.
 */
(function () {
  "use strict";
  var CUSTOMER_ID = String(((window.GP_CONFIG || {}).renewal || {}).customerId || "").trim();
  var SUPPORT_EMAIL = "support@sitepragati.in";
  var REMIND_DAYS = 7;

  var script = document.currentScript;
  var MODE = (script && script.getAttribute("data-mode")) === "admin" ? "admin" : "site";
  var API = new URL("../api/renewal-status", script ? script.src : location.href).href;
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(CUSTOMER_ID)) return;

  /* ---------------- data ---------------- */
  var MONTHS = ["जानेवारी", "फेब्रुवारी", "मार्च", "एप्रिल", "मे", "जून", "जुलै", "ऑगस्ट", "सप्टेंबर", "ऑक्टोबर", "नोव्हेंबर", "डिसेंबर"];
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  // पूर्ण दिवस भरलेला मानला जातो: देय दिनांकाच्या रात्री २३:५९ नंतर लॉक. "2026-08-02" किंवा "2026-08-02T00:00:00Z" दोन्ही चालतात.
  function dueOf(info) {
    var m = String((info && info.next_payment_due_date) || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? new Date(+m[1], +m[2] - 1, +m[3], 23, 59, 59) : null;
  }
  function amountOf(info) {
    var a = info && info.next_payment_due_amount;
    var n = typeof a === "number" ? a : typeof a === "string" && a.trim() ? Number(a.replace(/[₹,\s]/g, "")) : NaN;
    return isFinite(n) && n > 0 ? n : null;
  }
  function fmtDate(d) { return d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear(); }
  function fmtAmount(n) { return "₹" + n.toLocaleString("en-IN"); }
  function upiLink(info, amount) {
    var vpa = String((info && info.upi_id) || "").trim();
    if (!vpa) return "";
    var payee = String(info.business_name || "SitePragati").trim();
    return "upi://pay?pa=" + encodeURIComponent(vpa) + "&pn=" + encodeURIComponent(payee) + (amount ? "&am=" + amount : "") + "&cu=INR";
  }
  function qrUrl(link) { return "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=" + encodeURIComponent(link); }
  function fetchInfo() {
    return fetch(API + "?customerId=" + encodeURIComponent(CUSTOMER_ID), { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { return d && d.ok ? d.info : null; });
  }

  /* ---------------- UI ---------------- */
  var CSS = ".rg-ov{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:20px;overflow:auto;background:#f3f6f4;font-family:Mukta,'Noto Sans Devanagari',system-ui,sans-serif;color:#15211c;line-height:1.55}" +
    ".rg-ov.rg-dim{background:rgb(10 20 16/.55)}" +
    ".rg-card{position:relative;max-width:420px;width:100%;background:#fff;border:1px solid #d6e0da;border-radius:14px;box-shadow:0 8px 30px rgb(20 40 30/.12);padding:30px 26px;text-align:center}" +
    ".rg-card h1{font-family:'Tiro Devanagari Marathi',Georgia,serif;font-weight:400;font-size:1.5rem;line-height:1.3;margin:0 0 10px}" +
    ".rg-card p{margin:0 0 16px;color:#56665f}.rg-amt{font-size:1.3rem;font-weight:700;color:#15211c!important}" +
    ".rg-card img{display:block;margin:0 auto 16px;width:200px;height:200px;border:1px solid #d6e0da;border-radius:8px}" +
    ".rg-card a{color:#0f5a46;font-weight:600}.rg-small{font-size:.9rem}.rg-vpa{color:#15211c;overflow-wrap:anywhere;user-select:all}" +
    // "UPI ॲपने भरा" फक्त टच (मोबाईल) उपकरणांवर — डेस्कटॉपवर upi:// दुवा उघडत नाही
    ".rg-card a.rg-upi{display:none;margin:0 0 16px;color:#fff;background:#c27a0e;text-decoration:none}@media (pointer:coarse){.rg-card a.rg-upi{display:inline-flex}}" +
    ".rg-btn{display:inline-flex;align-items:center;justify-content:center;width:100%;min-height:46px;padding:10px 18px;border:0;border-radius:999px;background:#0f5a46;color:#fff;font:inherit;font-weight:600;cursor:pointer}" +
    ".rg-btn:disabled{opacity:.6;cursor:wait}.rg-msg{margin:12px 0 0!important;font-size:.9rem;color:#9a5c00!important;font-weight:600}" +
    ".rg-x{position:absolute;top:8px;right:8px;width:36px;height:36px;border:0;border-radius:8px;background:transparent;font-size:22px;line-height:1;color:#56665f;cursor:pointer}" +
    ".rg-bar{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:2147483000;display:flex;align-items:center;gap:12px;flex-wrap:wrap;max-width:calc(100vw - 32px);padding:10px 12px 10px 16px;border-radius:12px;background:#fff3d6;color:#5c3a00;box-shadow:0 8px 30px rgb(0 0 0/.18);font-family:Mukta,system-ui,sans-serif;font-weight:500}" +
    ".rg-bar button{border:0;border-radius:8px;padding:6px 12px;font:inherit;font-weight:600;cursor:pointer}.rg-bar .rg-pay{background:#5c3a00;color:#fff}.rg-bar .rg-close{background:transparent;color:#5c3a00}";
  function styles() {
    if (document.getElementById("rg-css")) return;
    var s = document.createElement("style"); s.id = "rg-css"; s.textContent = CSS; document.head.appendChild(s);
  }

  // मागील सर्व मजकूर कीबोर्ड/स्क्रीनरीडरसाठी बंद करा
  function setInert(on, except) {
    Array.prototype.forEach.call(document.body.children, function (el) {
      if (el === except || el.tagName === "SCRIPT" || el.tagName === "STYLE") return;
      if (on) el.setAttribute("inert", ""); else el.removeAttribute("inert");
    });
    document.documentElement.style.overflow = on ? "hidden" : "";
  }

  function payCard(info, due, amount, closable) {
    var overdue = Date.now() > due.getTime(), link = upiLink(info, amount);
    return '<div class="rg-card" role="document">' + (closable ? '<button class="rg-x" type="button" data-rg="close" aria-label="बंद करा">×</button>' : "") +
      "<h1>" + (overdue ? "संकेतस्थळ नूतनीकरण प्रलंबित" : "संकेतस्थळ नूतनीकरण लवकरच") + "</h1>" +
      "<p>" + (overdue ? "नूतनीकरण देय दिनांक " + esc(fmtDate(due)) + " उलटून गेल्याने संकेतस्थळ नागरिकांसाठी तात्पुरते बंद आहे. भरणा झाल्यावर ते लगेच पुन्हा सुरू होईल."
        : "नूतनीकरण देय दिनांक: " + esc(fmtDate(due)) + ". त्यानंतर संकेतस्थळ नागरिकांसाठी तात्पुरते बंद होईल.") + "</p>" +
      (amount ? '<p class="rg-amt">' + esc(fmtAmount(amount)) + " देय</p>" : "") +
      // QR प्रतिमा ब्लॉक झाल्यास (ॲड ब्लॉकर/फायरवॉल) ती लपते; UPI ID आणि मोबाईलवरील "UPI ॲपने भरा" दुवा तरीही दिसतात
      (link ? '<img src="' + esc(qrUrl(link)) + '" alt="UPI ने भरणा करण्यासाठी स्कॅन करा" width="200" height="200" onerror="this.remove()">' +
        '<p class="rg-small">UPI ID: <b class="rg-vpa">' + esc(info.upi_id) + "</b></p>" +
        '<a class="rg-btn rg-upi" href="' + esc(link) + '">UPI ॲपने भरा</a>' : "") +
      '<p class="rg-small">भरणा केल्यावर स्क्रीनशॉट <a href="mailto:' + esc(SUPPORT_EMAIL) + '">' + esc(SUPPORT_EMAIL) + "</a> वर ई-मेल करा.</p>" +
      '<button class="rg-btn" type="button" data-rg="recheck">भरणा केला — पुन्हा तपासा</button><p class="rg-msg" role="status" hidden></p></div>';
  }

  function overlay(html, opts) {
    styles();
    var old = document.getElementById("rg-overlay"); if (old) old.remove();
    var ov = document.createElement("div");
    ov.id = "rg-overlay"; ov.className = "rg-ov" + (opts.dim ? " rg-dim" : "");
    ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-label", "संकेतस्थळ नूतनीकरण");
    ov.innerHTML = html;
    document.body.appendChild(ov);
    setInert(true, ov);
    function close() { ov.remove(); setInert(false); }
    ov.addEventListener("click", function (e) {
      var act = e.target.closest("[data-rg]"); act = act && act.getAttribute("data-rg");
      if (act === "close" || (opts.closable && e.target === ov)) close();
      if (act === "recheck") recheck(e.target.closest(".rg-btn"), close);
    });
    if (opts.closable) ov.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    var focus = ov.querySelector("button"); if (focus) focus.focus();
    return ov;
  }

  function recheck(btn, close) {
    var msg = btn.parentNode.querySelector(".rg-msg"), label = btn.textContent;
    btn.disabled = true; btn.textContent = "तपासत आहे…"; msg.hidden = true;
    fetchInfo().then(function (info) {
      var due = dueOf(info);
      if (info && due && Date.now() <= due.getTime()) {
        close();
        var bar = document.getElementById("rg-bar"); if (bar) bar.remove();
        return;
      }
      throw new Error("still due");
    }).catch(function () {
      btn.disabled = false; btn.textContent = label;
      msg.textContent = "अजून भरणा नोंदलेला दिसत नाही. भरणा नोंदवायला थोडा वेळ लागू शकतो — स्क्रीनशॉट ई-मेल केला असल्यास थोड्या वेळाने पुन्हा तपासा.";
      msg.hidden = false;
    });
  }

  function reminderBar(info, due, amount) {
    var key = "rg-remind-" + due.toISOString().slice(0, 10);
    try { if (sessionStorage.getItem(key)) return; } catch (e) { /* storage off: show every time */ }
    styles();
    var days = Math.max(0, Math.ceil((due.getTime() - Date.now()) / 86400000));
    var bar = document.createElement("div");
    bar.id = "rg-bar"; bar.className = "rg-bar"; bar.setAttribute("role", "status");
    bar.innerHTML = "<span>संकेतस्थळ नूतनीकरण " + (days <= 0 ? "आज" : days + " दिवसांत") + " देय (" + esc(fmtDate(due)) + ")" + (amount ? " — " + esc(fmtAmount(amount)) : "") + "</span>" +
      '<button class="rg-pay" type="button">भरणा तपशील</button><button class="rg-close" type="button" aria-label="आठवण बंद करा">नंतर</button>';
    bar.querySelector(".rg-pay").onclick = function () { overlay(payCard(info, due, amount, true), { closable: true, dim: true }); };
    bar.querySelector(".rg-close").onclick = function () { try { sessionStorage.setItem(key, "1"); } catch (e) { /* ignore */ } bar.remove(); };
    document.body.appendChild(bar);
  }

  /* ---------------- run ---------------- */
  function run() {
    fetchInfo().then(function (info) {
      var due = dueOf(info);
      if (!info || !due) return;
      var amount = amountOf(info);
      if (Date.now() > due.getTime()) {
        overlay(payCard(info, due, amount, false), { closable: false });
      } else if (MODE === "admin" && due.getTime() - Date.now() <= REMIND_DAYS * 86400000) {
        reminderBar(info, due, amount);
      }
    }).catch(function () { /* fail open — never block the site on a network error */ });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run); else run();
})();
