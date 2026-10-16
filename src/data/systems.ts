/**
 * 整机 / 存储 / 网络 产品目录 —— 与 `gpu-catalog.ts` 并列为全站唯一数据源。
 *
 * 本次重写（2026-11，线上检查项 3 与 4）：
 *
 * 1. **单卡、加速卡、SXM 模块移出本文件。** 之前 `/systems` 把 `gpu-catalog.ts` 的
 *    8 条 GPU 记录并进「GPU / AI」分类一起用整机卡片模板渲染，导致
 *    「15 reference configurations」与实际 23 张卡不符，且把单卡和整机混在同一目录。
 *    现在 GPU 记录由 `gpu-catalog.ts` 负责，`/systems` 只展示完整系统或明确标注的
 *    系统配置方案，数量由 `ALL_PRODUCTS.length` 实时计算。
 *
 * 2. **容量区分原始 / 可用。** 存储条目的容量来自数据源给出的原始磁盘容量；
 *    usable 容量在缺少依据时**不填**（`capacityUsable: null`），页面只说原始容量。
 *    凡是没有依据的数值一律不写成确定值。
 *
 * 3. **存储与网络补齐字段。** 用途、介质、接口、冗余方式、端口数量与速率、协议
 *    逐项落库，供 `/systems/storage-networking` 使用同一份资料渲染。
 *
 * 口径依据：《Seraya 产品页（/works）改版方案 v1.0》（DOCX, 2026-10-12）与
 * 《SITE INSPECTION 修复清单》（2026-11）。
 *   - 卡片标题区保持「编码行 + 名称行」两行结构（SR-* 编码对外）
 *   - 删除全部交期承诺（lead time）与营销角标
 *   - 卡片脚部：条件标签 New / ITAD ＋ Quoted per item
 */

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
  /** 询价关联用的稳定 SKU（与 GPU 目录共用 SR- 前缀命名空间） */
  sku: string;
  /** 标题区第二行：配置名称 */
  name: string;
  /** 一句话说明这是什么形态，供询价模板与页面副标题使用 */
  kind: string;
  specs: SpecRow[];
  img: string;
  /** 图片性质：参考图必须标注，不得暗示为当前批次实拍 */
  imageType: "reference" | "lot photo";
};

export type Category = {
  id: CategoryId;
  /** 分类导航与区块标题共用 */
  title: string;
  blurb: string;
  products: Product[];
  /**
   * 该分类是否为「示例配置」性质。示例必须显式标注，不得暗示已完成兼容性验证
   * 或随时可交付。
   */
  illustrative: boolean;
};

// ---------------------------------------------------------------------------
// 存储方案的可用容量依据
//
// 数据源给出的是磁盘数量 × 单盘原始容量（如 24× 7.68 TB）。该数字是**原始容量**，
// 不是主机可用容量：扣除 RAID/纠删码冗余、文件系统开销与预留空间后才是可用容量，
// 而冗余级别由最终配置决定，当前没有业务依据，因此 usable 一律为 null。
// 页面按「原始容量」措辞展示，不换算成可用容量。
// ---------------------------------------------------------------------------
export const CAPACITY_BASIS_NOTE =
  "Capacity shown is raw installed media (drive count × drive capacity), not usable host capacity. Usable capacity depends on the redundancy and file-system layout agreed for the order.";

export const CATEGORIES: Category[] = [
  {
    id: "compute",
    title: "Compute",
    blurb: "General-purpose rack nodes for virtualization, databases and mixed workloads.",
    illustrative: true,
    products: [
      {
        code: "SR-C220",
        sku: "SR-C220",
        name: "Dual-socket rack node",
        kind: "1U/2U rack server",
        specs: [
          ["CPU", "2× Xeon Silver 4410Y (12C)"],
          ["RAM", "256 GB DDR5 ECC"],
          ["Disk", "2× 1.92 TB NVMe"],
        ],
        img: "/static/sku/sr-c220.jpg",
        imageType: "reference",
      },
      {
        code: "SR-C450",
        sku: "SR-C450",
        name: "Virtualization host",
        kind: "2U rack server",
        specs: [
          ["CPU", "2× EPYC 9354 (32C)"],
          ["RAM", "768 GB DDR5 ECC"],
          ["Disk", "4× 3.84 TB NVMe"],
        ],
        img: "/static/sku/sr-c450.jpg",
        imageType: "reference",
      },
      {
        code: "SR-C880",
        sku: "SR-C880",
        name: "High-density HPC node",
        kind: "Rack server",
        specs: [
          ["CPU", "2× EPYC 9654 (96C)"],
          ["RAM", "1.5 TB DDR5 ECC"],
          ["Disk", "8× 7.68 TB NVMe"],
        ],
        img: "/static/sku/sr-c880.jpg",
        imageType: "reference",
      },
    ],
  },
  {
    id: "gpu",
    title: "GPU & AI servers",
    blurb: "Complete servers configured for inference, fine-tuning and large-model training.",
    illustrative: true,
    products: [
      {
        code: "SR-G410",
        sku: "SR-G410",
        name: "Inference & fine-tune entry",
        kind: "GPU server · 2 cards",
        specs: [
          ["CPU", "1× Xeon Gold 6448Y"],
          ["GPU", "2× L40S 48 GB"],
          ["RAM", "256 GB DDR5"],
          ["Disk", "2× 3.84 TB NVMe"],
        ],
        img: "/static/sku/sr-g410.jpg",
        imageType: "reference",
      },
      {
        code: "SR-G780",
        sku: "SR-G780",
        name: "Multi-GPU training server",
        kind: "GPU server · 4× H100 NVL cards",
        specs: [
          ["CPU", "2× EPYC 9474F"],
          ["GPU", "4× H100 NVL 94 GB (PCIe, NVLink-bridged pairs)"],
          ["RAM", "1 TB DDR5 ECC"],
          ["Disk", "4× 7.68 TB NVMe"],
        ],
        img: "/static/sku/sr-g780.jpg",
        imageType: "reference",
      },
      {
        code: "SR-G990",
        sku: "SR-G990",
        name: "Large-model training node",
        kind: "GPU server · 8 SXM modules",
        specs: [
          ["CPU", "2× EPYC 9654"],
          ["GPU", "8× H200 SXM 141 GB (NVLink)"],
          ["RAM", "2 TB DDR5 ECC"],
          ["Disk", "8× 7.68 TB NVMe + IB HDR"],
        ],
        img: "/static/sku/sr-g990.jpg",
        imageType: "reference",
      },
    ],
  },
  {
    id: "storage",
    title: "Storage",
    blurb: "All-flash pools, capacity tiers and backup targets, NVMe through SATA.",
    illustrative: true,
    products: [
      {
        code: "SR-S240",
        sku: "SR-S240",
        name: "NVMe shared pool",
        kind: "Shared all-flash pool node",
        specs: [
          ["Role", "Shared block/file pool for VM and database workloads"],
          ["Media", "NVMe SSD, TLC, mixed-use endurance"],
          ["Host", "1× Xeon Silver 4410Y · 128 GB RAM"],
          ["Drives", "24× 7.68 TB NVMe"],
          ["Raw capacity", "≈184 TB"],
          ["Interface", "NVMe over PCIe 4.0; 100 GbE host ports"],
          ["Redundancy", "Agreed per order (RAID or erasure coding)"],
        ],
        img: "/static/sku/sr-s240.jpg",
        imageType: "reference",
      },
      {
        code: "SR-S560",
        sku: "SR-S560",
        name: "All-flash archive + replica",
        kind: "Capacity all-flash node",
        specs: [
          ["Role", "Capacity tier and replica target for the primary pool"],
          ["Media", "NVMe SSD, read-intensive endurance"],
          ["Host", "2× EPYC 9334 · 512 GB RAM"],
          ["Drives", "36× 15.36 TB NVMe"],
          ["Raw capacity", "≈550 TB"],
          ["Interface", "NVMe over PCIe; 100/400 GbE host ports"],
          ["Redundancy", "Agreed per order (RAID or erasure coding)"],
        ],
        img: "/static/sku/sr-s560.jpg",
        imageType: "reference",
      },
      {
        code: "SR-S980",
        sku: "SR-S980",
        name: "High-density object / backup",
        kind: "High-density disk shelf node",
        specs: [
          ["Role", "Object store and backup target for cold or regulatory data"],
          ["Media", "SATA HDD (nearline)"],
          ["Host", "2× Xeon Gold 6438N · 256 GB RAM"],
          ["Drives", "60× 22 TB SATA"],
          ["Raw capacity", "≈1.3 PB"],
          ["Interface", "SATA/SAS backplane; 25/100 GbE host ports"],
          ["Redundancy", "Agreed per order (parity or erasure coding)"],
        ],
        img: "/static/sku/sr-s980.jpg",
        imageType: "reference",
      },
    ],
  },
  {
    id: "networking",
    title: "Networking",
    blurb: "25 / 100 / 400 GbE switching and InfiniBand fabric for AI clusters.",
    illustrative: true,
    products: [
      {
        code: "SR-N100",
        sku: "SR-N100",
        name: "25/100 G top-of-rack",
        kind: "1U leaf switch",
        specs: [
          ["Ports", "32× 100 GbE QSFP28"],
          ["Speeds", "100 / 50 / 40 / 25 / 10 GbE per port"],
          ["Switching capacity", "6.4 Tb/s, cut-through"],
          ["Protocols", "Ethernet (RoCEv2 capable); L2/L3; VXLAN; MLAG"],
          ["Redundancy", "Dual PSU, redundant fans, MLAG pair"],
        ],
        img: "/static/sku/sr-n100.jpg",
        imageType: "reference",
      },
      {
        code: "SR-N400",
        sku: "SR-N400",
        name: "400 G spine switch",
        kind: "1U/2U spine switch",
        specs: [
          ["Ports", "32× 400 GbE QSFP-DD"],
          ["Speeds", "400 / 200 / 100 / 50 GbE per port"],
          ["Switching capacity", "25.6 Tb/s, non-blocking"],
          ["Protocols", "Ethernet (RoCEv2); BGP EVPN; VXLAN; PFC/ECN for lossless"],
          ["Redundancy", "Dual PSU, redundant fans, spine pair"],
        ],
        img: "/static/sku/sr-n400.jpg",
        imageType: "reference",
      },
      {
        code: "SR-N-IB",
        sku: "SR-N-IB",
        name: "InfiniBand HDR / NDR fabric",
        kind: "InfiniBand switch and HCA set",
        specs: [
          ["Ports", "40× NDR 400 Gb/s"],
          ["Speeds", "NDR 400 / HDR 200 Gb/s InfiniBand"],
          ["Protocols", "InfiniBand; SHARP in-network compute; GPUDirect RDMA"],
          ["Cabling", "Active optical or DAC, agreed per order"],
          ["Redundancy", "Dual-rail fabric and redundant PSU"],
        ],
        img: "/static/sku/sr-n-ib.jpg",
        imageType: "reference",
      },
    ],
  },
  {
    id: "workstation",
    title: "Workstation",
    blurb: "Engineering and content workstations, quiet enough for the office.",
    illustrative: true,
    products: [
      {
        code: "SR-W310",
        sku: "SR-W310",
        name: "Engineering workstation",
        kind: "Single-socket tower",
        specs: [
          ["CPU", "Threadripper 7960X (24C)"],
          ["GPU", "RTX 5000 Ada 32 GB"],
          ["RAM", "128 GB DDR5"],
          ["Disk", "2× 2 TB NVMe"],
        ],
        img: "/static/sku/sr-w310.jpg",
        imageType: "reference",
      },
      {
        code: "SR-W620",
        sku: "SR-W620",
        name: "Creation & simulation flagship",
        kind: "Dual-GPU tower",
        specs: [
          ["CPU", "Threadripper Pro 7995WX (96C)"],
          ["GPU", "2× RTX 6000 Ada 48 GB"],
          ["RAM", "512 GB DDR5 ECC"],
          ["Disk", "4× 4 TB NVMe"],
        ],
        img: "/static/sku/sr-w620.jpg",
        imageType: "reference",
      },
      {
        code: "SR-W180-EDGE",
        sku: "SR-W180-EDGE",
        name: "Silent edge node",
        kind: "Compact workstation",
        specs: [
          ["CPU", "Ryzen 9 7950X"],
          ["GPU", "RTX 4000 SFF Ada 20 GB"],
          ["RAM", "64 GB DDR5"],
          ["Disk", "1× 4 TB NVMe"],
        ],
        img: "/static/sku/sr-w180.jpg",
        imageType: "reference",
      },
    ],
  },
];

/**
 * 全部参考配置的扁平列表。
 * `/systems` 的计数行、SEO 描述与首页都从这里取数，**不得写死数字**。
 */
export const ALL_PRODUCTS: Product[] = CATEGORIES.flatMap((c) => c.products);

/** 参考配置总数（= 整机 / 存储 / 网络条目数），由数据实时计算。 */
export const REFERENCE_CONFIGURATION_COUNT = ALL_PRODUCTS.length;

export function productsInCategory(id: CategoryId): Product[] {
  return CATEGORIES.find((c) => c.id === id)?.products ?? [];
}

/** 整机（机箱内成品交付）以外的条目：存储与网络设备。 */
export const STORAGE_NETWORK_CODES: string[] = ["storage", "networking"].flatMap((id) =>
  productsInCategory(id as CategoryId).map((p) => p.code),
);

/** 参考配置的示例性质声明。凡展示示例配置的页面都必须带上这句。 */
export const REFERENCE_DISCLAIMER =
  "Every configuration on this page is an example, not a validated build. Compatibility, firmware and availability are confirmed per order.";

// ---------------------------------------------------------------------------
// 两条供给路线对比表（DOCX §4.1）
// ---------------------------------------------------------------------------
export const SUPPLY_ROUTES: {
  heading: string;
  columns: [string, string];
  rows: [string, string, string][];
} = {
  heading: "Two supply routes — and they are not priced the same",
  columns: ["New", "ITAD / certified pre-owned"],
  rows: [
    ["Cost basis", "List or allocation pricing", "Recovered cost — normally a discount to new"],
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

/** DOCX §4.2 影响报价的三个变量。 */
export const QUOTE_DRIVERS: { heading: string; note: string; items: [string, string][] } = {
  heading: "What changes the quote",
  note: "All three are stated in writing in every quote.",
  items: [
    ["System complexity", "A single node and a rack-scale rollout do not quote the same way."],
    ["Stock status", "In stock, on order and on allocation carry different lead times."],
    [
      "Goods condition",
      "New, refurbished and ITAD are priced, paid for and warranted differently.",
    ],
  ],
};
