(function () {
  "use strict";
  if (document.getElementById("sp-iphone-quote-modal")) return;

  var QUOTE_URL = "https://vps-8066c206.vps.ovh.net/api/public/quote-request";
  var h1 = document.querySelector("main h1");
  var defaultSubject = h1
    ? h1.textContent.replace(/\s+à\s+Mâcon.*$/i, "").trim()
    : "Réparation iPhone";

  var style = document.createElement("style");
  style.textContent =
    ".sp-iqm-backdrop{position:fixed;inset:0;z-index:2147483100;background:rgba(13,13,13,.66);backdrop-filter:blur(8px);display:none;align-items:center;justify-content:center;padding:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}" +
    ".sp-iqm-backdrop.open{display:flex}" +
    ".sp-iqm-card{width:min(460px,100%);max-height:calc(100vh - 32px);overflow-y:auto;background:#fff;color:#171719;border-radius:20px;box-shadow:0 28px 70px rgba(0,0,0,.32);padding:22px;position:relative}" +
    ".sp-iqm-close{position:absolute;top:14px;right:14px;width:34px;height:34px;border:0;border-radius:50%;background:#f2f2f5;color:#171719;font-size:18px;cursor:pointer}" +
    ".sp-iqm-kicker{display:block;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#e10600;margin-bottom:4px}" +
    ".sp-iqm-card h2{margin:0 0 6px;font-size:21px;line-height:1.15;letter-spacing:-.02em}" +
    ".sp-iqm-sub{margin:0 0 14px;font-size:13px;color:#555;line-height:1.45}" +
    ".sp-iqm-form{display:grid;gap:10px}" +
    ".sp-iqm-form label{display:grid;gap:4px;font-size:12.5px;font-weight:700;color:#1d1d1f}" +
    ".sp-iqm-form input,.sp-iqm-form textarea{width:100%;box-sizing:border-box;border:1px solid #ccc;border-radius:10px;padding:10px 12px;font:500 15px/1.35 inherit;color:#111;background:#fff}" +
    ".sp-iqm-form textarea{min-height:76px;resize:vertical}" +
    ".sp-iqm-hp{position:absolute!important;left:-9999px!important;width:1px!important;height:1px!important;overflow:hidden}" +
    ".sp-iqm-submit{margin-top:4px;border:0;border-radius:12px;background:#e10600;color:#fff;padding:13px 16px;font-size:15px;font-weight:800;cursor:pointer}" +
    ".sp-iqm-submit:disabled{opacity:.6;cursor:wait}" +
    ".sp-iqm-status{margin:8px 0 0;font-size:13px;line-height:1.45;padding:10px 12px;border-radius:10px;display:none}" +
    ".sp-iqm-status.ok{display:block;background:#ecfdf5;color:#065f46;border:1px solid #34d399;font-weight:650}" +
    ".sp-iqm-status.err{display:block;background:#fef2f2;color:#b91c1c;border:1px solid #fca5a5;font-weight:650}" +
    ".sp-iqm-rgpd{margin:8px 0 0;font-size:11px;color:#6e6e73;line-height:1.45}" +
    ".sp-iqm-rgpd a{color:inherit;text-decoration:underline}";
  document.head.appendChild(style);

  var wrap = document.createElement("div");
  wrap.id = "sp-iphone-quote-modal";
  wrap.className = "sp-iqm-backdrop";
  wrap.setAttribute("role", "dialog");
  wrap.setAttribute("aria-modal", "true");
  wrap.setAttribute("aria-labelledby", "sp-iqm-title");
  wrap.innerHTML =
    '<div class="sp-iqm-card">' +
    '<button type="button" class="sp-iqm-close" aria-label="Fermer">×</button>' +
    '<span class="sp-iqm-kicker">Devis gratuit · Solution Phone Mâcon</span>' +
    '<h2 id="sp-iqm-title">Recevoir mon tarif par e-mail</h2>' +
    '<p class="sp-iqm-sub">Réponse directe de l’équipe au 21 rue Gambetta (25 € déjà déduits, garantie 6 mois).</p>' +
    '<form class="sp-iqm-form">' +
    '<label>Votre prénom ou nom *<input name="name" autocomplete="name" required placeholder="Votre nom"></label>' +
    '<label>Votre e-mail *<input name="email" type="email" autocomplete="email" required placeholder="vous@exemple.fr"></label>' +
    '<label>Téléphone (facultatif)<input name="phone" type="tel" autocomplete="tel" placeholder="06 12 34 56 78"></label>' +
    '<label>Modèle & panne *<textarea name="request" required></textarea></label>' +
    '<input name="website" tabindex="-1" autocomplete="off" aria-hidden="true" class="sp-iqm-hp">' +
    '<button type="submit" class="sp-iqm-submit">Envoyer ma demande</button>' +
    "</form>" +
    '<p class="sp-iqm-status" role="status" aria-live="polite"></p>' +
    '<p class="sp-iqm-rgpd">Données utilisées uniquement pour répondre à votre devis · <a href="https://solution-phone.fr/politique-confidentialite.html">Confidentialité</a>.</p>' +
    "</div>";
  document.body.appendChild(wrap);

  var form = wrap.querySelector("form");
  var statusEl = wrap.querySelector(".sp-iqm-status");
  var submitBtn = wrap.querySelector(".sp-iqm-submit");
  var reqField = form.elements.request;
  var lastTrigger = null;

  function openModal(prefill, trigger) {
    lastTrigger = trigger || document.activeElement;
    statusEl.className = "sp-iqm-status";
    statusEl.textContent = "";
    submitBtn.disabled = false;
    submitBtn.textContent = "Envoyer ma demande";
    if (!reqField.value.trim() || prefill) {
      reqField.value = prefill || defaultSubject + " — écran / batterie (merci de m’indiquer la disponibilité et le tarif).";
    }
    wrap.classList.add("open");
    setTimeout(function () {
      form.elements.name.focus();
    }, 50);
  }

  function closeModal() {
    if (!wrap.classList.contains("open")) return;
    wrap.classList.remove("open");
    if (lastTrigger && typeof lastTrigger.focus === "function") lastTrigger.focus();
  }

  wrap.querySelector(".sp-iqm-close").addEventListener("click", closeModal);
  wrap.addEventListener("click", function (e) {
    if (e.target === wrap) closeModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeModal();
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var payload = {
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      phone: form.elements.phone.value.trim(),
      request: reqField.value.trim(),
      form_type: "main_quote",
      page: location.pathname,
      website: form.elements.website.value || "",
    };
    if (!payload.name || !payload.email || !payload.request) return;
    submitBtn.disabled = true;
    submitBtn.textContent = "Envoi en cours…";
    statusEl.className = "sp-iqm-status";
    statusEl.textContent = "";

    var slugSlot =
      "/iphone" +
      location.pathname.toLowerCase().replace(/[^a-z0-9_/-]/g, "_") +
      "/modal";

    var sendDirect = function (bodyObj) {
      return fetch(QUOTE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyObj),
      }).then(function (r) {
        return r
          .json()
          .catch(function () {
            return null;
          })
          .then(function (receipt) {
            if (!r.ok || !receipt || receipt.received !== true) {
              var err = new Error((receipt && receipt.error) || "quote_failed");
              err.status = r.status;
              throw err;
            }
            return receipt;
          });
      });
    };

    var promise = window.SolutionPhoneQuoteAttempts
      ? window.SolutionPhoneQuoteAttempts.open().submit({
          slot: slugSlot,
          defaultReceiver: "v2",
          payload: payload,
          send: function (attempt) {
            return sendDirect(
              Object.assign({}, attempt.payload, { client_token: attempt.clientToken }),
            );
          },
        })
      : sendDirect(
          Object.assign({}, payload, {
            client_token:
              window.crypto && crypto.randomUUID
                ? crypto.randomUUID()
                : undefined,
          }),
        );

    promise
      .then(function (receipt) {
        submitBtn.textContent = "✓ Demande envoyée";
        statusEl.className = "sp-iqm-status ok";
        statusEl.textContent =
          "Demande enregistrée (" +
          receipt.reference +
          "). Un récapitulatif vient de vous être envoyé par e-mail et l’équipe vous répond très vite.";
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: "devis_email_envoye",
          source: "iphone_model_modal",
          reference: receipt.reference,
          page: location.pathname,
        });
      })
      .catch(function (err) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Envoyer ma demande";
        statusEl.className = "sp-iqm-status err";
        statusEl.textContent =
          err && err.status === 429
            ? "Plusieurs demandes ont été envoyées récemment. Utilisez WhatsApp (07 83 92 18 84) ou appelez le 03 85 33 06 89."
            : "Envoi non confirmé. Vous pouvez nous écrire sur WhatsApp au 07 83 92 18 84 ou appeler le 03 85 33 06 89.";
      });
  });

  document.querySelectorAll('.dock a[href*="email=1"], [data-open-iphone-quote]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      var custom = link.getAttribute("data-quote-prefill") || "";
      openModal(custom, link);
    });
  });

  window.SolutionPhoneOpenIphoneQuoteModal = openModal;
})();
