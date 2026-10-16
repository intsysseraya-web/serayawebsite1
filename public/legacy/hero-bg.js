(function () {
  /* Hero background: subtle cyan particle network.
     Vanilla canvas, no deps. Pauses when off-screen / tab hidden.
     Honors prefers-reduced-motion (renders one static frame). */

  function initHeroBackground() {
    var hero = document.querySelector(".hero");
    if (!hero) return;
    if (hero.getAttribute("data-hero-style") === "plain") return;
    if (hero.querySelector(".hero-bg-canvas")) return; // idempotent

    var canvas = document.createElement("canvas");
    canvas.className = "hero-bg-canvas";
    canvas.setAttribute("aria-hidden", "true");
    hero.insertBefore(canvas, hero.firstChild);

    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var width = 0,
      height = 0;
    var nodes = [];
    var mouse = { x: -9999, y: -9999, active: false };
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function resize() {
      var rect = hero.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function seed() {
      /*
       * 密度：每 22000 px² 一个节点，再整体 +10 个（CY 2026-11 要求星星多一些），
       * 上下限 34–62 兜住极端视口：
       *   - 下限保证窄屏不会太空（375px 宽时按面积算只有个位数）
       *   - 上限保证超宽屏不会变成噪点、也压住 O(n²) 连线计算量
       * 1440×430 的桌面上约为 28 → 38 个节点。
       */
      var base = Math.round((width * height) / 22000);
      var target = Math.max(34, Math.min(62, base + 10));
      nodes = [];
      for (var i = 0; i < target; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.18,
          vy: (Math.random() - 0.5) * 0.18,
          r: 1 + Math.random() * 1.4,
        });
      }
    }

    var LINK = 150; // link distance in px

    /*
     * 暴露实际节点数，便于人工/脚本核对密度。只读数字，不影响渲染。
     * 为什么留这个口子：这是纯视觉参数，出问题时「看起来太空/太密」很难量化，
     * 有一个可读取的数字就能直接和改动前对比。
     */
    function publishCount() {
      window.__serayaHeroNodes = nodes.length;
    }

    function step() {
      ctx.clearRect(0, 0, width, height);

      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;

        // gentle pull toward mouse
        if (mouse.active) {
          var mdx = mouse.x - n.x;
          var mdy = mouse.y - n.y;
          var md2 = mdx * mdx + mdy * mdy;
          if (md2 < 180 * 180) {
            var pull = (180 - Math.sqrt(md2)) * 0.00018;
            n.x += mdx * pull;
            n.y += mdy * pull;
          }
        }
      }

      // links
      for (var a = 0; a < nodes.length; a++) {
        var na = nodes[a];
        for (var b = a + 1; b < nodes.length; b++) {
          var nb = nodes[b];
          var dx = na.x - nb.x;
          var dy = na.y - nb.y;
          var d2 = dx * dx + dy * dy;
          if (d2 > LINK * LINK) continue;
          var d = Math.sqrt(d2);
          var alpha = (1 - d / LINK) * 0.32;
          ctx.strokeStyle = "rgba(92,200,255," + alpha.toFixed(3) + ")";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(na.x, na.y);
          ctx.lineTo(nb.x, nb.y);
          ctx.stroke();
        }
      }

      // nodes
      for (var k = 0; k < nodes.length; k++) {
        var p = nodes[k];
        ctx.fillStyle = "rgba(92,200,255,0.55)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    var raf = 0;
    var running = false;
    function loop() {
      step();
      raf = requestAnimationFrame(loop);
    }
    function start() {
      if (running || reduced) return;
      running = true;
      raf = requestAnimationFrame(loop);
    }
    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    resize();
    publishCount();
    if (reduced) {
      step(); // single frame
    } else {
      start();
    }

    var resizeT;
    window.addEventListener("resize", function () {
      clearTimeout(resizeT);
      resizeT = setTimeout(resize, 120);
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else start();
    });

    hero.addEventListener("mousemove", function (e) {
      var rect = hero.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    });
    hero.addEventListener("mouseleave", function () {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    });

    // Pause when hero scrolled fully out of view
    if (typeof IntersectionObserver !== "undefined") {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting) start();
            else stop();
          });
        },
        { threshold: 0 },
      );
      io.observe(hero);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHeroBackground);
  } else {
    initHeroBackground();
  }
})();
