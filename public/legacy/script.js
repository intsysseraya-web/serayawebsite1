(function () {
  var body = document.body;

  function qs(id) {
    return document.getElementById(id);
  }

  var drawer = qs("mobileDrawer");
  var btnMenu = qs("btnMenu");
  var btnCloseMenu = qs("btnCloseMenu");
  var searchPanel = qs("searchPanel");
  var btnSearch = qs("btnSearch");
  var btnCloseSearch = qs("btnCloseSearch");
  var cartPanel = qs("cartPanel");
  var btnCart = qs("btnCart");
  var btnCloseCart = qs("btnCloseCart");

  function openDrawer() {
    if (!drawer) return;
    drawer.hidden = false;
    requestAnimationFrame(function () {
      drawer.classList.add("is-open");
    });
    if (btnMenu) btnMenu.setAttribute("aria-expanded", "true");
    body.style.overflow = "hidden";
  }

  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove("is-open");
    if (btnMenu) btnMenu.setAttribute("aria-expanded", "false");
    body.style.overflow = "";
    function done(e) {
      if (e.propertyName !== "opacity") return;
      drawer.removeEventListener("transitionend", done);
      if (!drawer.classList.contains("is-open")) drawer.hidden = true;
    }
    drawer.addEventListener("transitionend", done);
  }

  function openOverlay(el, openerBtn) {
    if (!el) return;
    el.hidden = false;
    requestAnimationFrame(function () {
      el.classList.add("is-open");
    });
    body.style.overflow = "hidden";
    if (openerBtn) openerBtn.setAttribute("aria-expanded", "true");
  }

  function closeOverlay(el, openerBtn) {
    if (!el) return;
    el.classList.remove("is-open");
    body.style.overflow = "";
    if (openerBtn) openerBtn.setAttribute("aria-expanded", "false");
    function done(e) {
      if (e.propertyName !== "opacity") return;
      el.removeEventListener("transitionend", done);
      if (!el.classList.contains("is-open")) el.hidden = true;
    }
    el.addEventListener("transitionend", done);
  }

  if (btnMenu) {
    btnMenu.addEventListener("click", function () {
      if (drawer && drawer.classList.contains("is-open")) closeDrawer();
      else openDrawer();
    });
  }
  if (btnCloseMenu) btnCloseMenu.addEventListener("click", closeDrawer);

  if (btnSearch) {
    btnSearch.addEventListener("click", function () {
      closeDrawer();
      openOverlay(searchPanel, btnSearch);
      var q = qs("q");
      if (q)
        setTimeout(function () {
          q.focus();
        }, 50);
    });
  }
  if (btnCloseSearch) {
    btnCloseSearch.addEventListener("click", function () {
      closeOverlay(searchPanel, btnSearch);
    });
  }

  if (btnCart) {
    btnCart.addEventListener("click", function () {
      closeDrawer();
      openOverlay(cartPanel, btnCart);
    });
  }
  if (btnCloseCart) {
    btnCloseCart.addEventListener("click", function () {
      closeOverlay(cartPanel, btnCart);
    });
  }

  if (drawer) {
    drawer.addEventListener("click", function (e) {
      if (e.target === drawer) closeDrawer();
    });
  }
  if (searchPanel) {
    searchPanel.addEventListener("click", function (e) {
      if (e.target === searchPanel) closeOverlay(searchPanel, btnSearch);
    });
  }
  if (cartPanel) {
    cartPanel.addEventListener("click", function (e) {
      if (e.target === cartPanel) closeOverlay(cartPanel, btnCart);
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (drawer && drawer.classList.contains("is-open")) closeDrawer();
    if (searchPanel && searchPanel.classList.contains("is-open"))
      closeOverlay(searchPanel, btnSearch);
    if (cartPanel && cartPanel.classList.contains("is-open")) closeOverlay(cartPanel, btnCart);
  });

  /* ---------- v2 polish: scroll-reveal + advantage timeline lighting ---------- */
  function initReveal() {
    if (typeof IntersectionObserver === "undefined") return;

    body.classList.add("reveal-ready");

    var revealSelectors = [
      ".hero .hero-inner",
      ".hero .hero-marquee-wrap",
      ".section",
      ".section-head",
      ".promo-card",
      ".adv-card",
      ".value-card",
      ".tile",
      ".product-card",
      ".prose > *",
      ".split-visual",
      ".page-hero-inner",
    ];

    var nodes = document.querySelectorAll(revealSelectors.join(","));
    nodes.forEach(function (n) {
      n.classList.add("reveal");
    });

    // Stagger siblings within the same parent for a tasteful cascade.
    var parentCounts = new Map();
    nodes.forEach(function (n) {
      var parent = n.parentElement || document.body;
      var idx = parentCounts.get(parent) || 0;
      parentCounts.set(parent, idx + 1);
      var delay = Math.min(idx * 90, 360);
      if (delay) n.style.setProperty("--reveal-delay", delay + "ms");
    });

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-revealed");
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );

    nodes.forEach(function (n) {
      io.observe(n);
    });

    // Safety net: ensure nothing stays invisible if IO misses (e.g. headless
    // full-page screenshots, prefers-reduced-motion edge cases, or fast scrolls).
    setTimeout(function () {
      nodes.forEach(function (n) {
        if (!n.classList.contains("is-revealed")) n.classList.add("is-revealed");
      });
    }, 2500);
  }

  function initAdvLighting() {
    if (typeof IntersectionObserver === "undefined") return;

    var root = document.querySelector(".adv-card-root");
    var branches = document.querySelector(".adv-tree-branches");
    var cards = document.querySelectorAll(".adv-tree-branches .adv-card");
    if (!root && !branches && !cards.length) return;

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-lit");
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -15% 0px", threshold: 0.35 },
    );

    if (root) io.observe(root);
    if (branches) io.observe(branches);
    cards.forEach(function (c) {
      io.observe(c);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initReveal();
      initAdvLighting();
    });
  } else {
    initReveal();
    initAdvLighting();
  }
})();
