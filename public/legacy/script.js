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
   *   - 成功只在 fetch 收到 2xx 且 ok:true 之后才发生（跳转到 /thank-you）；
   *   - 失败显示服务端返回的真实原因，并保留用户已填内容；
   *   - 提交期间禁用按钮，防止重复提交，结束后恢复；
   *   - 校验规则与服务端同源（src/lib/rfq.ts 的 validateRfq），不另写一套。
   */

  /* 需求类型标签 → Thank You 页的 path slug。与服务端 rfq-http.ts 的
   * thankYouPath() 保持同一份映射；标签同源于 src/lib/rfq.ts 的 RFQ_PATHS。 */
  function rfqPathSlug(label) {
    switch (label) {
      case "Buy GPUs":
        return "gpu";
      case "Buy a complete system":
        return "system";
      case "AI sovereignty deployment":
        return "sovereignty";
      case "Buy storage or networking":
        return "component";
      case "Sell a GPU lot":
        return "sell";
      default:
        return "other";
    }
  }

  /*
   * 投递通道不可用（503）时的一键邮件兜底（2026-11-19）。
   *
   * 背景：线上没有配置投递通道时，表单内容真的没发出去。只显示错误文案会让客户
   * 重打一遍、或者直接走掉。这里把已填内容拼进 mailto，一点就能发到收件箱。
   * 服务端 no-JS 分支有同样的兜底（renderRfqUnavailable），两边字段顺序保持一致。
   */
  var RFQ_FALLBACK_FIELDS = [
    ["requirement", "Product or requirement"],
    ["sku", "SKU"],
    ["config", "Version / configuration"],
    ["quantity", "Quantity"],
    ["cardsPerSystem", "Cards per system"],
    ["destination", "Delivery country / city"],
    ["condition", "Condition"],
    ["targetDate", "Target date"],
    ["company", "Company"],
    ["notes", "Notes"],
  ];

  function rfqFallbackMailto(payload) {
    var lines = [];
    RFQ_FALLBACK_FIELDS.forEach(function (pair) {
      var value = String(payload[pair[0]] || "").trim();
      if (value) lines.push(pair[1] + ": " + value);
    });
    var replyTo = String(payload.email || "").trim();
    if (replyTo) lines.push("Reply to: " + replyTo);
    lines.push("");
    lines.push("Sent from the website form \u2014 the server could not deliver it automatically.");
    var subject = payload.path
      ? "[Seraya website] " + String(payload.path)
      : "[Seraya website] Enquiry";
    return (
      "mailto:felix.mm@seraya.systems?subject=" +
      encodeURIComponent(subject) +
      "&body=" +
      encodeURIComponent(lines.join("\n").slice(0, 1800))
    );
  }

  function showEmailFallback(form, payload) {
    if (form.querySelector("[data-rfq-fallback]")) return;
    var wrap = document.createElement("p");
    wrap.className = "rfq-fallback";
    wrap.setAttribute("data-rfq-fallback", "");
    var link = document.createElement("a");
    link.className = "btn btn-primary";
    link.href = rfqFallbackMailto(payload);
    link.textContent = "Email these details instead";
    wrap.appendChild(link);
    var status = form.querySelector("[data-rfq-status]");
    if (status && status.parentNode) status.parentNode.insertBefore(wrap, status.nextSibling);
    else form.insertBefore(wrap, form.firstChild);
  }

  /* ---------- 页头一级下拉（2026-11-19） ----------
   *
   * 只有 SYSTEMS 一个组。三条通路都能开合，不依赖 hover：
   *   - 鼠标悬停（桌面，pointer: fine）
   *   - 单独的 caret 按钮（触屏 / 键盘，aria-expanded 同步）
   *   - Esc 关闭并把焦点还给 caret；焦点移出整组自动收起
   * 菜单里的链接就是普通链接，不拦默认跳转。
   */
  function initNavMenu() {
    var groups = document.querySelectorAll(".nav-item--menu");
    if (!groups.length) return;

    function setOpen(group, open) {
      var btn = group.querySelector(".nav-caret-btn");
      var menu = group.querySelector(".nav-menu");
      if (!btn || !menu) return;
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      menu.hidden = !open;
      group.setAttribute("data-open", open ? "true" : "false");
    }

    groups.forEach(function (group) {
      var btn = group.querySelector(".nav-caret-btn");
      var menu = group.querySelector(".nav-menu");
      if (!btn || !menu) return;

      var hoverTimer = null;
      var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

      if (canHover) {
        group.addEventListener("mouseenter", function () {
          if (hoverTimer) { clearTimeout(hoverTimer); hoverTimer = null; }
          setOpen(group, true);
        });
        group.addEventListener("mouseleave", function () {
          hoverTimer = setTimeout(function () { setOpen(group, false); }, 180);
        });
      }

      btn.addEventListener("click", function (event) {
        event.preventDefault();
        setOpen(group, btn.getAttribute("aria-expanded") !== "true");
      });

      group.addEventListener("focusout", function (event) {
        if (!group.contains(event.relatedTarget)) setOpen(group, false);
      });

      group.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
          setOpen(group, false);
          btn.focus();
        }
      });
    });

    document.addEventListener("click", function (event) {
      groups.forEach(function (group) {
        if (!group.contains(event.target)) setOpen(group, false);
      });
    });
  }

  function initRfqForm() {    var forms = document.querySelectorAll("form[data-rfq-form]");
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
              /*
               * 2026-11-19：成功后跳到独立的 Thank You 页，不再在原地插成功卡。
               * ref 用于双方对齐同一笔询价；path 决定感谢页的文案分支。
               * 与 no-JS 分支（/api/rfq 的 303）落点相同，两条路径只有一套成功页。
               */
              var params = new URLSearchParams();
              if (data.reference) params.set("ref", String(data.reference));
              params.set("path", rfqPathSlug(payload.path));
              window.location.assign("/thank-you?" + params.toString());
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
            // 503 = 服务端没有可用的投递通道：给出预填邮件，别让客户重打一遍
            if (out.status === 503) showEmailFallback(form, payload);
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
   *
   * 2026-11-19 改为事件委托：页面由 dangerouslySetInnerHTML 渲染，React 水合可能
   * 替换表单节点，直接绑在 select 上的 change 监听会随之丢失——线上就是这样复现的
   * （选整机、摘要仍旧 Buy GPUs，且控制台无报错）。
   */
  function syncRfqPathState(form) {
    var pathField = form.querySelector('[name="path"]');
    if (!pathField) return;

    var option = pathField.options[pathField.selectedIndex];
    var label = option ? option.textContent.trim() : pathField.value;
    var isSystem = label === "Buy a complete system";

    /* 1) 摘要里的需求类型：只改文本，不动结构 */
    var summaryRequirement = form.querySelector('[data-rfq-summary="requirement"]');
    if (summaryRequirement) summaryRequirement.textContent = label;

    /* 2) 数量字段：标签 + 说明都随需求类型变化
     *    （说明来自 RFQ_PATHS.<key>.quantityHint；该字段默认没有说明节点，
     *      需要时动态创建、切走时移除，避免留下过期文案） */
    var qtyLabel = form.querySelector('label[for$="-quantity"]');
    if (qtyLabel) {
      var text = "Quantity (units)";
      if (isSystem) text = "Quantity (systems)";
      else if (label === "Sell a GPU lot") text = "Lot size (units)";
      else if (label === "AI sovereignty deployment") text = "Sites / deployments";
      qtyLabel.innerHTML = text + ' <span class="rfq-required" aria-hidden="true">*</span>';
    }

    var qtyInput = form.querySelector('input[name="quantity"]');
    var qtyField = qtyInput && qtyInput.closest ? qtyInput.closest(".rfq-field") : null;
    var qtyHint = qtyField ? qtyField.querySelector(".rfq-hint") : null;
    var qtyHintText = option ? option.getAttribute("data-quantity-hint") : null;

    if (qtyField && qtyInput) {
      if (!qtyInput.hasAttribute("data-rfq-default-describedby")) {
        qtyInput.setAttribute("data-rfq-default-describedby", qtyInput.getAttribute("aria-describedby") || "");
      }
      if (qtyHintText) {
        if (!qtyHint) {
          qtyHint = document.createElement("p");
          qtyHint.className = "rfq-hint";
          qtyHint.id = (qtyInput.id || "rfq-quantity") + "-hint";
          qtyHint.setAttribute("data-rfq-dynamic", "1");
          qtyField.appendChild(qtyHint);
          var described = (qtyInput.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean);
          if (described.indexOf(qtyHint.id) === -1) {
            described.push(qtyHint.id);
            qtyInput.setAttribute("aria-describedby", described.join(" "));
          }
        }
        qtyHint.hidden = false;
        qtyHint.textContent = qtyHintText;
      } else if (qtyHint && qtyHint.getAttribute("data-rfq-dynamic") === "1") {
        qtyHint.remove();
        qtyInput.setAttribute("aria-describedby", qtyInput.getAttribute("data-rfq-default-describedby") || "");
      }
    }

    /* 3) 每系统卡数只在整机需求下出现 */
    var systemRow = form.querySelector("[data-rfq-system-row]");
    if (systemRow) systemRow.hidden = !isSystem;

    /* 4) 路径级字段文案（如 AI sovereignty 不问"产品型号"，改问负载与边界）。
     *    覆盖值写在 option 的 data-* 上，由服务端从 RFQ_PATHS 生成；
     *    没有覆盖的路径恢复成首次渲染时的默认文案。 */
    var reqInput = form.querySelector('input[name="requirement"], textarea[name="requirement"]');
    if (reqInput) {
      var reqField = reqInput.closest ? reqInput.closest(".rfq-field") : null;
      var reqLabel = reqField ? reqField.querySelector("label") : null;
      var reqHint = reqField ? reqField.querySelector(".rfq-hint") : null;

      if (!form.__rfqRequirementDefaults) {
        form.__rfqRequirementDefaults = {
          label: reqLabel ? reqLabel.innerHTML : "",
          placeholder: reqInput.getAttribute("placeholder") || "",
          hint: reqHint ? reqHint.innerHTML : "",
        };
      }
      var defaults = form.__rfqRequirementDefaults;
      var overrideLabel = option ? option.getAttribute("data-requirement-label") : null;
      var overridePlaceholder = option ? option.getAttribute("data-requirement-placeholder") : null;
      var overrideHint = option ? option.getAttribute("data-requirement-hint") : null;

      if (reqLabel) {
        reqLabel.innerHTML = overrideLabel
          ? overrideLabel + ' <span class="rfq-required" aria-hidden="true">*</span>'
          : defaults.label;
      }
      reqInput.setAttribute("placeholder", overridePlaceholder || defaults.placeholder);
      if (reqHint) reqHint.innerHTML = overrideHint || defaults.hint;
    }
  }

  function initRfqPathSwitch() {
    document.querySelectorAll("form[data-rfq-form]").forEach(syncRfqPathState);

    document.addEventListener("change", function (event) {
      var target = event.target;
      if (!target || target.name !== "path" || !target.closest) return;
      var form = target.closest("form[data-rfq-form]");
      if (form) syncRfqPathState(form);
    });
  }

  /* ---------- Thank You 页的返回按钮（2026-11-19） ----------
   *
   * 优先回到上一页；没有可回退的历史（直接打开链接 / 新标签页）时回首页，
   * 避免按钮按了没反应。用事件委托，因此页面内任何 [data-history-back] 都可用。
   */
  function initHistoryBack() {
    document.addEventListener("click", function (event) {
      var target = event.target;
      var trigger = target && target.closest ? target.closest("[data-history-back]") : null;
      if (!trigger) return;
      event.preventDefault();
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.assign("/");
      }
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
      initHistoryBack();
      initNavMenu();
    });
  } else {
    initReveal();
    initAdvLighting();
    initRfqForm();
    initHashScroll();
    initCatalogRfqContext();
    initRfqPathSwitch();
    initHistoryBack();
    initNavMenu();
  }
})();
