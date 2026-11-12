/* Buddie's — animations et interactions */
(function () {
  const doc = document.documentElement;
  const body = document.body;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const calme = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const souris = matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- intro : retirée une fois jouée ---------- */
  const intro = $(".intro");
  const sansIntro = calme || doc.classList.contains("sans-intro");
  if (intro) setTimeout(() => intro.remove(), sansIntro ? 0 : 2600);

  /* ---------- en-tête : compact au défilement, se cache en descendant ---------- */
  const entete = $("#entete");
  const appel = $(".appel");
  let dernierY = scrollY;
  let attente = false;
  const parallaxes = $$("[data-parallaxe]");
  const tourne = $("[data-tourne]");

  function auDefilement() {
    const y = scrollY;
    entete.classList.toggle("est-defile", y > 30);
    if (!body.classList.contains("menu-ouvert")) {
      entete.classList.toggle("entete--cache", y > dernierY && y > innerHeight * 0.8);
    }
    dernierY = y;

    if (!calme) {
      parallaxes.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > innerHeight + 200) return;
        const centre = r.top + r.height / 2 - innerHeight / 2;
        el.style.transform = `translate3d(0, ${(-centre * parseFloat(el.dataset.parallaxe)).toFixed(1)}px, 0)`;
      });
      if (tourne) {
        const r = tourne.getBoundingClientRect();
        const p = Math.min(Math.max(1 - (r.top + r.height / 2) / innerHeight, 0), 1); // 0 -> 1 pendant le passage
        tourne.style.transform = `rotate(${(-8 + p * 12).toFixed(2)}deg) scale(${(0.88 + Math.sin(p * Math.PI) * 0.14).toFixed(3)})`;
      }
    }
    attente = false;
  }
  addEventListener("scroll", () => { if (!attente) { attente = true; requestAnimationFrame(auDefilement); } }, { passive: true });
  auDefilement();

  /* ---------- bouton d'appel : 1er appui = « Appeler », 2e appui = appel ---------- */
  if (appel) {
    // visible dès qu'on quitte le haut de page (pour ne pas couvrir les boutons du haut)
    // il s'efface s'il passe au-dessus d'un autre bouton
    const boutons = $$("main .btn, main .onglet, main a:not(.photo-cat), .ligne__prix, .supp li b, .horaires li b, .pied a");
    const majAppel = () => {
      appel.classList.toggle("visible", scrollY > innerHeight * 0.6 || innerWidth > 760);
      const a = appel.getBoundingClientRect();
      const marge = 10;
      const dessus = boutons.some(b => {
        const r = b.getBoundingClientRect();
        return r.width && r.left < a.right + marge && r.right > a.left - marge && r.top < a.bottom + marge && r.bottom > a.top - marge;
      });
      appel.classList.toggle("esquive", dessus && !appel.classList.contains("ouvert"));
    };
    setTimeout(() => {
      majAppel();
      addEventListener("scroll", () => requestAnimationFrame(majAppel), { passive: true });
      setInterval(majAppel, 400); // les éléments qui apparaissent en glissant bougent aussi sans défilement
    }, sansIntro ? 1200 : 2900);
    let minuteur;
    appel.addEventListener("click", e => {
      if (!appel.classList.contains("ouvert")) {
        e.preventDefault();
        appel.classList.add("ouvert");
        clearTimeout(minuteur);
        minuteur = setTimeout(() => appel.classList.remove("ouvert"), 5000);
      }
    });
    document.addEventListener("click", e => { if (!appel.contains(e.target)) appel.classList.remove("ouvert"); });
  }

  /* ---------- menu mobile ---------- */
  const bouton = $(".entete__menu");
  const menu = $("#menu-mobile");
  function basculer(ouvrir) {
    if (ouvrir) {
      menu.hidden = false;
      entete.classList.remove("entete--cache");
      requestAnimationFrame(() => requestAnimationFrame(() => body.classList.add("menu-ouvert")));
    } else {
      body.classList.remove("menu-ouvert");
      setTimeout(() => { if (!body.classList.contains("menu-ouvert")) menu.hidden = true; }, 700);
    }
    bouton.setAttribute("aria-expanded", String(ouvrir));
    bouton.setAttribute("aria-label", ouvrir ? "Fermer le menu" : "Ouvrir le menu");
  }
  bouton.addEventListener("click", () => basculer(!body.classList.contains("menu-ouvert")));
  $$("a", menu).forEach(a => a.addEventListener("click", () => basculer(false)));
  addEventListener("keydown", e => { if (e.key === "Escape" && body.classList.contains("menu-ouvert")) basculer(false); });
  addEventListener("resize", () => { if (innerWidth > 1100 && body.classList.contains("menu-ouvert")) basculer(false); });

  /* ---------- « Commander » : lien direct vers le site de commande officiel ---------- */
  $$("[data-commander]").forEach(b => b.addEventListener("click", () => {
    if (body.classList.contains("menu-ouvert")) basculer(false);
  }));

  // emoji de chaque ingrédient (le premier mot-clé trouvé gagne : les plus précis d'abord)
  const EMOJIS = [
    ["sauce fromag", "🧀"], ["cheddar fondu", "🧀"], ["ketchup", "🥫"], ["moutarde", "🟡"], ["mayonnaise", "🥚"],
    ["bbq", "🔥"], ["sriracha", "🌶️"], ["piment", "🌶️"], ["jalap", "🌶️"], ["chili", "🌶️"], ["pesto", "🌿"],
    ["truffe", "🍄"], ["sauce", "🥣"], ["iceberg", "🥬"], ["salade", "🥬"], ["roquette", "🌿"], ["oignon", "🧅"],
    ["tomate", "🍅"], ["cornichon", "🥒"], ["courgette", "🥒"], ["aubergine", "🍆"], ["champignon", "🍄"],
    ["guacamole", "🥑"], ["avocat", "🥑"], ["oeuf", "🍳"], ["bacon", "🥓"], ["poisson", "🐟"], ["cabillaud", "🐟"],
    ["mozza stick", "🧀"], ["cordon bleu", "🍗"], ["poulet", "🍗"], ["parguit", "🍗"], ["tenders", "🍗"],
    ["viande", "🥩"], ["steak", "🥩"], ["burger", "🍔"], ["hot-dog", "🌭"], ["sandwich", "🥖"], ["tacos", "🌯"],
    ["frites", "🍟"], ["boisson", "🥤"], ["riz", "🍚"], ["motsi", "🫓"], ["cheddar", "🧀"], ["emmental", "🧀"],
    ["mozzarella", "🧀"], ["raclette", "🧀"], ["parmesan", "🧀"], ["blue cheese", "🧀"], ["fromage", "🧀"],
    ["oreo", "🍪"], ["speculoos", "🍪"], ["nutella", "🍫"], ["caramel", "🍯"], ["fraise", "🍓"], ["vanille", "🍦"],
  ];
  const emoji = t => {
    const s = t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/œ/g, "oe");
    const trouve = EMOJIS.find(([m]) => s.includes(m));
    return trouve ? trouve[1] : "✨";
  };

  /* ---------- fiche d'un plat : clic sur une ligne de la carte ---------- */
  const fiche = $("#fiche");
  if (fiche) {
    const fImg = $(".fiche__photo img", fiche);
    function ouvrirFiche(li) {
      const nom = $("h4", li).firstChild.textContent.trim();
      fImg.src = li.dataset.photo || "";
      fImg.alt = nom;
      $(".fiche__photo", fiche).hidden = !li.dataset.photo;
      $("h2", fiche).textContent = nom;
      const px = $(".ligne__prix", li);
      $(".fiche__prix", fiche).textContent = px ? px.textContent : "";
      $(".fiche__qtes", fiche).innerHTML = $$(".ligne__qtes li", li).map(q => `<li>${q.innerHTML}</li>`).join("");
      $(".fiche__compo", fiche).replaceChildren(...$(".ligne__compo", li).textContent.split(" · ").map(t => {
        const c = document.createElement("li"), i = document.createElement("span");
        i.setAttribute("aria-hidden", "true"); i.textContent = emoji(t);
        c.append(i, t); return c;
      }));
      $(".fiche__menu", fiche).hidden = !("menu" in li.dataset);
      fiche.showModal();
      $("h2", fiche).focus({ preventScroll: true });
      fiche.scrollTop = 0;
    }
    $$("[data-fiche]").forEach(li => {
      li.addEventListener("click", () => ouvrirFiche(li));
      li.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); ouvrirFiche(li); } });
    });
    fiche.addEventListener("click", e => { if (e.target === fiche) fiche.close(); });
    $(".fiche__cta", fiche).addEventListener("click", () => fiche.close(), true);
  }

  /* ---------- apparitions au défilement ---------- */
  const io = new IntersectionObserver(entrees => {
    entrees.forEach(en => {
      if (!en.isIntersecting) return;
      // une carte de catégorie vue = toutes (les suivantes sont hors écran dans le carrousel mobile)
      (en.target.matches(".photo-cat") ? $$(".photo-cat") : [en.target]).forEach(el => { el.classList.add("vu"); io.unobserve(el); });
    });
  }, { rootMargin: "0px 0px -10% 0px", threshold: 0.15 });
  $$(".anim, .titre, .photo-cat, .tampon").forEach(el => io.observe(el));
  $$(".photo-cat").forEach((el, i) => el.style.setProperty("--d", `${(i % 4) * 110}ms`));

  /* ---------- incontournables : flèches sur mobile ---------- */
  const rail = $(".photos-cat"), points = $$(".cat-nav__points i");
  if (rail && points.length) {
    const cartes = $$(".photo-cat");
    const pas = () => (cartes[1].offsetLeft - cartes[0].offsetLeft) || 1;
    const actuel = () => Math.round(rail.scrollLeft / pas());
    const maj = (cible) => {
      const i = typeof cible === "number" ? cible : actuel();
      points.forEach((p, k) => p.classList.toggle("actif", k === i));
      $$(".cat-nav__btn").forEach(b => { b.disabled = Number(b.dataset.cat) < 0 ? i <= 0 : i >= cartes.length - 1; });
    };
    $$(".cat-nav__btn").forEach(b => b.addEventListener("click", () => {
      const i = Math.max(0, Math.min(cartes.length - 1, actuel() + Number(b.dataset.cat)));
      rail.scrollTo({ left: cartes[i].offsetLeft - cartes[0].offsetLeft, behavior: "smooth" });
      maj(i);
    }));
    rail.addEventListener("scroll", () => maj(), { passive: true });
    maj();
  }

  /* ---------- boutons « aimantés » (ordinateur) ---------- */
  if (souris && !calme) {
    $$(".btn:not(.entete__cta)").forEach(b => {
      b.addEventListener("pointermove", e => {
        const r = b.getBoundingClientRect();
        b.style.translate = `${((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1)}px ${((e.clientY - r.top - r.height / 2) * 0.25).toFixed(1)}px`;
      });
      b.addEventListener("pointerleave", () => { b.style.translate = ""; });
    });
  }

  /* ---------- bandeaux : accélèrent quand on défile ---------- */
  const pistes = $$(".bandeau__piste").map(p => p.getAnimations()[0]).filter(Boolean);
  if (pistes.length && !calme) {
    let vitesse = 1, yPrec = scrollY;
    (function boucle() {
      const dy = Math.abs(scrollY - yPrec); yPrec = scrollY;
      vitesse += ((1 + Math.min(dy / 6, 5)) - vitesse) * 0.08;
      pistes.forEach(a => { a.playbackRate = vitesse; });
      requestAnimationFrame(boucle);
    })();
  }

  /* ---------- carte : onglets ---------- */
  const onglets = $$(".onglet");
  const piste = $(".onglets__piste");
  const curseur = $(".onglets__curseur");
  function placerCurseur(o) {
    if (!curseur || !o) return;
    curseur.style.width = o.offsetWidth + "px";
    curseur.style.transform = `translateX(${o.offsetLeft}px)`;
  }
  // Les vignettes de la carte se chargent toutes dès qu'on approche de la carte
  // (sinon, sur téléphone, certaines restaient vides jusqu'au toucher).
  const chargerVignettes = () => $$(".ligne__photo img[loading='lazy']").forEach(i => { i.loading = "eager"; });
  const carte = $("#carte");
  if (carte && "IntersectionObserver" in window) {
    const pres = new IntersectionObserver(en => { if (en.some(x => x.isIntersecting)) { chargerVignettes(); pres.disconnect(); } },
      { rootMargin: "1200px 0px" });
    pres.observe(carte);
  } else chargerVignettes();
  // et de toute façon, peu après l'ouverture de la page
  addEventListener("load", () => setTimeout(chargerVignettes, 1500));

  function choisir(id, defiler, net) {
    const o = onglets.find(x => x.dataset.onglet === id);
    if (!o) return;
    onglets.forEach(x => { const a = x === o; x.classList.toggle("actif", a); x.setAttribute("aria-selected", String(a)); x.tabIndex = a ? 0 : -1; });
    $$(".panneau").forEach(p => p.classList.toggle("actif", p.id === id));
    chargerVignettes();
    placerCurseur(o);
    piste.scrollTo({ left: o.offsetLeft - piste.clientWidth / 2 + o.offsetWidth / 2, behavior: calme || net ? "auto" : "smooth" });
    if (defiler) $("#carte").scrollIntoView({ behavior: calme ? "auto" : "smooth" });
  }
  if (onglets.length) {
    onglets.forEach(o => o.addEventListener("click", () => choisir(o.dataset.onglet, false)));
    piste.addEventListener("keydown", e => {
      const i = onglets.findIndex(o => o.classList.contains("actif"));
      const n = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : null;
      if (n === null) return;
      const cible = onglets[(n + onglets.length) % onglets.length];
      choisir(cible.dataset.onglet, false); cible.focus();
    });
    $$("[data-onglet-lien]").forEach(a => a.addEventListener("click", e => { e.preventDefault(); choisir(a.dataset.ongletLien, true); }));
    // Incontournables : un clic mène au plat dans la carte (bon onglet + ligne mise en lumière)
    $$("[data-plat]").forEach(a => a.addEventListener("click", e => {
      const li = $(`.panneau:not(#formules) .ligne[data-photo$="/img/plats/${a.dataset.plat}.webp"]`);
      if (!li) return;
      e.preventDefault();
      choisir(li.closest(".panneau").id, false, true);
      // petit délai : sur iPhone, deux défilements « doux » en même temps s'annulent
      setTimeout(() => {
        const r = li.getBoundingClientRect();
        scrollTo({ top: r.top + scrollY - Math.max(90, (innerHeight - r.height) / 2), behavior: calme ? "auto" : "smooth" });
      }, 60);
      $$(".ligne.repere").forEach(x => x.classList.remove("repere"));
      void li.offsetWidth; li.classList.add("repere");
    }));
    const ancre = location.hash.slice(1);
    if (onglets.some(o => o.dataset.onglet === ancre)) choisir(ancre, true);
    requestAnimationFrame(() => placerCurseur($(".onglet.actif")));
    addEventListener("resize", () => placerCurseur($(".onglet.actif")));
    document.fonts && document.fonts.ready.then(() => placerCurseur($(".onglet.actif")));
  }

  /* ---------- lien actif dans l'en-tête ---------- */
  const liens = $$(".entete__liens a[href*='#']");
  const sections = liens.map(a => $(a.hash));
  if (sections.every(Boolean)) {
    addEventListener("scroll", () => requestAnimationFrame(() => {
      let actif = -1;
      sections.forEach((s, i) => { const r = s.getBoundingClientRect(); if (r.top < innerHeight * 0.4 && r.bottom > innerHeight * 0.4) actif = i; });
      liens.forEach((a, i) => a.classList.toggle("actif", i === actif));
    }), { passive: true });
  }

  /* ---------- ouvert / fermé (heure de Paris) ---------- */
  const H = window.HORAIRES || [];
  const jours = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
  function maintenantParis() {
    const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
    const g = t => p.find(x => x.type === t).value;
    return { j: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(g("weekday")), m: (+g("hour") % 24) * 60 + +g("minute") };
  }
  const min = s => { const [h, m] = s.split(":"); return +h * 60 + +m; };
  const joli = s => s.replace(":", "h");
  function statut() {
    if (!H.length) return null;
    const { j, m } = maintenantParis();
    const [o, f] = H[j] || [];
    if (o && m >= min(o) && m < min(f)) return { ouvert: true, long: `Ouvert maintenant, jusqu'à ${joli(f)}`, court: `Ouvert jusqu'à ${joli(f)}`, j };
    if (o && m < min(o)) return { ouvert: false, long: `Fermé pour le moment, ouvre à ${joli(o)}`, court: `Ouvre à ${joli(o)}`, j };
    for (let k = 1; k <= 7; k++) {
      const n = (j + k) % 7;
      if (H[n] && H[n][0]) {
        const quand = k === 1 ? "demain" : jours[n];
        return { ouvert: false, long: `Fermé pour le moment, ouvre ${quand} à ${joli(H[n][0])}`, court: `Ouvre ${quand} à ${joli(H[n][0])}`, j };
      }
    }
    return null;
  }
  function majStatut() {
    const s = statut();
    if (!s) return;
    $$("[data-statut]").forEach(el => { el.textContent = s.long; el.classList.toggle("est-ouvert", s.ouvert); el.classList.toggle("est-ferme", !s.ouvert); });
    $$("[data-statut-court]").forEach(el => {
      el.classList.toggle("est-ouvert", s.ouvert); el.classList.toggle("est-ferme", !s.ouvert);
      $(".txt", el).textContent = s.court;
    });
    $$(".horaires li").forEach(li => li.classList.toggle("aujourdhui", +li.dataset.jour === s.j));
  }
  majStatut();
  setInterval(majStatut, 60000);
})();

/* menu Livraison (ordinateur) : au survol, et au clic pour les écrans tactiles */
document.querySelectorAll(".livraison__btn").forEach(b => b.addEventListener("click", () => b.parentNode.classList.toggle("ouvert")));
document.addEventListener("click", e => {
  document.querySelectorAll(".livraison.ouvert").forEach(d => { if (!d.contains(e.target)) d.classList.remove("ouvert"); });
});
