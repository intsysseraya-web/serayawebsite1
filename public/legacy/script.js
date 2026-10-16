/* Seraya 全站交互脚本。
 *
 * 载入位置：`src/routes/__root.tsx` 的 RootShell，全站只注入一次。
 * 为什么必须在根布局：这些监听绑定在 document / 固定 id 上，若放在各路由的
 * useEffect 里，客户端跳转一次就重复绑定一次 —— 点一次 Menu 会开一次又关一次。
 *
 * 本文件只依赖 DOM，不依赖 React，因此 SSR 直出的 legacy 页面同样可用。
 *
 * 覆盖的交互：
 *   1. 移动菜单（抽屉）打开 / 关闭 / Escape / 点外部 / 焦点圈定与恢复
 *   2. 搜索面板同样的开关与焦点行为
 *   3. 滚动淡入（尊重 prefers-reduced-motion）
 *   4. 询价表单提交（渐进增强，成功只由服务端确认触发）
 */
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

  var FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function focusables(root) {
    return Array.prototype.filter.call(root.querySelectorAll(FOCUSABLE), function (el) {
      return el.offsetParent !== null || el === document.activeElement;
    });
  }

  /* 记录打开浮层前的焦点元素，关闭时归还 —— 键盘用户不会掉到文档开头。 */
  var lastTrigger = null;

  function rememberTrigger(el) {
    lastTrigger = el || document.activeElement;
  }

  function restoreTrigger(fallback) {
    var target = lastTrigger || fallback;
    lastTrigger = null;
    if (target && typeof target.focus === "function") target.focus();
  }

  function trapTab(container, event) {
    var items = focusables(container);
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function openDrawer(trigger) {
    if (!drawer) return;
    rememberTrigger(trigger);
    drawer.hidden = false;
    requestAnimationFrame(function () {
      drawer.classList.add("is-open");
    });
    if (btnMenu) btnMenu.setAttribute("aria-expanded", "true");
    body.style.overflow = "hidden";
    var close = qs("btnCloseMenu");
    if (close)
      setTimeout(function () {
        close.focus();
      }, 30);
  }

  function closeDrawer() {
    if (!drawer) return;
    if (drawer.hidden) return;
    drawer.classList.remove("is-open");
    if (btnMenu) btnMenu.setAttribute("aria-expanded", "false");
    body.style.overflow = "";
    restoreTrigger(btnMenu);
    function done(e) {
      if (e.propertyName !== "opacity") return;
      drawer.removeEventListener("transitionend", done);
      if (!drawer.classList.contains("is-open")) drawer.hidden = true;
    }
    drawer.addEventListener("transitionend", done);
    /* 过渡被 prefers-reduced-motion 关掉时不会触发 transitionend，兜底收起。 */
    setTimeout(function () {
      if (!drawer.classList.contains("is-open")) drawer.hidden = true;
    }, 400);
  }

  function openOverlay(el, openerBtn) {
    if (!el) return;
    rememberTrigger(openerBtn);
    el.hidden = false;
    requestAnimationFrame(function () {
      el.classList.add("is-open");
    });
    body.style.overflow = "hidden";
    if (openerBtn) openerBtn.setAttribute("aria-expanded", "true");
  }

  function closeOverlay(el, openerBtn) {
    if (!el) return;
    if (el.hidden) return;
    el.classList.remove("is-open");
    body.style.overflow = "";
    if (openerBtn) openerBtn.setAttribute("aria-expanded", "false");
    restoreTrigger(openerBtn);
    function done(e) {
      if (e.propertyName !== "opacity") return;
      el.removeEventListener("transitionend", done);
      if (!el.classList.contains("is-open")) el.hidden = true;
    }
    el.addEventListener("transitionend", done);
    setTimeout(function () {
      if (!el.classList.contains("is-open")) el.hidden = true;
    }, 400);
  }

  if (btnMenu) {
    btnMenu.addEventListener("click", function () {
      if (drawer && drawer.classList.contains("is-open")) closeDrawer();
      else openDrawer(btnMenu);
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

  /* 点击浮层外部（页面其他位置）也收起：抽屉内部点击不触发。 */
  document.addEventListener("click", function (e) {
    if (drawer && drawer.classList.contains("is-open")) {
      var panel = drawer.querySelector("[data-drawer-panel]");
      if (panel && !panel.contains(e.target) && e.target !== btnMenu) closeDrawer();
    }
    if (searchPanel && searchPanel.classList.contains("is-open")) {
      var sheet = searchPanel.querySelector("[data-overlay-sheet]");
      if (sheet && !sheet.contains(e.target) && e.target !== btnSearch) {
        closeOverlay(searchPanel, btnSearch);
      }
    }
  });

  document.addEventListener("keydown", function (e) {
    var drawerOpen = drawer && drawer.classList.contains("is-open");
    var searchOpen = searchPanel && searchPanel.classList.contains("is-open");

    if (e.key === "Escape") {
      if (drawerOpen) {
        closeDrawer();
        return;
      }
      if (searchOpen) {
        closeOverlay(searchPanel, btnSearch);
        return;
      }
    }

    if (e.key === "Tab") {
      if (drawerOpen) trapTab(drawer.querySelector("[data-drawer-panel]") || drawer, e);
      else if (searchOpen)
        trapTab(searchPanel.querySelector("[data-overlay-sheet]") || searchPanel, e);
    }
  });

  /* ---------- 页内锚点：hydration 之后补一次滚动 ----------
   *
   * 这些页面由 React 用 dangerouslySetInnerHTML 渲染。浏览器在 HTML 解析阶段会对
   * URL 里的 #fragment 做一次滚动，但 React 随后 hydration 并替换 innerHTML，
   * 滚动位置就丢了 —— 用户点「View GPU models」之类的页内链接时**页面完全不动**。
   * 这是无头 Chrome 实测抓到的真实缺陷，不是样式问题（scroll-margin-top 写得再对也没用）。
   *
   * 处理方式：解析后、以及 hydration 稳定后各滚一次。只做垂直滚动，
   * 不用 scrollIntoView，避免顺带改动横向位置。
   */
  function initHashScroll() {
    function offset() {
      var header = document.querySelector(".site-header");
      if (!header) return 0;
      var cs = getComputedStyle(header);
      if (cs.position !== "fixed" && cs.position !== "sticky") return 0;
      return header.getBoundingClientRect().height + 12;
    }

    function scrollToHash(behavior) {
      var raw = window.location.hash.slice(1);
      if (!raw) return;
      var target = null;
      try {
        target = document.getElementById(raw) || document.querySelector('[name="' + raw + '"]');
      } catch (e) {
        return;
      }
      if (!target) return;
      var top = target.getBoundingClientRect().top + window.pageYOffset - offset();
      var max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      window.scrollTo({
        top: Math.min(Math.max(top, 0), max),
        left: 0,
        behavior: behavior || "auto",
      });
    }

    function settle() {
      /* 两帧之后 React 的 innerHTML 替换已完成，这时滚动才不会被覆盖 */
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          scrollToHash("auto");
        });
      });
    }

    if (window.location.hash) {
      if (document.readyState === "complete") settle();
      else window.addEventListener("load", settle);
    }

    /* 同页再次点击同一锚点（或客户端路由改了 hash）也要滚 */
    window.addEventListener("hashchange", function () {
      if (prefersReducedMotion()) scrollToHash("auto");
      else scrollToHash("smooth");
    });
  }

  /* ---------- 滚动淡入 ----------
   * 线检项 7：淡入要短，正文及时可见；系统偏好减少动态效果时直接不启用。
   */
  function prefersReducedMotion() {
    return (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function initReveal() {
    if (typeof IntersectionObserver === "undefined") return;
    if (prefersReducedMotion()) return; /* 不加 .reveal，元素保持默认可见 */

    body.classList.add("reveal-ready");

    var revealSelectors = [
      ".hero .hero-inner",
      ".hero .hero-marquee-wrap",
      ".promo-card",
      ".adv-card",
      ".value-card",
      ".tile",
      ".product-card",
      ".gpu-card",
      ".split-visual",
    ];
    /* 刻意不含 `.section-head`：标题是页面结构信息，不该等着滚动才出现。
       正文可读性优先于动效（线检项 7）。 */

    var nodes = document.querySelectorAll(revealSelectors.join(","));
    nodes.forEach(function (n) {
      n.classList.add("reveal");
    });

    var parentCounts = new Map();
    nodes.forEach(function (n) {
      var parent = n.parentElement || document.body;
      var idx = parentCounts.get(parent) || 0;
      parentCounts.set(parent, idx + 1);
      var delay = Math.min(idx * 60, 180);
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
      { rootMargin: "0px 0px -4% 0px", threshold: 0.05 },
    );

    nodes.forEach(function (n) {
      io.observe(n);
    });

    /* 兜底：IO 漏判时也必须让内容可见（无头截图、快速滚动、打印等场景）。
       500ms 足够长到不打断正常淡入，又短到内容不会长时间缺席。 */
    setTimeout(function () {
      nodes.forEach(function (n) {
        if (!n.classList.contains("is-revealed")) n.classList.add("is-revealed");
      });
    }, 500);
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

  /* ---------- 询价表单（站内询价，线检项 5） ----------
   *
   * 这个函数只是**增强**：表单本身是普通 POST 到 /api/rfq，脚本没跑也能提交。
   * 因此：
   *   - 成功文案只在 fetch 收到 2xx 且 ok:true 之后才出现，绝不预先显示；
   *   - 失败显示服务端返回的真实原因，并保留用户已填内容；
   *   - 提交期间禁用按钮，防止重复提交，结束后恢复；
   *   - 校验规则与服务端同源（src/lib/rfq.ts 的 validateRfq），不另写一套。
   */
  function initRfqForm() {
    var forms = document.querySelectorAll("form[data-rfq-form]");
    if (!forms.length) return;

    function setStatus(form, message, kind) {
      var el = form.querySelector("[data-rfq-status]");
      if (!el) return;
      el.textContent = message || "";
      el.hidden = !message;
      el.className = "rfq-status" + (kind ? " is-" + kind : "");
    }

    function clearFieldErrors(form) {
      form.querySelectorAll(".rfq-field.has-error").forEach(function (f) {
        f.classList.remove("has-error");
      });
      form.querySelectorAll(".rfq-error[data-client-error]").forEach(function (n) {
        n.parentNode.removeChild(n);
      });
    }

    function showFieldError(form, name, message) {
      var input = form.querySelector('[name="' + name + '"]');
      if (!input) return;
      var wrap = input.closest(".rfq-field");
      if (!wrap) return;
      wrap.classList.add("has-error");
      input.setAttribute("aria-invalid", "true");
      var existing = wrap.querySelector(".rfq-error");
      if (existing) {
        existing.textContent = message;
        return;
      }
      var p = document.createElement("p");
      p.className = "rfq-error";
      p.setAttribute("data-client-error", "1");
      p.textContent = message;
      wrap.appendChild(p);
    }

    /* 与服务端 validateRfq 相同的必填与格式口径（见 src/lib/rfq.ts） */
    function validate(form) {
      var problems = [];
      var get = function (n) {
        var el = form.querySelector('[name="' + n + '"]');
        return el ? String(el.value || "").trim() : "";
      };
      if (!get("path")) problems.push(["path", "Choose what you need."]);
      if (!get("requirement"))
        problems.push(["requirement", "Tell us the product or the requirement."]);
      var qty = get("quantity");
      if (!qty) problems.push(["quantity", "Enter a quantity."]);
      else if (!/^\d{1,9}$/.test(qty) || Number(qty) < 1)
        problems.push(["quantity", "Enter a whole number of 1 or more."]);
      if (!get("destination"))
        problems.push(["destination", "Enter the delivery country or city."]);
      var email = get("email");
      if (!email) problems.push(["email", "Enter your email so we can reply."]);
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
        problems.push(["email", "That email address does not look complete."]);
      return problems;
    }

    forms.forEach(function (form) {
      /* 记录来源页，服务端据此判断询价从哪个产品页发起 */
      var sourceInput = form.querySelector('[name="source"]');
      if (sourceInput && !sourceInput.value) {
        sourceInput.value = window.location.pathname + window.location.search;
      }

      form.addEventListener("submit", function (event) {
        event.preventDefault();
        if (form.getAttribute("data-rfq-busy") === "1") return;

        clearFieldErrors(form);
        setStatus(form, "", "");

        var problems = validate(form);
        if (problems.length) {
          problems.forEach(function (p) {
            showFieldError(form, p[0], p[1]);
          });
          setStatus(form, "Please correct the highlighted fields. Nothing was sent yet.", "error");
          var first = form.querySelector(".rfq-field.has-error .rfq-input");
          if (first) first.focus();
          return;
        }

        var button = form.querySelector("[data-rfq-submit]");
        var label = button ? button.textContent : "";
        form.setAttribute("data-rfq-busy", "1");
        if (button) {
          button.disabled = true;
          button.setAttribute("aria-busy", "true");
          button.textContent = "Sending\u2026";
        }
        setStatus(form, "Sending your RFQ\u2026", "pending");

        var payload = {};
        new FormData(form).forEach(function (v, k) {
          payload[k] = typeof v === "string" ? v : "";
        });

        fetch(form.action, {
          method: "POST",
          headers: { "content-type": "application/json", accept: "application/json" },
          body: JSON.stringify(payload),
        })
          .then(function (res) {
            return res.json().then(function (data) {
              return { status: res.status, data: data };
            });
          })
          .then(function (out) {
            var data = out.data || {};
            if (out.status >= 200 && out.status < 300 && data.ok) {
              var card = document.createElement("div");
              card.className = "rfq-success";
              card.setAttribute("role", "status");
              card.setAttribute("tabindex", "-1");
              card.innerHTML =
                "<h3>RFQ received</h3>" +
                '<p class="muted">Reference <strong></strong>. We respond to complete RFQs within one business day.</p>' +
                '<p class="muted">Our team has been notified by email. Need to add attachments or correct anything? Reply to ' +
                '<a href="mailto:felix.mm@seraya.systems">felix.mm@seraya.systems</a> quoting the reference.</p>';
              var strong = card.querySelector("strong");
              if (strong) strong.textContent = String(data.reference || "");
              form.parentNode.insertBefore(card, form);
              form.hidden = true;
              card.focus();
              return;
            }

            (data.errors || []).forEach(function (e) {
              showFieldError(form, e.field, e.message);
            });
            setStatus(
              form,
              data.message ||
                "The RFQ was not sent. Please try again or use the email address below.",
              "error",
            );
          })
          .catch(function () {
            setStatus(
              form,
              "We could not reach the server, so nothing was sent. Please check your connection or email felix.mm@seraya.systems.",
              "error",
            );
          })
          .then(function () {
            form.removeAttribute("data-rfq-busy");
            if (button) {
              button.disabled = false;
              button.removeAttribute("aria-busy");
              button.textContent = label;
            }
          });
      });
    });
  }

  /* ---------- 目录 → 询价表单的上下文同步（2026-11） ----------
   *
   * 目录里的家族卡片与版本展开区带有 data-rfq-model / data-rfq-sku / data-rfq-config。
   * 客户点某个版本旁边的询价按钮时，脚本把这三点写进同页表单的隐藏字段，
   * 让提交带上正确的「型号 + 版本 + SKU」，而不是一句泛泛的询价。
   *
   * 为什么需要：目录卡片的按钮是普通锚点（`#request-quote`），无法直接携带参数；
   * 而表单的 sku/config 是隐藏上下文，客户看不到也不该手填。
   * 详情页不依赖这段逻辑：它的表单在服务端渲染时就已经带好所选版本。
   */
  function initCatalogRfqContext() {
    var triggers = document.querySelectorAll("[data-rfq-model]");
    if (!triggers.length) return;

    function applyToForm(model, sku, config) {
      document.querySelectorAll("form[data-rfq-form]").forEach(function (form) {
        var modelField = form.querySelector('[name="requirement"]');
        var skuField = form.querySelector('[name="sku"]');
        var configField = form.querySelector('[name="config"]');
        if (modelField && model) modelField.value = model;
        if (skuField) skuField.value = sku || "";
        if (configField) configField.value = config || "";
      });
    }

    triggers.forEach(function (trigger) {
      trigger.addEventListener("click", function () {
        applyToForm(
          trigger.getAttribute("data-rfq-model") || "",
          trigger.getAttribute("data-rfq-sku") || "",
          trigger.getAttribute("data-rfq-config") || "",
        );
      });
    });
  }

  /* ---------- 需求类型切换：整机才显示「每系统卡数」，并同步摘要（2026-11） ----------
   *
   * 摘要里的 Requirement 行必须跟着下拉框走。否则客户把「Buy GPUs」改成
   * 「Buy a complete system」时，上方摘要仍写着 Buy GPUs —— 同一张表里两处
   * 自相矛盾，客户无法判断到底按哪个提交（这是实际报过的问题）。
   * 这里不做字符串匹配，直接读下拉框当前选中项的文本，永远与它一致。
   */
  function initRfqPathSwitch() {
    document.querySelectorAll("form[data-rfq-form]").forEach(function (form) {
      var pathField = form.querySelector('[name="path"]');
      var systemRow = form.querySelector("[data-rfq-system-row]");
      var summaryRequirement = form.querySelector('[data-rfq-summary="requirement"]');
      if (!pathField) return;

      function selectedLabel() {
        var opt = pathField.options[pathField.selectedIndex];
        return opt ? opt.textContent.trim() : pathField.value;
      }

      function sync() {
        var value = pathField.value;
        var isSystem = value === "Buy a complete system";

        /* 1) 摘要里的需求类型：只改文本，不动结构 */
        if (summaryRequirement) summaryRequirement.textContent = selectedLabel();

        /* 2) 数量字段标签随需求类型变化 */
        var qtyLabel = form.querySelector('label[for$="-quantity"]');
        if (qtyLabel) {
          var text = "Quantity (units)";
          if (isSystem) text = "Quantity (systems)";
          else if (value === "Sell a GPU lot") text = "Lot size (units)";
          qtyLabel.innerHTML = text + ' <span class="rfq-required" aria-hidden="true">*</span>';
        }

        /* 3) 每系统卡数只在整机需求下出现 */
        if (systemRow) systemRow.hidden = !isSystem;
      }

      pathField.addEventListener("change", sync);
      sync();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initReveal();
      initAdvLighting();
      initRfqForm();
      initHashScroll();
      initCatalogRfqContext();
      initRfqPathSwitch();
    });
  } else {
    initReveal();
    initAdvLighting();
    initRfqForm();
    initHashScroll();
    initCatalogRfqContext();
    initRfqPathSwitch();
  }
})();
