(function () {
  if (document.querySelector(".evan-widget") || document.querySelector(".sp-sebastien-mini")) {
    return;
  }

  var path = location.pathname;
  var page = path.split("/").filter(Boolean).pop() || "";

  function selectedHeroModel() {
    var select = document.getElementById("hero-model");
    var val = select && select.value ? String(select.value).trim() : "";
    if (!val || val.toLowerCase() === "choisir") return "";
    return /^iphone/i.test(val) ? val : "iPhone " + val;
  }

  function detectPageModel() {
    var hero = selectedHeroModel();
    if (hero) return hero;
    if (/^iphone-/.test(page)) {
      var h1 = document.querySelector("main h1");
      if (h1) {
        var m = h1.textContent.replace(/^Réparation\s+/i, "").replace(/\s+à\s+Mâcon.*$/i, "").trim();
        if (m) return m;
      }
    }
    return "";
  }

  var repairContexts = {
    "ecran.html": {
      label: "Écran iPhone Mâcon",
      title: "Quel modèle d’iPhone a l’écran cassé ?",
      items: [
        "Quel est le tarif écran pour mon modèle d’iPhone ?",
        "Quelle différence entre Compatible, Soft OLED et ReLife ?",
        "Où en est mon iPhone déposé à l’atelier ?",
      ],
    },
    "batterie.html": {
      label: "Batterie iPhone Mâcon",
      title: "Une batterie d’iPhone à remplacer ?",
      items: [
        "Quel est le tarif batterie pour mon modèle d’iPhone ?",
        "Combien de temps dure le remplacement sans rendez-vous ?",
        "Où en est ma réparation en cours à l’atelier ?",
      ],
    },
    "connecteur-charge.html": {
      label: "Charge & connecteur iPhone",
      title: "Votre iPhone charge mal ou plus du tout ?",
      items: [
        "Un simple nettoyage à 10 € peut-il suffire ?",
        "Quel tarif pour remplacer le port Lightning ou USB-C ?",
        "Où en est mon iPhone déposé à l’atelier ?",
      ],
    },
    "face-id.html": {
      label: "Diagnostic Face ID",
      title: "Face ID indisponible sur votre iPhone ?",
      items: [
        "Est-ce réparable après une chute ou de l’humidité ?",
        "Comment fonctionne le diagnostic gratuit en boutique ?",
        "Où en est ma réparation en cours ?",
      ],
    },
    "vitre-arriere.html": {
      label: "Vitre arrière iPhone",
      title: "Dos en verre fissuré sur votre iPhone ?",
      items: [
        "Quel est le tarif vitre arrière selon mon modèle d’iPhone ?",
        "La recharge MagSafe est-elle conservée après réparation ?",
        "Où en est mon iPhone déposé à l’atelier ?",
      ],
    },
    "desoxydation.html": {
      label: "iPhone tombé dans l’eau",
      title: "Votre iPhone a pris l’eau ?",
      items: [
        "Que faire tout de suite avant de venir au 21 rue Gambetta ?",
        "Comment se passe la désoxydation en atelier ?",
        "Peut-on récupérer mes photos et données ?",
      ],
    },
    "qualirepar.html": {
      label: "Label QualiRépar −25 €",
      title: "Une question sur les 25 € déjà déduits ?",
      items: [
        "Comment fonctionnent les 25 € déjà déduits sur nos tarifs ?",
        "Y a-t-il un dossier à remplir de mon côté ?",
        "Obtenir le tarif exact pour mon modèle d’iPhone",
      ],
    },
  };

  var pageModel = detectPageModel();
  var ctx = repairContexts[page] || (pageModel
    ? {
        label: pageModel + " · Mâcon",
        title: "Une question sur votre " + pageModel + " ?",
        items: [
          "Quel est le tarif écran et batterie pour " + pageModel + " ?",
          "La pièce pour " + pageModel + " est-elle disponible aujourd’hui ?",
          "Où en est ma réparation en cours à l’atelier ?",
        ],
      }
    : {
        label: "Atelier iPhone Mâcon",
        title: "Modèle, panne, photo ou suivi en direct",
        items: [
          "Obtenir le tarif écran ou batterie de mon iPhone",
          "Où en est mon iPhone déposé en réparation ?",
          "Voir les iPhone reconditionnés garantis 12 mois en vitrine",
        ],
      });

  var css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "/jason-widget.css?v=4";
  document.head.appendChild(css);

  var brainUrl = "https://vps-8066c206.vps.ovh.net/api/public/jason-brain";
  var tokenKey = "jason_iphone_conversation_token";
  var historyKey = "jason_iphone_conversation_history_v4";
  var metricToken = "";
  var history = [];
  var pendingImageDataUrl = null;

  try {
    metricToken = sessionStorage.getItem(tokenKey) || "";
    var rawHist = sessionStorage.getItem(historyKey);
    if (rawHist) {
      var parsedHist = JSON.parse(rawHist);
      if (Array.isArray(parsedHist)) history = parsedHist.slice(-8);
    }
  } catch (e) {}

  var metricOpened = false;
  var pollTimer = null;
  var pollCount = 0;
  var metricPage = /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
    ? "/audit-local/iphone/" + path.replace(/^\/+/, "")
    : "/reparation-iphone-macon" + (path === "/" ? "/index.html" : path);

  function saveState() {
    try {
      if (metricToken) sessionStorage.setItem(tokenKey, metricToken);
      sessionStorage.setItem(historyKey, JSON.stringify(history.slice(-8)));
    } catch (e) {}
  }

  function trackMetric(event, metadata) {
    return fetch(brainUrl, {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: event,
        conversation_token: metricToken || undefined,
        event_metadata: metadata || {},
        context: { page: metricPage, consent_to_store: false },
      }),
    })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (data) {
        if (data && data.conversation_token) {
          metricToken = data.conversation_token;
          saveState();
        }
      })
      .catch(function () {});
  }

  function ensureMetricOpened() {
    if (!metricOpened) {
      metricOpened = true;
      trackMetric("assistant_opened", { source: "iphone_site_widget", page: page || "home" });
    }
  }

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c];
    });
  }

  function formatRichHtml(text) {
    var safe = escapeHtml(text);
    safe = safe.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    var paragraphs = safe.split(/\n{2,}/);
    return paragraphs
      .map(function (block) {
        return "<p>" + block.replace(/\n/g, "<br>") + "</p>";
      })
      .join("");
  }

  function compressImageFile(file, callback) {
    if (!file || !/^image\//i.test(file.type)) return;
    var reader = new FileReader();
    reader.onload = function (ev) {
      var img = new Image();
      img.onload = function () {
        var maxSide = 1080;
        var w = img.width;
        var h = img.height;
        if (w > maxSide || h > maxSide) {
          if (w >= h) {
            h = Math.round((h * maxSide) / w);
            w = maxSide;
          } else {
            w = Math.round((w * maxSide) / h);
            h = maxSide;
          }
        }
        var canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        var ctx2d = canvas.getContext("2d");
        ctx2d.drawImage(img, 0, 0, w, h);
        var dataUrl = canvas.toDataURL("image/jpeg", 0.76);
        if (dataUrl.length > 540000) {
          dataUrl = canvas.toDataURL("image/jpeg", 0.58);
        }
        callback(dataUrl);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  var directWaUrl =
    "https://wa.me/33783921884?text=" +
    encodeURIComponent(
      "Bonjour Solution Phone, je viens de la page « " +
        ctx.label +
        " » sur reparation-iphone-macon.fr : ",
    );
  var directMailUrl =
    "mailto:contact@solution-phone.fr?subject=" +
    encodeURIComponent("Devis iPhone — " + ctx.label) +
    "&body=" +
    encodeURIComponent(
      "Bonjour Solution Phone,\n\nMon modèle d’iPhone : " +
        (pageModel || "") +
        "\nMa panne : \nMon téléphone : \n\nMerci.",
    );

  var root = document.createElement("aside");
  root.className = "evan-widget";
  root.setAttribute("aria-label", "L’assistant de Sébastien — Solution Phone");
  root.innerHTML =
    '<input type="file" class="sp-jason-file-input" accept="image/*" hidden>' +
    '<div class="evan-widget-panel">' +
    '<div class="evan-widget-head">' +
    '<span class="evan-widget-avatar" aria-hidden="true"></span>' +
    "<div><b>Sébastien · Solution Phone</b><span>Comptoir IA 24h/24 · Tarifs, Suivi & Photo</span></div>" +
    '<button class="evan-widget-back" type="button" title="Revenir aux suggestions" aria-label="Revenir aux suggestions">↺</button>' +
    '<button class="evan-widget-close" type="button" aria-label="Fermer">×</button>' +
    "</div>" +
    '<div class="evan-widget-body">' +
    '<small class="evan-widget-context">' +
    escapeHtml(ctx.label) +
    "</small>" +
    "<p>" +
    escapeHtml(ctx.title) +
    "</p>" +
    '<div class="evan-widget-suggestions">' +
    ctx.items
      .map(function (item, idx) {
        return (
          '<button type="button" data-idx="' +
          idx +
          '" data-question="' +
          escapeHtml(item) +
          '">' +
          escapeHtml(item) +
          "<span>→</span></button>"
        );
      })
      .join("") +
    "</div>" +
    '<div class="sp-jason-photo-bar" data-photo-bar="starter"><img alt="Photo jointe"><span>Photo prête à envoyer</span><button type="button" aria-label="Retirer la photo">×</button></div>' +
    '<form class="evan-widget-form" data-form="starter">' +
    '<button type="button" class="sp-jason-cam-btn" title="Envoyer la photo de votre iPhone" aria-label="Joindre une photo">📷</button>' +
    '<input type="text" aria-label="Votre question" placeholder="Tarif iPhone, suivi REP-..., photo 📷…">' +
    '<button type="submit" aria-label="Envoyer">→</button>' +
    "</form>" +
    '<div class="evan-widget-direct">' +
    '<a href="' +
    directWaUrl +
    '" target="_blank" rel="noopener">WhatsApp direct</a>' +
    '<a href="' +
    directMailUrl +
    '" data-jason-mail>E-mail</a>' +
    "<span>21 rue Gambetta · Mâcon</span>" +
    "</div>" +
    "</div>" +
    '<div class="evan-widget-conversation">' +
    '<div class="sp-jason-thread" aria-live="polite"></div>' +
    '<div class="sp-jason-chips"></div>' +
    '<div class="sp-jason-composer">' +
    '<div class="sp-jason-photo-bar" data-photo-bar="followup"><img alt="Photo jointe"><span>Photo prête à envoyer</span><button type="button" aria-label="Retirer la photo">×</button></div>' +
    '<form class="evan-widget-form" data-form="followup">' +
    '<button type="button" class="sp-jason-cam-btn" title="Envoyer une photo à Sébastien" aria-label="Joindre une photo">📷</button>' +
    '<input type="text" aria-label="Continuer la discussion" placeholder="Répondre, joindre une photo 📷 ou réserver…">' +
    '<button type="submit" aria-label="Envoyer">→</button>' +
    "</form>" +
    "</div>" +
    "</div>" +
    "</div>" +
    '<button class="evan-widget-launch" type="button" aria-expanded="false" aria-label="Demandez à Sébastien">' +
    '<span class="evan-widget-avatar" aria-hidden="true"></span><i></i>' +
    "<span><b>Demandez à Sébastien</b><small>Tarifs iPhone · Suivi · Photo</small></span>" +
    "</button>";

  document.body.appendChild(root);

  var fileInput = root.querySelector(".sp-jason-file-input");
  var launch = root.querySelector(".evan-widget-launch");
  var closeBtn = root.querySelector(".evan-widget-close");
  var backBtn = root.querySelector(".evan-widget-back");
  var starterForm = root.querySelector('form[data-form="starter"]');
  var starterInput = starterForm.querySelector('input[type="text"]');
  var followupForm = root.querySelector('form[data-form="followup"]');
  var followupInput = followupForm.querySelector('input[type="text"]');
  var followupBtn = followupForm.querySelector('button[type="submit"]');
  var camBtns = root.querySelectorAll(".sp-jason-cam-btn");
  var photoBars = root.querySelectorAll(".sp-jason-photo-bar");
  var threadEl = root.querySelector(".sp-jason-thread");
  var chipsEl = root.querySelector(".sp-jason-chips");
  var currentWaUrl = directWaUrl;

  function syncPhotoPreview() {
    camBtns.forEach(function (b) {
      b.classList.toggle("has-photo", Boolean(pendingImageDataUrl));
    });
    photoBars.forEach(function (bar) {
      bar.classList.toggle("visible", Boolean(pendingImageDataUrl));
      var img = bar.querySelector("img");
      if (img && pendingImageDataUrl) img.src = pendingImageDataUrl;
    });
  }

  camBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      ensureMetricOpened();
      fileInput.click();
    });
  });

  photoBars.forEach(function (bar) {
    var clearBtn = bar.querySelector("button");
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        pendingImageDataUrl = null;
        fileInput.value = "";
        syncPhotoPreview();
      });
    }
  });

  fileInput.addEventListener("change", function () {
    var f = fileInput.files && fileInput.files[0];
    if (!f) return;
    compressImageFile(f, function (dataUrl) {
      pendingImageDataUrl = dataUrl;
      syncPhotoPreview();
      var activeInput = root.classList.contains("conversation-open") ? followupInput : starterInput;
      activeInput.focus();
    });
  });

  function scrollThread() {
    threadEl.scrollTop = threadEl.scrollHeight;
  }

  function appendBubble(cls, htmlContent) {
    var div = document.createElement("div");
    div.className = "sp-jason-msg " + cls;
    div.innerHTML = htmlContent;
    threadEl.appendChild(div);
    scrollThread();
    return div;
  }

  function renderChips(quickReplies, waUrl) {
    if (waUrl) currentWaUrl = waUrl;
    chipsEl.innerHTML = "";
    var list =
      Array.isArray(quickReplies) && quickReplies.length
        ? quickReplies
        : [
            { label: "Continuer sur WhatsApp avec Sébastien", action: "whatsapp" },
            { label: "Où en est ma réparation ?", value: "Où en est ma réparation en cours à l’atelier ?" },
          ];
    list.slice(0, 3).forEach(function (item) {
      if (item.action === "whatsapp") {
        var a = document.createElement("a");
        a.className = "sp-jason-chip sp-jason-chip--wa";
        a.href = currentWaUrl;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = "💬 " + item.label;
        a.addEventListener("click", function () {
          trackMetric("whatsapp_clicked", { source: "assistant_chip", page: page || "home" });
        });
        chipsEl.appendChild(a);
      } else if (item.action === "mail") {
        var m = document.createElement("a");
        m.className = "sp-jason-chip";
        m.href = directMailUrl;
        m.textContent = "✉️ " + item.label;
        m.addEventListener("click", function (e) {
          trackMetric("email_clicked", { source: "assistant_chip", page: page || "home" });
          if (typeof window.SolutionPhoneOpenIphoneQuoteModal === "function") {
            e.preventDefault();
            toggle(false);
            window.SolutionPhoneOpenIphoneQuoteModal();
          }
        });
        chipsEl.appendChild(m);
      } else if (item.value) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "sp-jason-chip";
        b.textContent = item.label;
        b.addEventListener("click", function () {
          ask(item.value);
        });
        chipsEl.appendChild(b);
      }
    });
  }

  function stopPolling() {
    if (pollTimer) {
      clearTimeout(pollTimer);
      pollTimer = null;
    }
    pollCount = 0;
  }

  function startSebastienPolling() {
    stopPolling();
    if (!metricToken) return;
    var note = document.createElement("div");
    note.className = "sp-jason-relay-note";
    note.textContent =
      "📡 Transmis en direct à Sébastien à l’atelier — s’il est disponible, sa réponse s’affichera ici automatiquement.";
    threadEl.appendChild(note);
    scrollThread();

    function pollOnce() {
      pollCount += 1;
      fetch(brainUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poll: true, conversation_token: metricToken }),
      })
        .then(function (r) {
          return r.ok ? r.json() : null;
        })
        .then(function (data) {
          if (data && data.status === "answered" && data.answer) {
            stopPolling();
            if (note.parentNode) note.remove();
            appendBubble(
              "sp-jason-msg--live",
              "<strong>👨‍🔧 Sébastien (en direct de l’atelier) :</strong><br>" + formatRichHtml(data.answer),
            );
            history.push({ role: "assistant", content: data.answer });
            saveState();
            return;
          }
          if (pollCount < 15) pollTimer = setTimeout(pollOnce, 8000);
        })
        .catch(function () {
          if (pollCount < 15) pollTimer = setTimeout(pollOnce, 10000);
        });
    }
    pollTimer = setTimeout(pollOnce, 6000);
  }

  function hydrateExistingHistory() {
    threadEl.innerHTML = "";
    history.forEach(function (turn) {
      appendBubble(
        turn.role === "user" ? "sp-jason-msg--user" : "sp-jason-msg--bot",
        turn.role === "user" ? escapeHtml(turn.content) : formatRichHtml(turn.content),
      );
    });
  }

  function toggle(force) {
    var open = typeof force === "boolean" ? force : !root.classList.contains("open");
    root.classList.toggle("open", open);
    launch.setAttribute("aria-expanded", String(open));
    if (open) {
      ensureMetricOpened();
      if (history.length > 0 && !root.classList.contains("conversation-open")) {
        root.classList.add("conversation-open");
        hydrateExistingHistory();
        renderChips(null, currentWaUrl);
      }
      setTimeout(function () {
        (root.classList.contains("conversation-open") ? followupInput : starterInput).focus();
      }, 80);
    }
  }

  function ask(question) {
    var attachedImg = pendingImageDataUrl;
    var clean = String(question || "").trim();
    if (!clean && attachedImg) {
      var dynModel = detectPageModel();
      clean =
        "Voici la photo de mon " +
        (dynModel || "iPhone") +
        " : quel est votre diagnostic et le tarif ?";
    }
    if (!clean) return;

    pendingImageDataUrl = null;
    fileInput.value = "";
    syncPhotoPreview();

    ensureMetricOpened();
    if (!root.classList.contains("conversation-open")) {
      root.classList.add("conversation-open");
      hydrateExistingHistory();
    }
    toggle(true);
    starterInput.value = "";
    followupInput.value = "";
    followupBtn.disabled = true;
    chipsEl.innerHTML = "";

    var userBubbleHtml =
      (attachedImg ? '<img class="sp-jason-user-thumb" src="' + attachedImg + '" alt="Photo envoyée">' : "") +
      escapeHtml(clean);
    appendBubble("sp-jason-msg--user", userBubbleHtml);

    var typingEl = appendBubble(
      "sp-jason-msg--bot sp-jason-msg--typing",
      attachedImg
        ? "Analyse visuelle de votre photo et vérification des tarifs en cours…"
        : "L’assistant de Sébastien vérifie en direct…",
    );

    var priorHistory = history.slice(-8);
    history.push({ role: "user", content: attachedImg ? "[Photo envoyée] " + clean : clean });
    saveState();

    fetch(brainUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: clean,
        image_data_url: attachedImg || undefined,
        conversation_token: metricToken || undefined,
        history: priorHistory,
        context: { page: metricPage, consent_to_store: false },
      }),
    })
      .then(function (r) {
        if (!r.ok) throw new Error("unavailable");
        return r.json();
      })
      .then(function (data) {
        if (typingEl.parentNode) typingEl.remove();
        if (data.conversation_token) metricToken = data.conversation_token;
        var reply = data.answer || "Vous pouvez nous joindre directement sur WhatsApp au 07 83 92 18 84.";
        appendBubble("sp-jason-msg--bot", formatRichHtml(reply));
        if (data.quote_reference) {
          var badge = document.createElement("div");
          badge.className = "sp-jason-quote-badge";
          badge.textContent = "✅ Enregistré au comptoir Solution Phone : réf. " + data.quote_reference;
          threadEl.appendChild(badge);
          scrollThread();
        }
        history.push({ role: "assistant", content: reply });
        saveState();
        renderChips(data.quick_replies, data.whatsapp_url);
        if (data.needs_expert) startSebastienPolling();
      })
      .catch(function () {
        if (typingEl.parentNode) typingEl.remove();
        appendBubble(
          "sp-jason-msg--bot",
          formatRichHtml(
            "Le service de réponse instantanée est momentanément occupé. Vous pouvez poser votre question directement à **Sébastien sur WhatsApp (07 83 92 18 84)** ou passer sans rendez-vous au **21 rue Gambetta à Mâcon**.",
          ),
        );
        renderChips(null, directWaUrl);
      })
      .finally(function () {
        followupBtn.disabled = false;
        followupInput.focus();
      });
  }

  function resetToSuggestions() {
    stopPolling();
    history = [];
    pendingImageDataUrl = null;
    syncPhotoPreview();
    saveState();
    threadEl.innerHTML = "";
    chipsEl.innerHTML = "";
    root.classList.remove("conversation-open");
    setTimeout(function () {
      starterInput.focus();
    }, 80);
  }

  launch.addEventListener("click", function () {
    toggle();
  });
  closeBtn.addEventListener("click", function () {
    toggle(false);
  });
  backBtn.addEventListener("click", resetToSuggestions);

  root.querySelectorAll("[data-question]").forEach(function (button) {
    button.addEventListener("click", function () {
      var dyn = selectedHeroModel();
      var q = button.getAttribute("data-question");
      if (dyn && button.getAttribute("data-idx") === "0" && !pageModel) {
        q = "Quel est le tarif écran et batterie pour " + dyn + " ?";
      }
      ask(q);
    });
  });

  starterForm.addEventListener("submit", function (e) {
    e.preventDefault();
    ask(starterInput.value);
  });
  followupForm.addEventListener("submit", function (e) {
    e.preventDefault();
    ask(followupInput.value);
  });

  root.querySelector('a[href*="wa.me"]').addEventListener("click", function () {
    ensureMetricOpened();
    trackMetric("whatsapp_clicked", { source: "iphone_widget_direct", page: page || "home" });
  });
  root.querySelector("[data-jason-mail]").addEventListener("click", function (e) {
    ensureMetricOpened();
    trackMetric("email_clicked", { source: "iphone_widget_direct", page: page || "home" });
    if (typeof window.SolutionPhoneOpenIphoneQuoteModal === "function") {
      e.preventDefault();
      toggle(false);
      window.SolutionPhoneOpenIphoneQuoteModal();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") toggle(false);
  });
})();
