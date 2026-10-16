/**
 * Seraya 共用产品目录 —— 全站唯一的商品数据源（GPU 加速卡 / 模块）。
 *
 * 两层结构（2026-11 改版）：
 *   1. **型号家族（ModelFamily）** —— 客户认知的单位。「H100」「A100」「RTX PRO 6000
 *      Blackwell」是一个型号，不是一个 SKU。家族承载：名称、用途一句话、slug、参考图、
 *      版本清单。目录页按家族展示。
 *   2. **版本（GpuProduct）** —— 真正可报价、可交付的对象，各自持有独立 SKU、规格、
 *      交付形态与平台要求。详情页与询价指向版本。
 *
 * 为什么必须分层：把 12 个数据条目平铺成 12 张卡片，客户看到的是「SR-H100-SXM」这类
 * 内部编号并列，看不出「H100 有三种形态」这件真正影响采购判断的事；而家族层做不了
 * 报价，版本层又太碎。
 *
 * 硬约束（源自《Seraya 网站方案 v3.0》§6、§13.1.4，本轮继续遵守）：
 *
 * 1. 本文件只承载「产品覆盖」——可接受询价或可评估寻货的范围。
 *    **不是库存声明，也不是价格表。** 不写库存、MOQ、交期、价格、保修年限。
 * 2. 只填写已核实的规格。无法核实的一律标 `verified: false` 并在页面显式标注
 *    「Unverified」，**不得凭记忆补齐或估算**。
 * 3. 不同 Edition / 接口形态 / 显存版本分别建立独立记录，不合并、不互相套用参数。
 *    - H100 SXM / H100 NVL / H100 PCIe 三条独立版本
 *    - RTX PRO 6000 Blackwell Workstation / Max-Q / Server Edition 三条
 *    - A100 80 GB PCIe / A100 80 GB SXM4 两条（**本轮由 variants 数组拆开**）
 *    - RTX 5060 Ti 16 GB / 8 GB 两条（**本轮去掉 variants 交叉引用**）
 * 4. 分组一律通过显式的 `familyId` 完成，**不做产品名截断或模糊字符串匹配**。
 *
 * 规格来源（逐条抓取官方页面核对，2026-11）见每个条目的 `specSource`。
 */

export type GpuCategory = "gaming" | "professional" | "datacenter";

export const CATEGORY_LABEL: Record<GpuCategory, string> = {
  gaming: "Gaming GPUs",
  professional: "Professional GPUs",
  datacenter: "Data center GPUs",
};

/**
 * 供货状态（方案 §6.3）。
 * `pending confirmation` 是最弱、最可逆的声明，未经业务确认的型号一律用它。
 */
export const AVAILABILITY_LABEL = {
  "confirmed lot": "Confirmed supply",
  "sourcing on request": "Sourcing on request",
  "pending confirmation": "Confirm availability",
} as const;

export type AvailabilityStatus = keyof typeof AVAILABILITY_LABEL;

/** 交付形态：决定它能不能直接互换，也决定询价模板里怎么描述。 */
export type FormFactorClass = "card" | "module" | "server";

export const FORM_FACTOR_CLASS_LABEL: Record<FormFactorClass, string> = {
  card: "Add-in card",
  module: "SXM module",
  server: "Complete server",
};

export type SpecRow = {
  label: string;
  value: string;
  /**
   * false = 该值尚未用官方资料核实。页面必须显式标注，不得静默展示。
   * 已核实的行不写这个字段（默认视为已核实）。
   */
  verified?: boolean;
};

export type GpuProduct = {
  /** 稳定产品标识 */
  productId: string;
  /** 所属型号家族。分组只认这个字段。 */
  familyId: string;
  /** 询价关联用的全局唯一 SKU 编号（与整机目录共用 SR- 前缀） */
  sku: string;
  category: GpuCategory;
  /** 版本全名，例如 "NVIDIA RTX PRO 6000 Blackwell Server Edition" */
  modelName: string;
  /** 版本简称，用于选择器与紧凑展示，例如 "Server Edition" */
  versionLabel: string;
  /** 一句话：这个物件是什么形态 */
  formSummary: string;
  formFactorClass: FormFactorClass;
  /** 显存，未核实为 null（不显示该行） */
  memory: string | null;
  condition: string | null;
  availabilityStatus: AvailabilityStatus;
  /** 采购 MOQ 独立维护，可为空 */
  buyerMoq: number | null;
  /** 第一期询价制，不填演示价格 */
  price: number | null;
  currency: string;
  /** 核实时间；未知则为 null，界面不得显示虚构日期 */
  verifiedAt: string | null;
  /** 已核实的规格行 */
  specs: SpecRow[];
  /** 该型号官方规格来源（仅放实际核对过的页面） */
  specSource: { label: string; url: string } | null;
  /** 本记录中仍未经官方资料核实的字段名，页面必须显示 */
  unverifiedNotes: string[];
  /** 该版本适合用在哪里 */
  bestFor: string;
  /** 适配平台 / 使用前提。不同版本不可互换，这里必须写明。 */
  platform: string;
  image: string | null;
  imageType: "reference" | "lot photo" | null;
};

export type ModelFamily = {
  /** 稳定标识，产品通过 familyId 归入 */
  id: string;
  /** 家族名称，客户认知的型号名 */
  name: string;
  /** 目录卡片上的一句话用途 */
  tagline: string;
  /** 详情页路径；null = 本轮未做详情页，用版本摘要替代 */
  slug: string | null;
  category: GpuCategory;
  /** 家族参考图 */
  image: string | null;
  /** 目录排序 */
  order: number;
};

const SRC = {
  h100: { label: "NVIDIA H100", url: "https://www.nvidia.com/en-us/data-center/h100/" },
  a100: { label: "NVIDIA A100", url: "https://www.nvidia.com/en-us/data-center/a100/" },
  rtxProServer: {
    label: "NVIDIA RTX PRO 6000 Blackwell Server Edition",
    url: "https://www.nvidia.com/en-us/data-center/rtx-pro-6000-blackwell-server-edition/",
  },
  rtxProFamily: {
    label: "NVIDIA RTX PRO 6000 Blackwell family",
    url: "https://www.nvidia.com/en-us/products/workstations/professional-desktop-gpus/rtx-pro-6000-family/",
  },
  rtx5090: {
    label: "NVIDIA GeForce RTX 5090",
    url: "https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/",
  },
  rtx5080: {
    label: "NVIDIA GeForce RTX 5080",
    url: "https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5080/",
  },
  rtx5070: {
    label: "NVIDIA GeForce RTX 5070 family",
    url: "https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5070-family/",
  },
  rtx5060: {
    label: "NVIDIA GeForce RTX 5060 family",
    url: "https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5060-family/",
  },
} as const;

// ---------------------------------------------------------------------------
// 型号家族 —— 目录页展示单位
// ---------------------------------------------------------------------------

export const MODEL_FAMILIES: ModelFamily[] = [
  {
    id: "rtx-5090",
    name: "NVIDIA GeForce RTX 5090",
    tagline: "Top-tier gaming and GPU-accelerated creative work.",
    slug: null,
    category: "gaming",
    image: "/static/sku/sr-5090-16x9.jpg?v=3",
    order: 10,
  },
  {
    id: "rtx-5080",
    name: "NVIDIA GeForce RTX 5080",
    tagline: "High-refresh gaming and creative workloads at lower power.",
    slug: null,
    category: "gaming",
    image: "/static/sku/sr-5080-16x9.jpg?v=2",
    order: 20,
  },
  {
    id: "rtx-5070",
    name: "NVIDIA GeForce RTX 5070",
    tagline: "Mainstream gaming and content work in volume builds.",
    slug: null,
    category: "gaming",
    image: "/static/sku/sr-5070-16x9.jpg?v=2",
    order: 30,
  },
  {
    id: "rtx-5060-ti",
    name: "NVIDIA GeForce RTX 5060 Ti",
    tagline: "Volume esports and entry gaming builds, in two memory sizes.",
    slug: null,
    category: "gaming",
    image: "/static/sku/sr-5060-ti-16x9.jpg?v=3",
    order: 40,
  },
  {
    id: "rtx-5060",
    name: "NVIDIA GeForce RTX 5060",
    tagline: "Entry builds and cost-sensitive volume deployment.",
    slug: null,
    category: "gaming",
    image: "/static/sku/sr-5060-16x9.jpg?v=2",
    order: 50,
  },
  {
    id: "rtx-pro-6000-blackwell",
    name: "NVIDIA RTX PRO 6000 Blackwell",
    tagline:
      "96 GB workstation and server GPU. Three editions with different power, cooling and host platforms.",
    slug: "/buy/rtx-pro-6000-blackwell",
    category: "professional",
    image: "/static/sku/sr-rtxpro6000-16x9.jpg?v=3",
    order: 60,
  },
  {
    id: "h100",
    name: "NVIDIA H100",
    tagline: "Training, fine-tuning and high-throughput inference, in three form factors.",
    slug: null,
    category: "datacenter",
    image: "/static/sku/sr-h100-16x9.jpg?v=3",
    order: 70,
  },
  {
    id: "a100",
    name: "NVIDIA A100 80 GB",
    tagline: "Established training and inference platform, in SXM4 and PCIe forms.",
    slug: null,
    category: "datacenter",
    image: "/static/sku/sr-a100-16x9.jpg?v=3",
    order: 80,
  },
];

export const MODEL_FAMILY_COUNT = MODEL_FAMILIES.length;

/** 别名为 `GPU_MODEL_FAMILY_COUNT`：调用点写全名更清楚这是 GPU 目录的家族数。 */
export const GPU_MODEL_FAMILY_COUNT = MODEL_FAMILY_COUNT;

export function familyById(id: string): ModelFamily | undefined {
  return MODEL_FAMILIES.find((f) => f.id === id);
}

/** 目录页用：家族 + 它的全部版本，按 order 排序 */
export type FamilyWithVersions = { family: ModelFamily; versions: GpuProduct[] };

export function familiesWithVersions(categories?: GpuCategory[]): FamilyWithVersions[] {
  return MODEL_FAMILIES.filter((f) => !categories || categories.includes(f.category))
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((family) => ({ family, versions: versionsOfFamily(family.id) }))
    .filter((entry) => entry.versions.length > 0);
}

export function versionsOfFamily(familyId: string): GpuProduct[] {
  return PRODUCTS.filter((p) => p.familyId === familyId);
}

// ---------------------------------------------------------------------------
// 版本记录
// ---------------------------------------------------------------------------

const PRODUCTS: GpuProduct[] = [
  // ------------------------------- Gaming ---------------------------------
  {
    productId: "gpu-rtx-5090",
    familyId: "rtx-5090",
    sku: "SR-5090",
    category: "gaming",
    modelName: "NVIDIA GeForce RTX 5090",
    versionLabel: "32 GB",
    formSummary: "Add-in card · PCIe 5.0 x16",
    formFactorClass: "card",
    memory: "32 GB GDDR7",
    condition: null,
    availabilityStatus: "pending confirmation",
    buyerMoq: null,
    price: null,
    currency: "USD",
    verifiedAt: null,
    specs: [
      { label: "Memory", value: "32 GB GDDR7" },
      { label: "Memory bandwidth", value: "1,792 GB/s" },
      { label: "AI TOPS", value: "3,352" },
      { label: "Interface", value: "PCIe 5.0 x16" },
    ],
    specSource: SRC.rtx5090,
    unverifiedNotes: ["Total graphics power"],
    bestFor: "Top-tier gaming, local inference and GPU-accelerated creative work.",
    platform:
      "Standard desktop or workstation chassis with a free PCIe 5.0 x16 slot and power headroom.",
    image: "/static/sku/sr-5090-16x9.jpg?v=3",
    imageType: "reference",
  },
  {
    productId: "gpu-rtx-5080",
    familyId: "rtx-5080",
    sku: "SR-5080",
    category: "gaming",
    modelName: "NVIDIA GeForce RTX 5080",
    versionLabel: "16 GB",
    formSummary: "Add-in card · PCIe 5.0 x16",
    formFactorClass: "card",
    memory: "16 GB GDDR7",
    condition: null,
    availabilityStatus: "pending confirmation",
    buyerMoq: null,
    price: null,
    currency: "USD",
    verifiedAt: null,
    specs: [
      { label: "Memory", value: "16 GB GDDR7" },
      { label: "Memory bandwidth", value: "960 GB/s" },
      { label: "AI TOPS", value: "1,801" },
      { label: "Interface", value: "PCIe 5.0 x16" },
    ],
    specSource: SRC.rtx5080,
    unverifiedNotes: ["Total graphics power"],
    bestFor: "High-refresh gaming, content work and lighter local AI workloads.",
    platform: "Standard desktop or workstation chassis with a free PCIe 5.0 x16 slot.",
    image: "/static/sku/sr-5080-16x9.jpg?v=2",
    imageType: "reference",
  },
  {
    productId: "gpu-rtx-5070",
    familyId: "rtx-5070",
    sku: "SR-5070",
    category: "gaming",
    modelName: "NVIDIA GeForce RTX 5070",
    versionLabel: "12 GB",
    formSummary: "Add-in card · PCIe 5.0 x16",
    formFactorClass: "card",
    memory: "12 GB GDDR7",
    condition: null,
    availabilityStatus: "pending confirmation",
    buyerMoq: null,
    price: null,
    currency: "USD",
    verifiedAt: null,
    specs: [
      { label: "Memory", value: "12 GB GDDR7" },
      { label: "Memory bandwidth", value: "672 GB/s" },
      { label: "AI TOPS", value: "988" },
      { label: "Interface", value: "PCIe 5.0 x16" },
    ],
    specSource: SRC.rtx5070,
    unverifiedNotes: ["Total graphics power"],
    bestFor: "Mainstream gaming and content production where unit cost matters.",
    platform: "Standard desktop chassis with a free PCIe 5.0 x16 slot.",
    image: "/static/sku/sr-5070-16x9.jpg?v=2",
    imageType: "reference",
  },
  {
    productId: "gpu-rtx-5060-ti-16gb",
    familyId: "rtx-5060-ti",
    sku: "SR-5060TI-16G",
    category: "gaming",
    modelName: "NVIDIA GeForce RTX 5060 Ti 16 GB",
    versionLabel: "16 GB",
    formSummary: "Add-in card · PCIe 5.0 x8",
    formFactorClass: "card",
    memory: "16 GB GDDR7",
    condition: null,
    availabilityStatus: "pending confirmation",
    buyerMoq: null,
    price: null,
    currency: "USD",
    verifiedAt: null,
    specs: [
      { label: "Memory", value: "16 GB GDDR7" },
      { label: "Memory bandwidth", value: "448 GB/s" },
      { label: "AI TOPS", value: "759" },
      { label: "Interface", value: "PCIe 5.0 x8" },
    ],
    specSource: SRC.rtx5060,
    unverifiedNotes: ["Total graphics power"],
    bestFor:
      "Volume builds that need more video memory — larger textures, or local model weights that will not fit in 8 GB.",
    platform:
      "Standard desktop chassis with a free PCIe 5.0 slot. Same GPU silicon as the 8 GB version.",
    image: "/static/sku/sr-5060-ti-16x9.jpg?v=3",
    imageType: "reference",
  },
  {
    productId: "gpu-rtx-5060-ti-8gb",
    familyId: "rtx-5060-ti",
    sku: "SR-5060TI-8G",
    category: "gaming",
    modelName: "NVIDIA GeForce RTX 5060 Ti 8 GB",
    versionLabel: "8 GB",
    formSummary: "Add-in card · PCIe 5.0 x8",
    formFactorClass: "card",
    memory: "8 GB GDDR7",
    condition: null,
    availabilityStatus: "pending confirmation",
    buyerMoq: null,
    price: null,
    currency: "USD",
    verifiedAt: null,
    specs: [
      { label: "Memory", value: "8 GB GDDR7" },
      { label: "Memory bandwidth", value: "448 GB/s" },
      { label: "AI TOPS", value: "759" },
      { label: "Interface", value: "PCIe 5.0 x8" },
    ],
    specSource: SRC.rtx5060,
    unverifiedNotes: ["Total graphics power"],
    bestFor: "Cost-led esports and entry gaming builds where 8 GB of video memory is sufficient.",
    platform:
      "Standard desktop chassis with a free PCIe 5.0 slot. Same GPU silicon as the 16 GB version.",
    image: "/static/sku/sr-5060-ti-16x9.jpg?v=3",
    imageType: "reference",
  },
  {
    productId: "gpu-rtx-5060",
    familyId: "rtx-5060",
    sku: "SR-5060",
    category: "gaming",
    modelName: "NVIDIA GeForce RTX 5060",
    versionLabel: "8 GB",
    formSummary: "Add-in card · PCIe 5.0 x8",
    formFactorClass: "card",
    memory: "8 GB GDDR7",
    condition: null,
    availabilityStatus: "pending confirmation",
    buyerMoq: null,
    price: null,
    currency: "USD",
    verifiedAt: null,
    specs: [
      { label: "Memory", value: "8 GB GDDR7" },
      { label: "Memory bandwidth", value: "448 GB/s" },
      { label: "AI TOPS", value: "614" },
      { label: "Interface", value: "PCIe 5.0 x8" },
    ],
    specSource: SRC.rtx5060,
    unverifiedNotes: ["Total graphics power"],
    bestFor: "Entry builds and the most cost-sensitive volume deployment.",
    platform: "Standard desktop chassis with a free PCIe 5.0 slot.",
    image: "/static/sku/sr-5060-16x9.jpg?v=2",
    imageType: "reference",
  },

  // ---------------------------- Professional ------------------------------
  // RTX PRO 6000 Blackwell 三个 Edition 分别维护。
  // 关键点：Server Edition 显存带宽 1,597 GB/s；Workstation / Max-Q 1,792 GB/s。
  // 三者不可互换：Server Edition 被动散热、面向 OEM 机箱；Workstation 主动风道、双槽全高；
  // Max-Q 是低功耗主动散热版本。
  {
    productId: "gpu-rtx-pro-6000-server",
    familyId: "rtx-pro-6000-blackwell",
    sku: "SR-PRO6000-SE",
    category: "professional",
    modelName: "NVIDIA RTX PRO 6000 Blackwell Server Edition",
    versionLabel: "Server Edition",
    formSummary: "Passive dual-slot card for OEM and rack server integration",
    formFactorClass: "card",
    memory: "96 GB GDDR7 with ECC",
    condition: null,
    availabilityStatus: "pending confirmation",
    buyerMoq: null,
    price: null,
    currency: "USD",
    verifiedAt: null,
    specs: [
      { label: "Edition", value: "Server Edition" },
      { label: "Memory", value: "96 GB GDDR7 with ECC" },
      { label: "Memory bandwidth", value: "1,597 GB/s" },
      { label: "Memory interface", value: "512-bit" },
      { label: "CUDA cores", value: "24,064" },
      { label: "Power consumption", value: "400-600 W (configurable)" },
      { label: "Cooling", value: "Passive — server chassis airflow required" },
      { label: "Form factor", value: '4.4" (H) x 10.5" (L), dual slot' },
      { label: "Interface", value: "PCIe Gen 5 x16" },
    ],
    specSource: SRC.rtxProServer,
    unverifiedNotes: [],
    bestFor:
      "Rack servers and multi-GPU nodes where the chassis supplies airflow and the system sets the power envelope.",
    platform:
      "Requires a server chassis with directed airflow and its own power configuration. This is not a desktop card — do not order it for a workstation.",
    image: "/static/sku/sr-rtxpro6000-16x9.jpg?v=3",
    imageType: "reference",
  },
  {
    productId: "gpu-rtx-pro-6000-workstation",
    familyId: "rtx-pro-6000-blackwell",
    sku: "SR-PRO6000-WS",
    category: "professional",
    modelName: "NVIDIA RTX PRO 6000 Blackwell Workstation Edition",
    versionLabel: "Workstation Edition",
    formSummary: "Active dual-slot card for tower workstations",
    formFactorClass: "card",
    memory: "96 GB GDDR7 with ECC",
    condition: null,
    availabilityStatus: "pending confirmation",
    buyerMoq: null,
    price: null,
    currency: "USD",
    verifiedAt: null,
    specs: [
      { label: "Edition", value: "Workstation Edition" },
      { label: "Memory", value: "96 GB GDDR7 with ECC" },
      { label: "Memory bandwidth", value: "1,792 GB/s" },
      { label: "CUDA cores", value: "24,064" },
      { label: "Power consumption", value: "600 W" },
      { label: "Cooling", value: "Active — double flow-through" },
      { label: "Form factor", value: '5.4" (H) x 12" (L), dual slot' },
      { label: "Interface", value: "PCIe Gen 5 x16" },
    ],
    specSource: SRC.rtxProFamily,
    unverifiedNotes: [],
    bestFor:
      "Tower workstations doing local model training, rendering and simulation at full performance.",
    platform:
      "Needs a full-height tower with double flow-through clearance and a 600 W budget for the card alone.",
    image: "/static/sku/sr-rtxpro6000-16x9.jpg?v=3",
    imageType: "reference",
  },
  {
    productId: "gpu-rtx-pro-6000-maxq",
    familyId: "rtx-pro-6000-blackwell",
    sku: "SR-PRO6000-MQ",
    category: "professional",
    modelName: "NVIDIA RTX PRO 6000 Blackwell Max-Q Workstation Edition",
    versionLabel: "Max-Q Workstation Edition",
    formSummary: "Active dual-slot card, reduced power envelope",
    formFactorClass: "card",
    memory: "96 GB GDDR7 with ECC",
    condition: null,
    availabilityStatus: "pending confirmation",
    buyerMoq: null,
    price: null,
    currency: "USD",
    verifiedAt: null,
    specs: [
      { label: "Edition", value: "Max-Q Workstation Edition" },
      { label: "Memory", value: "96 GB GDDR7 with ECC" },
      { label: "Memory bandwidth", value: "1,792 GB/s" },
      { label: "CUDA cores", value: "24,064" },
      { label: "Power consumption", value: "300 W" },
      { label: "Cooling", value: "Active" },
      { label: "Form factor", value: '4.4" (H) x 10.5" (L), dual slot' },
      { label: "Interface", value: "PCIe Gen 5 x16" },
    ],
    specSource: SRC.rtxProFamily,
    unverifiedNotes: [],
    bestFor:
      "Workstations and deskside units with limited power or cooling headroom that still need 96 GB of GPU memory.",
    platform:
      "Fits smaller workstation chassis than the full Workstation Edition, but the lower power envelope means lower sustained performance.",
    image: "/static/sku/sr-rtxpro6000-16x9.jpg?v=3",
    imageType: "reference",
  },

  // ----------------------------- Data center ------------------------------
  // H100 三个形态分别维护。
  {
    productId: "gpu-h100-sxm",
    familyId: "h100",
    sku: "SR-H100-SXM",
    category: "datacenter",
    modelName: "NVIDIA H100 SXM",
    versionLabel: "SXM5 module",
    formSummary: "SXM5 module · requires an HGX baseboard",
    formFactorClass: "module",
    memory: "80 GB HBM3",
    condition: null,
    availabilityStatus: "pending confirmation",
    buyerMoq: null,
    price: null,
    currency: "USD",
    verifiedAt: null,
    specs: [
      { label: "Form factor", value: "SXM" },
      { label: "GPU memory", value: "80 GB HBM3" },
      { label: "GPU memory bandwidth", value: "3.35 TB/s" },
      { label: "Max TDP", value: "Up to 700 W (configurable)" },
      { label: "Interconnect", value: "NVLink 900 GB/s; PCIe Gen5 128 GB/s" },
      { label: "MIG", value: "Up to 7 instances @ 10 GB" },
      { label: "Host platform", value: "HGX H100 partner/Certified systems with 4 or 8 GPUs" },
    ],
    specSource: SRC.h100,
    unverifiedNotes: [],
    bestFor: "Large-model training and fine-tuning where NVLink bandwidth between GPUs matters.",
    platform:
      "Mounts on an HGX H100 baseboard in a 4- or 8-GPU server. It is a module, not a PCIe card — it cannot be installed in a standard slot.",
    image: "/static/sku/sr-h100-16x9.jpg?v=3",
    imageType: "reference",
  },
  {
    productId: "gpu-h100-nvl",
    familyId: "h100",
    sku: "SR-H100-NVL",
    category: "datacenter",
    modelName: "NVIDIA H100 NVL",
    versionLabel: "NVL (PCIe, NVLink pair)",
    formSummary: "PCIe card · air-cooled, used in NVLink-bridged pairs",
    formFactorClass: "card",
    memory: "94 GB HBM3",
    condition: null,
    availabilityStatus: "pending confirmation",
    buyerMoq: null,
    price: null,
    currency: "USD",
    verifiedAt: null,
    specs: [
      { label: "Form factor", value: "PCIe, dual-slot air-cooled" },
      { label: "GPU memory", value: "94 GB HBM3" },
      { label: "GPU memory bandwidth", value: "3.9 TB/s" },
      { label: "Max TDP", value: "350-400 W per GPU (configurable)" },
      { label: "Interconnect", value: "NVLink 600 GB/s; PCIe Gen5 128 GB/s" },
      { label: "MIG", value: "Up to 7 instances @ 12 GB" },
      { label: "Host platform", value: "Partner/Certified systems with 1-8 GPUs" },
    ],
    specSource: SRC.h100,
    unverifiedNotes: [],
    bestFor:
      "High-throughput inference, especially large language models, where the extra memory per GPU helps fit the model.",
    platform:
      "PCIe card slot. The 350-400 W figure is per GPU — power-plan and quote for the pair, not for a single card.",
    image: "/static/sku/sr-h100-16x9.jpg?v=3",
    imageType: "reference",
  },
  {
    // 官方 H100 页面只公布 SXM 与 NVL 两列，未列 PCIe 单卡行。
    // 因此 PCIe 的显存带宽与功耗在本会话**未取得官方出处**，按约束不写确定值。
    productId: "gpu-h100-pcie",
    familyId: "h100",
    sku: "SR-H100-PCIE",
    category: "datacenter",
    modelName: "NVIDIA H100 PCIe",
    versionLabel: "PCIe",
    formSummary: "Add-in card · fits a standard server slot",
    formFactorClass: "card",
    memory: "80 GB HBM2e",
    condition: null,
    availabilityStatus: "pending confirmation",
    buyerMoq: null,
    price: null,
    currency: "USD",
    verifiedAt: null,
    specs: [
      { label: "Form factor", value: "PCIe Gen5 x16, dual-slot air-cooled", verified: false },
      { label: "GPU memory", value: "80 GB HBM2e", verified: false },
      {
        label: "GPU memory bandwidth",
        value: "Confirm with NVIDIA documentation",
        verified: false,
      },
      { label: "Max TDP", value: "Confirm with NVIDIA documentation", verified: false },
    ],
    specSource: SRC.h100,
    unverifiedNotes: [
      "Memory, bandwidth, TDP and interface for the PCIe form",
      "The NVIDIA H100 product page publishes SXM and NVL columns only; the PCIe row was not available to verify.",
    ],
    bestFor: "Existing servers with free PCIe slots where an SXM baseboard is not an option.",
    platform:
      "Standard PCIe Gen5 x16 slot, with chassis airflow. Not interchangeable with an SXM module.",
    image: "/static/sku/sr-h100-16x9.jpg?v=3",
    imageType: "reference",
  },
  {
    // 2026-11：A100 由「一条记录 + variants 数组混放两套规格」拆成两条独立版本。
    // 拆分后每条只持有自己形态的参数，页面不再出现「A100 80 GB PCIe — bandwidth」这类
    // 需要客户自己挑行的写法。家族级入口 `#a100` 仍然有效。
    productId: "gpu-a100-pcie",
    familyId: "a100",
    sku: "SR-A100-PCIE",
    category: "datacenter",
    modelName: "NVIDIA A100 80 GB PCIe",
    versionLabel: "80 GB PCIe",
    formSummary: "Add-in card · PCIe 4.0 x16",
    formFactorClass: "card",
    memory: "80 GB HBM2e",
    condition: null,
    availabilityStatus: "pending confirmation",
    buyerMoq: null,
    price: null,
    currency: "USD",
    verifiedAt: null,
    specs: [
      {
        label: "Form factor",
        value: "PCIe, dual-slot air-cooled or single-slot liquid-cooled",
      },
      { label: "GPU memory", value: "80 GB HBM2e" },
      { label: "GPU memory bandwidth", value: "1,935 GB/s" },
      { label: "Max TDP", value: "300 W" },
      { label: "Interconnect", value: "NVLink bridge for 2 GPUs: 600 GB/s; PCIe Gen4 64 GB/s" },
      { label: "MIG", value: "Up to 7 instances @ 10 GB" },
      { label: "Host platform", value: "Partner/Certified systems with 1-8 GPUs" },
    ],
    specSource: SRC.a100,
    unverifiedNotes: [],
    bestFor:
      "Adding 80 GB accelerators to an existing PCIe server, or two-GPU NVLink pairs in one chassis.",
    platform:
      "Standard PCIe Gen4 x16 slot. Lower memory bandwidth than SXM4 and no HGX baseboard — the two forms are not interchangeable.",
    image: "/static/sku/sr-a100-16x9.jpg?v=3",
    imageType: "reference",
  },
  {
    productId: "gpu-a100-sxm4",
    familyId: "a100",
    sku: "SR-A100-SXM4",
    category: "datacenter",
    modelName: "NVIDIA A100 80 GB SXM4",
    versionLabel: "80 GB SXM4",
    formSummary: "SXM4 module · requires an HGX A100 baseboard",
    formFactorClass: "module",
    memory: "80 GB HBM2e",
    condition: null,
    availabilityStatus: "pending confirmation",
    buyerMoq: null,
    price: null,
    currency: "USD",
    verifiedAt: null,
    specs: [
      { label: "Form factor", value: "SXM4" },
      { label: "GPU memory", value: "80 GB HBM2e" },
      { label: "GPU memory bandwidth", value: "2,039 GB/s" },
      { label: "Max TDP", value: "400 W (standard configuration)" },
      { label: "Interconnect", value: "NVLink 600 GB/s; PCIe Gen4 64 GB/s" },
      { label: "MIG", value: "Up to 7 instances @ 10 GB" },
      {
        label: "Host platform",
        value: "HGX A100 partner/Certified systems with 4, 8 or 16 GPUs",
      },
    ],
    specSource: SRC.a100,
    unverifiedNotes: [],
    bestFor:
      "Dense multi-GPU training nodes where the higher SXM4 memory bandwidth and NVLink fabric are needed.",
    platform:
      "Mounts on an HGX A100 baseboard in a 4-, 8- or 16-GPU server. It is a module, not a PCIe card.",
    image: "/static/sku/sr-a100-16x9.jpg?v=3",
    imageType: "reference",
  },
];

export const GPU_PRODUCTS: GpuProduct[] = PRODUCTS;

/** 可报价版本总数（≠ 型号家族数）。公开文案必须区分这两个数字。 */
export const GPU_VERSION_COUNT = GPU_PRODUCTS.length;

export function productsByCategory(category: GpuCategory): GpuProduct[] {
  return GPU_PRODUCTS.filter((p) => p.category === category);
}

export function productBySku(sku: string): GpuProduct | undefined {
  return GPU_PRODUCTS.find((p) => p.sku === sku);
}

export function productByProductId(productId: string): GpuProduct | undefined {
  return GPU_PRODUCTS.find((p) => p.productId === productId);
}

// ---------------------------------------------------------------------------
// 展示辅助
// ---------------------------------------------------------------------------

/** MOQ 为空时显示固定文案，不显示 0，也不留空白占位。 */
export const MOQ_ON_REQUEST = "MOQ on request";

/** 第一期询价制；不显示演示价格。 */
export const PRICE_ON_REQUEST = "Quoted per enquiry";

export function availabilityText(product: GpuProduct): string {
  const label = AVAILABILITY_LABEL[product.availabilityStatus];
  if (product.availabilityStatus === "confirmed lot" && product.verifiedAt) {
    return `${label} — checked ${product.verifiedAt}`;
  }
  return label;
}

export function moqText(product: GpuProduct): string {
  return product.buyerMoq === null ? MOQ_ON_REQUEST : `${product.buyerMoq}+ units`;
}

export function priceText(product: GpuProduct): string {
  if (product.price === null) return PRICE_ON_REQUEST;
  return `${product.currency} ${product.price.toLocaleString("en-US")}`;
}

/** 该记录是否含未核实字段 —— 页面据此决定要不要显示核实提示。 */
export function hasUnverifiedSpecs(product: GpuProduct): boolean {
  return product.unverifiedNotes.length > 0 || product.specs.some((s) => s.verified === false);
}

/** 版本摘要文案：目录卡片用它，避免把全部规格塞进卡片。 */
export function versionSummary(versions: GpuProduct[]): string {
  if (versions.length === 1) return versions[0].versionLabel;
  return versions.map((v) => v.versionLabel).join(" · ");
}

/**
 * 版本之间的差异要点。只在数据里确实存在差异时才生成，
 * 不为了凑满对比行而编造对比项。
 */
export function versionDifferences(versions: GpuProduct[]): { label: string; values: string[] }[] {
  const pick = (label: string, matcher: (specLabel: string) => boolean) => {
    const values = versions.map(
      (v) => v.specs.find((s) => matcher(s.label.toLowerCase()))?.value ?? "—",
    );
    if (values.every((x) => x === values[0])) return null;
    return { label, values };
  };

  const rows = [
    pick("Memory bandwidth", (l) => l.includes("bandwidth")),
    pick("Power", (l) => l.includes("tdp") || l.includes("power")),
    pick("Cooling", (l) => l.includes("cooling")),
    pick("Form factor", (l) => l.includes("form factor")),
    pick("Interface", (l) => l.includes("interface")),
  ].filter((r): r is { label: string; values: string[] } => r !== null);

  return rows;
}
