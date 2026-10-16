/**
 * 站内询价表单（渐进展开版，2026-11）。
 *
 * 设计约束（本轮明确要求，全部落到这里）：
 *   - **表单本身是普通 HTML form POST 到 /api/rfq**，因此 JS 未执行也能提交。
 *     前端 JS 只是增强（内联校验、保持页面、防重复提交），不是唯一通路。
 *   - 成功反馈只能来自服务端确认。`data-rfq-form` 的 JS 分支只在收到 2xx 且
 *     `ok:true` 时替换为成功卡；失败显示服务端返回的真实原因。
 *   - 失败时服务端回吐全部已填字段，页面不回退输入。
 *   - 默认只显示核心五项（需求类型、产品或需求、数量、目的地、邮箱）。
 *     公司 / 目标日期 / 成色偏好 / 备注收在「补充信息（选填）」折叠区。
 *   - `sku` 与 `config` 是**隐藏上下文**：客户不认识内部编号，不暴露为可填字段。
 *   - 「每系统卡数」只在整机需求下出现。
 *   - 产品详情页已确定的型号与版本会带过来，并显示简短的「询价内容」摘要，
 *     避免要求客户重复填写。
 *   - 附件上传：**不提供**。没有可用的收件存储与扫描流程，做了就是假入口。
 */

import {
  CONTACT_EMAIL,
  REQUIRED_RFQ_FIELDS,
  RFQ_CORE_FIELDS,
  RFQ_ENDPOINT,
  RFQ_EXTRA_FIELDS,
  RFQ_PATH_ORDER,
  RFQ_PATHS,
  RFQ_SYSTEM_ONLY_FIELDS,
  type RfqField,
  type RfqFieldKey,
  type RfqPathKey,
  fieldsForPath,
  quantityLabelForPath,
} from "./rfq";

export type RfqPrefill = {
  /** 路径 key（"gpu" / "system" …）。若传入下拉框显示文案，会被自动归一化。 */
  path?: RfqPathKey | string;
  sku?: string;
  requirement?: string;
  config?: string;
  quantity?: string;
  cardsPerSystem?: string;
  destination?: string;
  email?: string;
  company?: string;
  targetDate?: string;
  condition?: string;
  notes?: string;
  source?: string;
  /** 摘要里额外显示一行，例如「Model：NVIDIA RTX PRO 6000 Blackwell」 */
  familyName?: string;
  /** true = 客户选择「需要协助选型」，此时不伪装成已选具体 SKU */
  assist?: boolean;
};

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizePath(value: string | undefined): RfqPathKey {
  if (!value) return "gpu";
  if ((RFQ_PATH_ORDER as string[]).includes(value)) return value as RfqPathKey;
  const byLabel = RFQ_PATH_ORDER.find((k) => RFQ_PATHS[k].label === value);
  return byLabel ?? "gpu";
}

/** 「询价内容」摘要：只列出客户已经确定的东西，不重复要求填写。 */
function enquirySummary(prefill: RfqPrefill, selectedPath: RfqPathKey): string {
  const rows: [string, string][] = [["Requirement", RFQ_PATHS[selectedPath].label]];
  if (prefill.familyName) rows.push(["Model", prefill.familyName]);
  if (prefill.assist) {
    rows.push(["Version", "Not decided — please advise"]);
  } else if (prefill.config) {
    rows.push(["Version", prefill.config]);
  }
  if (prefill.sku && !prefill.assist) rows.push(["Reference", prefill.sku]);
  if (prefill.requirement && !prefill.familyName) {
    rows.push(["Product or requirement", prefill.requirement]);
  }

  return `
        <div class="rfq-summary" aria-label="What this enquiry covers">
          <h3>What this enquiry covers</h3>
          <dl class="rfq-summary-rows">
${rows
  .map(
    ([k, v]) =>
      `            <div><dt>${escapeHtml(k)}</dt><dd${
        // 需求类型会在页面上被切换，摘要必须跟着变，否则会显示与下拉框矛盾的内容。
        // 打标记给脚本同步（见 public/legacy/script.js 的 initRfqPathSwitch）。
        k === "Requirement" ? ' data-rfq-summary="requirement"' : ""
      }>${escapeHtml(v)}</dd></div>`,
  )
  .join("\n")}
          </dl>
          <p class="muted rfq-summary-note">
            Filled in from the page you came from, so you only complete the items below.
          </p>
        </div>`;
}

export function renderRfqForm(
  prefill: RfqPrefill = {},
  options: { errors?: { field: string; message: string }[]; formId?: string } = {},
): string {
  const errors = options.errors ?? [];
  const errorFor = (key: string) => errors.find((e) => e.field === key)?.message;
  const formError = errors.find((e) => e.field === "form")?.message;
  const formId = options.formId ?? "rfq-form";
  const selectedPath = normalizePath(typeof prefill.path === "string" ? prefill.path : undefined);
  const pathLabel = RFQ_PATHS[selectedPath].label;
  const visibleKeys = fieldsForPath(pathLabel);

  const extraFields = RFQ_EXTRA_FIELDS.filter((f) => visibleKeys.has(f.key));
  const extraHasError = extraFields.some((f) => errorFor(f.key));
  const systemField = RFQ_SYSTEM_ONLY_FIELDS[0];
  const showSystemField = selectedPath === "system";

  const errorSummary = errors.length
    ? `        <div class="rfq-errors" role="alert" tabindex="-1" id="${formId}-errors">
          <h3>We could not send that yet</h3>
          <ul>
${errors
  .filter((e) => e.field !== "form")
  .map(
    (e) =>
      `            <li><a href="#${formId}-${escapeHtml(e.field)}">${escapeHtml(e.message)}</a></li>`,
  )
  .join("\n")}
          </ul>
        </div>`
    : "";

  const renderField = (def: RfqField) => {
    const value = (prefill[def.key as keyof RfqPrefill] as string | undefined) ?? "";
    const err = errorFor(def.key);
    const id = `${formId}-${def.key}`;
    const describedBy = [err ? `${id}-error` : "", def.hint ? `${id}-hint` : ""]
      .filter(Boolean)
      .join(" ");
    const label = def.key === "quantity" ? quantityLabelForPath(pathLabel) : def.label;
    const common = [
      `id="${id}"`,
      `name="${def.key}"`,
      def.required ? "required" : "",
      `maxlength="${def.maxLength}"`,
      describedBy ? `aria-describedby="${describedBy}"` : "",
      err ? 'aria-invalid="true"' : "",
    ]
      .filter(Boolean)
      .join(" ");

    let control = "";
    if (def.type === "textarea") {
      control = `<textarea class="rfq-input rfq-textarea" ${common} rows="3" placeholder="${escapeHtml(
        def.placeholder ?? "",
      )}">${escapeHtml(value)}</textarea>`;
    } else if (def.type === "select") {
      const opts =
        def.key === "path" ? RFQ_PATH_ORDER.map((k) => RFQ_PATHS[k].label) : (def.options ?? []);
      control = `<select class="rfq-input rfq-select" ${common}>
${opts
  .map((opt) => {
    const isSelected =
      def.key === "path" ? opt === pathLabel : String(value) === opt || (!value && opt === opts[0]);
    return `                <option value="${escapeHtml(opt)}"${isSelected ? " selected" : ""}>${escapeHtml(opt)}</option>`;
  })
  .join("\n")}
              </select>`;
    } else {
      const type = def.type === "email" ? "email" : def.type === "number" ? "number" : "text";
      control = `<input class="rfq-input" type="${type}" ${common} value="${escapeHtml(value)}" placeholder="${escapeHtml(
        def.placeholder ?? "",
      )}" ${def.type === "number" ? 'min="1" step="1" inputmode="numeric"' : ""} />`;
    }

    const spanClass = def.key === "requirement" || def.key === "notes" ? " rfq-field-full" : "";
    return `            <div class="rfq-field${spanClass}${err ? " has-error" : ""}">
              <label for="${id}">${escapeHtml(label)}${
                def.required
                  ? ' <span class="rfq-required" aria-hidden="true">*</span>'
                  : ' <span class="rfq-optional">optional</span>'
              }</label>
${control}
${def.hint ? `              <p class="rfq-hint" id="${id}-hint">${escapeHtml(def.hint)}</p>` : ""}
${err ? `              <p class="rfq-error" id="${id}-error">${escapeHtml(err)}</p>` : ""}
            </div>`;
  };

  const coreBlock = RFQ_CORE_FIELDS.filter((f) => visibleKeys.has(f.key)).map(renderField);

  return `
        <form class="rfq-form" id="${formId}" data-rfq-form method="post" action="${RFQ_ENDPOINT}" novalidate>
          <input type="hidden" name="source" value="${escapeHtml(prefill.source ?? "")}" />
          <input type="hidden" name="sku" value="${escapeHtml(prefill.sku ?? "")}" />
          <input type="hidden" name="config" value="${escapeHtml(prefill.config ?? "")}" />
          <div class="rfq-honeypot" aria-hidden="true">
            <label for="${formId}-website">Website (leave this empty)</label>
            <input id="${formId}-website" name="website" type="text" tabindex="-1" autocomplete="off" />
          </div>
${enquirySummary(prefill, selectedPath)}
${formError ? `          <p class="rfq-error rfq-form-error" role="alert">${escapeHtml(formError)}</p>` : ""}
${errorSummary}
          <div class="rfq-grid">
${coreBlock.join("\n")}
          </div>
${
  showSystemField
    ? `          <div class="rfq-grid rfq-system-row" data-rfq-system-row>
${renderField(systemField)}
          </div>`
    : ""
}
          <details class="rfq-extra" data-rfq-extra${extraHasError ? " open" : ""}>
            <summary>Additional information <span class="rfq-optional">optional</span></summary>
            <div class="rfq-grid">
${extraFields.map((f) => renderField(f)).join("\n")}
            </div>
          </details>
          <div class="rfq-submit-row">
            <button type="submit" class="btn btn-primary" data-rfq-submit>Send enquiry</button>
            <p class="muted rfq-submit-note">
              <span class="rfq-required">*</span> required. The rest is optional and only shortens the back-and-forth.
            </p>
          </div>
          <p class="muted rfq-alt">
            Prefer email? Write to <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a> with the subject tag
            <code>[Buyer RFQ]</code>. Attachments are handled by reply &mdash; this form does not accept file uploads.
          </p>
          <p class="rfq-status" data-rfq-status role="status" aria-live="polite" hidden></p>
        </form>`;
}

/** 服务端渲染的成功卡：只有接收到真实提交结果后才出现。 */
export function renderRfqSuccess(reference: string, viaEmailFallback: boolean): string {
  return `
        <div class="rfq-success" role="status">
          <h3>Enquiry received</h3>
          <p class="muted">
            Reference <strong>${escapeHtml(reference)}</strong>. We respond to complete RFQs within one business day.
          </p>
          <p class="muted">
            ${
              viaEmailFallback
                ? "It has been delivered through our mailbox."
                : "Our team has been notified by email."
            }
            If you need to add attachments or correct anything, reply to
            <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.
          </p>
        </div>`;
}

/** 服务端未配置投递通道时的真实错误卡（不是成功）。 */
export function renderRfqUnavailable(): string {
  return `
        <div class="rfq-error-panel" role="alert">
          <h3>Online submission is not available right now</h3>
          <p class="muted">
            The form endpoint is reachable but no delivery channel is configured on the server, so nothing was sent.
            Please email the same details to <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a> and we will pick it up.
          </p>
        </div>`;
}

export { REQUIRED_RFQ_FIELDS };
