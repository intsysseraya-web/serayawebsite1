// Seraya 商品数据 —— 单一数据源。
//
// 口径依据：《Seraya 产品页（/works）改版方案 v1.0》（DOCX, 2026-10-12）。
//   - 恢复 5 个类别 / 15 个参考配置（此前「只保留 GPU 类」的决定已被 DOCX 覆盖）
//   - 卡片标题区恢复「编码行 + 名称行」两行结构（SR-* 编码回到对外）
//   - 删除全部交期承诺（lead time）与营销角标
//   - 卡片脚部：条件标签 New / ITAD ＋ Quoted per item
//
// 卡片高度由规格行数决定（DOCX §5 实测）：2 行 = 419 / 3 行 = 444 / 4 行 = 469。
// 因此**不要**在卡片里增删结构行，否则卡高与验收标准不符。

/** 卡片脚部的条件标签。DOCX §9 未决项：本版统一写 New / ITAD；若某配置只走单一路线，逐卡改。 */
export const CONDITION_LABEL = "New / ITAD";

/** 卡片脚部的报价口径文案，替换原交期位置。 */
export const QUOTE_NOTE = "Quoted per item";

/** 规格表的一行：[标签, 值]。顺序即显示顺序。 */
export type SpecRow = [label: string, value: string];

export type CategoryId = "compute" | "gpu" | "storage" | "networking" | "workstation";

export type Product = {
  /** 标题区第一行：对外展示的编码（等宽、青色） */
  code: string;
  /** 标题区第二行：配置名称 */
  name: string;
  specs: SpecRow[];
  img: string;
};

export type Category = {
  id: CategoryId;
  /** 分类导航与区块标题共用 */
  title: string;
  blurb: string;
  products: Product[];
};

export const CATEGORIES: Category[] = [
  {
    id: "compute",
    title: "Compute",
    blurb: "General-purpose rack nodes for virtualization, databases and mixed workloads.",
    products: [
      {
        code: "SR-C220",
        name: "Dual-socket rack node",
        specs: [
          ["CPU", "2× Xeon Silver 4410Y (12C)"],
          ["RAM", "256 GB DDR5 ECC"],
          ["Disk", "2× 1.92 TB NVMe"],
        ],
        img: "/static/sku/sr-c220.jpg",
      },
      {
        code: "SR-C450",
        name: "Virtualization host",
        specs: [
          ["CPU", "2× EPYC 9354 (32C)"],
          ["RAM", "768 GB DDR5 ECC"],
          ["Disk", "4× 3.84 TB NVMe"],
        ],
        img: "/static/sku/sr-c450.jpg",
      },
      {
        code: "SR-C880",
        name: "High-density HPC node",
        specs: [
          ["CPU", "2× EPYC 9654 (96C)"],
          ["RAM", "1.5 TB DDR5 ECC"],
          ["Disk", "8× 7.68 TB NVMe"],
        ],
        img: "/static/sku/sr-c880.jpg",
      },
    ],
  },
  {
    id: "gpu",
    title: "GPU / AI",
    blurb: "Inference, fine-tuning and large-model training, single-node to 8-way NVLink.",
    products: [
      {
        code: "SR-G410",
        name: "Inference & fine-tune entry",
        specs: [
          ["CPU", "1× Xeon Gold 6448Y"],
          ["GPU", "2× L40S 48 GB"],
          ["RAM", "256 GB DDR5"],
          ["Disk", "2× 3.84 TB NVMe"],
        ],
        img: "/static/sku/sr-g410.jpg",
      },
      {
        code: "SR-G780",
        name: "Multi-GPU training tower",
        specs: [
          ["CPU", "2× EPYC 9474F"],
          ["GPU", "4× H100 NVL 94 GB"],
          ["RAM", "1 TB DDR5 ECC"],
          ["Disk", "4× 7.68 TB NVMe"],
        ],
        img: "/static/sku/sr-g780.jpg",
      },
      {
        code: "SR-G990",
        name: "Large-model training node",
        specs: [
          ["CPU", "2× EPYC 9654"],
          ["GPU", "8× H200 SXM (NVLink)"],
          ["RAM", "2 TB DDR5 ECC"],
          ["Disk", "8× 7.68 TB NVMe + IB HDR"],
        ],
        img: "/static/sku/sr-g990.jpg",
      },
      // --- 50 系游戏卡（2026-10-12 CY 提供图片后加入）------------------------
      // 待补：规格（VRAM / 接口 / 功耗 / 散热形态）。**未确认前不编造，故 specs 留空。**
      // 后果：这 3 张卡的规格表为空 → 卡高低于「2 行 419」基准，
      //       DOCX §7「卡片尺寸与原版差 < 1.5px」对这 3 张不成立，需 CY 补规格后复核。
      // 另：图片为 1254×1254 正方形，容器 16:9，object-fit:cover 会纵向裁掉 43.75%。
      {
        code: "SR-5060",
        name: "RTX 5060",
        specs: [],
        img: "/static/sku/sr-5060-16x9.jpg?v=2",
      },
      {
        code: "SR-5070",
        name: "RTX 5070",
        specs: [],
        img: "/static/sku/sr-5070-16x9.jpg?v=2",
      },
      {
        code: "SR-5080",
        name: "RTX 5080",
        specs: [],
        img: "/static/sku/sr-5080-16x9.jpg?v=2",
      },
    ],
  },
  {
    id: "storage",
    title: "Storage",
    blurb: "All-flash pools, capacity tiers and backup targets, NVMe through SATA.",
    products: [
      {
        code: "SR-S240",
        name: "NVMe shared pool",
        specs: [
          ["CPU", "1× Xeon Silver 4410Y"],
          ["RAM", "128 GB"],
          ["Disk", "24× 7.68 TB NVMe (~184 TB)"],
        ],
        img: "/static/sku/sr-s240.jpg",
      },
      {
        code: "SR-S560",
        name: "All-flash archive + replica",
        specs: [
          ["CPU", "2× EPYC 9334"],
          ["RAM", "512 GB"],
          ["Disk", "36× 15.36 TB NVMe (~550 TB)"],
        ],
        img: "/static/sku/sr-s560.jpg",
      },
      {
        code: "SR-S980",
        name: "High-density object / backup",
        specs: [
          ["CPU", "2× Xeon Gold 6438N"],
          ["RAM", "256 GB"],
          ["Disk", "60× 22 TB SATA (~1.3 PB)"],
        ],
        img: "/static/sku/sr-s980.jpg",
      },
    ],
  },
  {
    id: "networking",
    title: "Networking",
    blurb: "25 / 100 / 400 GbE switching and InfiniBand fabric for AI clusters.",
    products: [
      {
        code: "SR-N100",
        name: "25/100 G top-of-rack",
        specs: [
          ["Ports", "32× 100 GbE QSFP28"],
          ["Fabric", "Cut-through, 6.4 Tb/s"],
        ],
        img: "/static/sku/sr-n100.jpg",
      },
      {
        code: "SR-N400",
        name: "400 G spine switch",
        specs: [
          ["Ports", "32× 400 GbE QSFP-DD"],
          ["Fabric", "25.6 Tb/s non-blocking"],
        ],
        img: "/static/sku/sr-n400.jpg",
      },
      {
        code: "SR-N-IB",
        name: "InfiniBand HDR / NDR fabric",
        specs: [
          ["Ports", "40× NDR 400 Gb/s"],
          ["Fabric", "SHARP in-network compute"],
        ],
        img: "/static/sku/sr-n-ib.jpg",
      },
    ],
  },
  {
    id: "workstation",
    title: "Workstation",
    blurb: "Engineering and content workstations, quiet enough for the office.",
    products: [
      {
        code: "SR-W310",
        name: "Engineering workstation",
        specs: [
          ["CPU", "Threadripper 7960X (24C)"],
          ["GPU", "RTX 5000 Ada 32 GB"],
          ["RAM", "128 GB DDR5"],
          ["Disk", "2× 2 TB NVMe"],
        ],
        img: "/static/sku/sr-w310.jpg",
      },
      {
        code: "SR-W620",
        name: "Creation & simulation flagship",
        specs: [
          ["CPU", "Threadripper Pro 7995WX (96C)"],
          ["GPU", "2× RTX 6000 Ada 48 GB"],
          ["RAM", "512 GB DDR5 ECC"],
          ["Disk", "4× 4 TB NVMe"],
        ],
        img: "/static/sku/sr-w620.jpg",
      },
      {
        code: "SR-W180-EDGE",
        name: "Silent edge node",
        specs: [
          ["CPU", "Ryzen 9 7950X"],
          ["GPU", "RTX 4000 SFF Ada 20 GB"],
          ["RAM", "64 GB DDR5"],
          ["Disk", "1× 4 TB NVMe"],
        ],
        img: "/static/sku/sr-w180.jpg",
      },
    ],
  },
];

/** 全部参考配置的扁平列表。计数行与 SEO 描述用它，不写死数字。 */
export const ALL_PRODUCTS: Product[] = CATEGORIES.flatMap((c) => c.products);

// ---------------------------------------------------------------------------
// 新增两段（DOCX §4）—— 文案逐字取自方案，不在页面里另写变量说明。
// ---------------------------------------------------------------------------

/** §4.1 两条供给路线对比表。列为 New / ITAD certified pre-owned。
 *  注意：DOCX 只给了标题与表格内容，没有副标题 —— 故不写副标题，避免自造文案。
 */
export const SUPPLY_ROUTES: {
  heading: string;
  columns: [string, string];
  rows: [string, string, string][];
} = {
  heading: "Two supply routes — and they are not priced the same",
  columns: ["New", "ITAD / certified pre-owned"],
  rows: [
    [
      "Cost basis",
      "List or allocation pricing",
      "Recovered cost — normally a discount to new",
    ],
    [
      "Performance & life",
      "Full service life, current firmware",
      "Same silicon; shorter remaining life, older firmware",
    ],
    [
      "Lead time",
      "Driven by allocation and configuration",
      "Driven by what has been recovered and tested",
    ],
    [
      "Payment & warranty",
      "Deposit or credit terms",
      "Set case by case against the grading report",
    ],
  ],
};

/** §4.2 影响报价的三个变量。 */
export const QUOTE_DRIVERS: { heading: string; note: string; items: [string, string][] } = {
  heading: "What changes the quote",
  note: "All three are stated in writing in every quote.",
  items: [
    ["System complexity", "A single node and a rack-scale rollout do not quote the same way."],
    ["Stock status", "In stock, on order and on allocation carry different lead times."],
    ["Goods condition", "New, refurbished and ITAD are priced, paid for and warranted differently."],
  ],
};
