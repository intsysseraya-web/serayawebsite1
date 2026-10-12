import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import legacyCss from "../legacy-shim.css?url";
import { siteChrome, siteFooter, skipLink } from "../lib/site-chrome";

// 依据《SERAYA 网站改版方案 v1.0》§4.9：原首页本地线内容下沉到独立页。
// 已执行：
//   - 迁入首页三张卡（Quick-config towers / BYO parts / Trade-in）
//   - **删除**必删清单第 3 项的灰市暗示措辞：`single throat to choke`、`even a box of DDR3`
//   - 明确边界：不做批量、不做转售、不走出口
//   - 补数据擦除说明（`/legal#privacy` 尚未建，暂不链——见台账）
// 品牌规范 §4：本地线允许友好、口语、俏皮；但该语气**不得出现在任何 B2B 页面**。

const BODY_HTML = `
${skipLink()}
${siteChrome("local", "Tower, laptop, trade-in...")}

    <div class="page-hero">
      <div class="page-hero-inner">
        <span class="eyebrow">Local</span>
        <h1>Laptops, towers, and the server under your desk.</h1>
        <p class="muted">One machine or a small room &mdash; same bench, same care.</p>
      </div>
    </div>

    <main id="main">
      <section class="section" aria-labelledby="local-lines-title">
        <div class="section-head">
          <h2 id="local-lines-title">Three ways to work with us</h2>
        </div>
        <div class="program-card-grid">
          <article class="program-type-card">
            <h3>Quick-config towers</h3>
            <p>For when you just want a machine that works. Pick from our pre-tested parts lists &mdash; we match batches, flash the same BIOS, and hand it over ready to run.</p>
          </article>
          <article class="program-type-card">
            <h3>Bring your own parts</h3>
            <p>Send us your RAM, SSDs, or that GPU you picked up on sale. We build them into our assembly and burn-in process. You get one warranty and one point of contact.</p>
          </article>
          <article class="program-type-card">
            <h3>Trade-ins</h3>
            <p>Trade in a used PC, a server, or spare drives. We wipe the data, test what is salvageable, and recycle the rest properly. You get cash or store credit.</p>
          </article>
        </div>
      </section>

      <section class="section company-band" aria-labelledby="local-limits-title">
        <div class="section-head">
          <h2 id="local-limits-title">Where this line stops</h2>
        </div>
        <ul class="rfq-checklist">
          <li><strong>No bulk lots</strong> &mdash; bulk GPU purchasing is handled separately, see <a href="/purchasing">Purchasing</a>.</li>
          <li><strong>No resale</strong> &mdash; we build and hand over; we do not resell units on.</li>
          <li><strong>No export</strong> &mdash; this line is local delivery only. Cross-border sourcing goes through <a href="/contact">Contact</a>.</li>
        </ul>
      </section>

      <section class="section" aria-labelledby="local-data-title">
        <div class="section-head">
          <h2 id="local-data-title">Data on trade-in devices</h2>
          <p>Storage media received through trade-ins is wiped to a documented standard before the hardware is reused or recycled.</p>
        </div>
      </section>

      <section class="section program-cta" aria-labelledby="local-cta-title">
        <div>
          <p class="muted" style="margin: 0 0 0.5rem">Local enquiries</p>
          <h2 id="local-cta-title">Tell us what you want to build</h2>
          <p class="muted">Rough budget, what you will run on it, and anything you already own.</p>
        </div>
        <div class="btn-row">
          <a class="btn btn-primary" href="/contact">Contact us</a>
          <a class="btn btn-ghost" href="/systems">Reference systems</a>
        </div>
      </section>
    </main>
${siteFooter()}
  `;

export const Route = createFileRoute("/local")({
  head: () => ({
    meta: [
      { title: "Local builds and trade-ins | Seraya System Integration" },
      {
        name: "description",
        content:
          "Quick-config towers, bring-your-own-parts builds and trade-ins in Kuala Lumpur. Local delivery only — no bulk lots, no resale, no export.",
      },
      { property: "og:title", content: "Local builds and trade-ins | Seraya System Integration" },
      {
        property: "og:description",
        content: "One machine or a small room — same bench, same care.",
      },
    ],
    links: [
      { rel: "stylesheet", href: "/legacy/styles.css" },
      { rel: "stylesheet", href: legacyCss },
    ],
  }),
  component: LegacyPage,
});

function LegacyPage() {
  useEffect(() => {
    const s = document.createElement("script");
    s.src = "/legacy/script.js";
    s.async = false;
    document.body.appendChild(s);
    return () => {
      s.remove();
    };
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: BODY_HTML }} />;
}
