/**
 * GPU 产品目录 —— 单一结构化数据源（《Seraya 网站方案 v3.0》§6）
 *
 * 设计约束，全部来自方案原文，不得放宽：
 *
 * 1. §6.1 三类信息必须分开：产品覆盖 / 已确认可供批次 / 收购需求。
 *    本文件只承载「产品覆盖」——即 Seraya 可接受询价或可评估寻货的型号范围。
 *    **它不是库存声明，也不是价格表。**
 *
 * 2. §6.2 字段：无法核实的字段一律留 `null`，由界面渲染成中性文案，
 *    **不得编造型号细节、规格、数量或价格**。
 *
 * 3. §6.3 供货状态：本文件所有型号默认 `pending confirmation`，
 *    对外显示 `Confirm availability`（方案 §6.3 中对「型号可接受询问，
 *    但当前数量或交期需重新确认」的定义）。这是最弱、最可逆的声明。
 *    **CY 需按真实业务能力逐型号改成 `confirmed lot` 或 `sourcing on request`。**
 *    `[date]` 是方案里的占位符，原文明确「不得原样发布」，故此处不预填日期。
 *
 * 4. §6.4 型号范围仅来自方案列出的资料收集范围
 *    （RTX 5090 / 5080 / 5070 / 5060·Ti、RTX PRO 6000、A100、H100），
 *    原文明确「此列表是资料收集范围，不是现货声明」。
 *
 * 5. §7.1 价格：第一期以询价制为默认，**不填演示价格**。故 `price` 全部为 `null`。
 */

export type GpuCategory = "gaming" | "professional" | "datacenter";

export const CATEGORY_LABEL: Record<GpuCategory, string> = {
  gaming: "Gaming GPUs",
  professional: "Professional GPUs",
  datacenter: "Data center GPUs",
};

/** §6.3 内部状态 -> 对外显示文案 */
export const AVAILABILITY_LABEL = {
  "confirmed lot": "Confirmed supply",
  "sourcing on request": "Sourcing on request",
  "pending confirmation": "Confirm availability",
} as const;

export type AvailabilityStatus = keyof typeof AVAILABILITY_LABEL;

export type GpuProduct = {
  /** 目录卡片显示的商品编号（与整机目录同一套 SR- 前缀） */
  code: string;
  /** §6.2 稳定产品标识，用于询盘关联 */
  productId: string;
  category: GpuCategory;
  /** §6.2 正确完整名称；型号变体分别维护，不把芯片名当完整 SKU（§4.4） */
  modelName: string;
  brand: string | null;
  /** §6.2 仅填写已核实的规格；本仓库暂无已核实数据，故为 null */
  memory: string | null;
  formFactor: string | null;
  condition: string | null;
  availabilityStatus: AvailabilityStatus;
  /** §6.2 采购 MOQ 独立维护，可为空 */
  buyerMoq: number | null;
  /** §7.1 第一期询价制，不填演示价格 */
  price: number | null;
  currency: string;
  /** §6.2 核实时间；未知则为 null，界面不得显示虚构日期 */
  verifiedAt: string | null;
  /**
   * §6.2「仅填写已核实的规格」—— 留空即不显示该行，**不得编造**。
   * 填入格式：{ label: "Memory", value: "80 GB" }
   * 数据来源必须是业务确认或厂商官方规格，并在提交说明中注明。
   */
  specs?: { label: string; value: string }[];
  /** §6.4 参考图与实际批次图必须区分 */
  image: string | null;
  imageType: "reference" | "lot photo" | null;
};

const PRODUCTS: GpuProduct[] = [
  // --- Gaming（§4.4：RTX 5090 / 5080 / 5070 / 5060 与 Ti 版本按准确商品资料建立记录）---
  {
    productId: "gpu-rtx-5090",
    code: "SR-5090",
    specs: [{ label: "Memory", value: "32 GB GDDR7" }],   // NVIDIA 官方规格；单一显存版本
    category: "gaming",
    modelName: "GeForce RTX 5090",
    brand: null,
    memory: null,
    formFactor: null,
    condition: null,
    availabilityStatus: "pending confirmation",
    buyerMoq: null,
    price: null,
    currency: "USD",
    verifiedAt: null,
    image: "/static/sku/sr-5090-16x9.jpg?v=3",
    imageType: "reference",
  },
  {
    productId: "gpu-rtx-5080",
    code: "SR-5080",
    specs: [{ label: "Memory", value: "16 GB GDDR7" }],   // NVIDIA 官方规格；单一显存版本
    category: "gaming",
    modelName: "GeForce RTX 5080",
    brand: null,
    memory: null,
    formFactor: null,
    condition: null,
    availabilityStatus: "pending confirmation",
    buyerMoq: null,
    price: null,
    currency: "USD",
    verifiedAt: null,
    image: "/static/sku/sr-5080-16x9.jpg?v=2",
    imageType: "reference",
  },
  {
    productId: "gpu-rtx-5070",
    code: "SR-5070",
    specs: [{ label: "Memory", value: "12 GB GDDR7" }],   // NVIDIA 官方规格；单一显存版本
    category: "gaming",
    modelName: "GeForce RTX 5070",
    brand: null,
    memory: null,
    formFactor: null,
    condition: null,
    availabilityStatus: "pending confirmation",
    buyerMoq: null,
    price: null,
    currency: "USD",
    verifiedAt: null,
    image: "/static/sku/sr-5070-16x9.jpg?v=2",
    imageType: "reference",
  },
  {
    productId: "gpu-rtx-5060-ti",
    code: "SR-5060TI",
    specs: [{ label: "Memory", value: "8 GB / 16 GB GDDR7" }],   // 该芯片有 8GB 与 16GB 两个版本，故并列，不单选
    category: "gaming",
    modelName: "GeForce RTX 5060 Ti",
    brand: null,
    memory: null,
    formFactor: null,
    condition: null,
    availabilityStatus: "pending confirmation",
    buyerMoq: null,
    price: null,
    currency: "USD",
    verifiedAt: null,
    image: "/static/sku/sr-5060-ti-16x9.jpg?v=3",
    imageType: "reference",
  },
  {
    productId: "gpu-rtx-5060",
    code: "SR-5060",
    specs: [{ label: "Memory", value: "8 GB GDDR7" }],   // NVIDIA 官方规格；单一显存版本
    category: "gaming",
    modelName: "GeForce RTX 5060",
    brand: null,
    memory: null,
    formFactor: null,
    condition: null,
    availabilityStatus: "pending confirmation",
    buyerMoq: null,
    price: null,
    currency: "USD",
    verifiedAt: null,
    image: "/static/sku/sr-5060-16x9.jpg?v=2",
    imageType: "reference",
  },

  // --- Professional（§4.4：避免把不同代际的 RTX 6000 类产品合并）---
  {
    productId: "gpu-rtx-pro-6000-blackwell",
    code: "SR-PRO6000",
    specs: [{ label: "Memory", value: "96 GB GDDR7" }],   // 与仓库 /purchasing 收购口径「RTX PRO 6000 (Blackwell 96GB)」一致
    category: "professional",
    modelName: "NVIDIA RTX PRO 6000 Blackwell",
    brand: null,
    memory: null,
    formFactor: null,
    condition: null,
    availabilityStatus: "pending confirmation",
    buyerMoq: null,
    price: null,
    currency: "USD",
    verifiedAt: null,
    image: "/static/sku/sr-rtxpro6000-16x9.jpg?v=3",
    imageType: "reference",
  },

  // --- Data center（§6.2：数据中心产品说明供货形态；形态未知故留空）---
  {
    productId: "gpu-h100",
    code: "SR-H100",
    specs: [{ label: "Memory", value: "80 GB / 94 GB HBM" }],   // 80GB(PCIe/SXM) 与 94GB(NVL) 两种形态；NVL 94GB 见整机目录
    category: "datacenter",
    modelName: "NVIDIA H100",
    brand: null,
    memory: null,
    formFactor: null,
    condition: null,
    availabilityStatus: "pending confirmation",
    buyerMoq: null,
    price: null,
    currency: "USD",
    verifiedAt: null,
    image: "/static/sku/sr-h100-16x9.jpg?v=3",
    imageType: "reference",
  },
  {
    productId: "gpu-a100",
    code: "SR-A100",
    specs: [{ label: "Memory", value: "80 GB HBM2e" }],   // 与仓库 /purchasing 收购口径「A100 (80GB)」一致
    category: "datacenter",
    modelName: "NVIDIA A100",
    brand: null,
    memory: null,
    formFactor: null,
    condition: null,
    availabilityStatus: "pending confirmation",
    buyerMoq: null,
    price: null,
    currency: "USD",
    verifiedAt: null,
    image: "/static/sku/sr-a100-16x9.jpg?v=3",
    imageType: "reference",
  },
];

export const GPU_PRODUCTS = PRODUCTS;

export function productsByCategory(category: GpuCategory): GpuProduct[] {
  return PRODUCTS.filter((p) => p.category === category);
}

/** §6.2：MOQ 为空时显示固定文案，不显示 0 */
export const MOQ_ON_REQUEST = "MOQ on request";

/** §7.1：第一期询价制；不显示演示价格 */
export const PRICE_ON_REQUEST = "Quoted per enquiry";

export function availabilityText(product: GpuProduct): string {
  const label = AVAILABILITY_LABEL[product.availabilityStatus];
  // §6.3 仅 confirmed lot 携带核实日期；没有核实日期时不得拼出空日期
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
