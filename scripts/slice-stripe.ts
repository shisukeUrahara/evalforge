/**
 * Fetches stripe/openapi spec3.json at a pinned commit and writes the small set
 * of refund-related slices EvalForge cases cite. Run: pnpm tsx scripts/slice-stripe.ts
 * The full spec is ~8 MB; only its sha256 is kept, plus the slices.
 */
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";

const COMMIT = "b213739d4879835a5af50f15daaa3a41ae267985";
const PATH = "openapi/spec3.json";
const URL = `https://raw.githubusercontent.com/stripe/openapi/${COMMIT}/${PATH}`;
const FORM = "requestBody/content/application~1x-www-form-urlencoded/schema/properties";

/** [short id, JSON pointer, title]. Short ids are easy for a model to cite exactly. */
const PICK: [string, string, string][] = [
  ["stripe:refunds.create", "/paths/~1v1~1refunds/post/description", "Create a refund"],
  ["stripe:refunds.create.charge", `/paths/~1v1~1refunds/post/${FORM}/charge/description`, "Create a refund: charge"],
  ["stripe:refunds.create.payment_intent", `/paths/~1v1~1refunds/post/${FORM}/payment_intent/description`, "Create a refund: payment_intent"],
  ["stripe:refunds.create.reason", `/paths/~1v1~1refunds/post/${FORM}/reason/description`, "Create a refund: reason"],
  ["stripe:refunds.create.refund_application_fee", `/paths/~1v1~1refunds/post/${FORM}/refund_application_fee/description`, "Create a refund: refund_application_fee"],
  ["stripe:refunds.create.reverse_transfer", `/paths/~1v1~1refunds/post/${FORM}/reverse_transfer/description`, "Create a refund: reverse_transfer"],
  ["stripe:refunds.create.instructions_email", `/paths/~1v1~1refunds/post/${FORM}/instructions_email/description`, "Create a refund: instructions_email"],
  ["stripe:refunds.create.customer", `/paths/~1v1~1refunds/post/${FORM}/customer/description`, "Create a refund: customer"],
  ["stripe:refunds.update", "/paths/~1v1~1refunds~1{refund}/post/description", "Update a refund"],
  ["stripe:refunds.cancel", "/paths/~1v1~1refunds~1{refund}~1cancel/post/description", "Cancel a refund"],
  ["stripe:refund.amount", "/components/schemas/refund/properties/amount/description", "Refund object: amount"],
  ["stripe:refund.status", "/components/schemas/refund/properties/status/description", "Refund object: status"],
  ["stripe:refund.reason", "/components/schemas/refund/properties/reason/description", "Refund object: reason"],
  ["stripe:refund.failure_reason", "/components/schemas/refund/properties/failure_reason/description", "Refund object: failure_reason"],
  ["stripe:refund.pending_reason", "/components/schemas/refund/properties/pending_reason/description", "Refund object: pending_reason"],
  ["stripe:refund.receipt_number", "/components/schemas/refund/properties/receipt_number/description", "Refund object: receipt_number"],
  ["stripe:charge.amount_refunded", "/components/schemas/charge/properties/amount_refunded/description", "Charge object: amount_refunded"],
  ["stripe:charge.refunded", "/components/schemas/charge/properties/refunded/description", "Charge object: refunded"],
];

function at(doc: unknown, pointer: string): unknown {
  return pointer
    .split("/")
    .slice(1)
    .map((p) => p.replace(/~1/g, "/").replace(/~0/g, "~"))
    .reduce<unknown>((node, key) => (node as Record<string, unknown> | undefined)?.[key], doc);
}

/** Spec descriptions are small HTML/markdown fragments. Keep the words, drop the markup. */
export function plain(html: string): string {
  return html
    .replace(/<\/p>\s*<p>/g, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/&rsquo;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

const sha = (s: string | Uint8Array) => createHash("sha256").update(s).digest("hex");

async function main() {
  const res = await fetch(URL);
  if (!res.ok) throw new Error(`GET ${URL}: ${res.status}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  const spec = JSON.parse(new TextDecoder().decode(bytes));
  const slices = PICK.map(([id, pointer, title]) => {
    const raw = at(spec, pointer);
    if (typeof raw !== "string" || raw.trim() === "") throw new Error(`${pointer}: no description at this commit`);
    return { id, pointer, title, text: plain(raw) };
  });
  mkdirSync("fixtures/stripe", { recursive: true });
  writeFileSync("fixtures/stripe/slice.json", JSON.stringify(slices, null, 2) + "\n");
  const manifest = {
    repo: "https://github.com/stripe/openapi",
    commit: COMMIT,
    path: PATH,
    license: "MIT",
    api_version: spec.info?.version,
    spec_sha256: sha(bytes),
    retrieved_at: new Date().toISOString().slice(0, 10),
    slices: slices.map((s) => ({ id: s.id, pointer: s.pointer, sha256: sha(s.text) })),
  };
  writeFileSync("fixtures/stripe/source_manifest.json", JSON.stringify(manifest, null, 2) + "\n");
  console.log(`${slices.length} slices, spec sha256 ${manifest.spec_sha256}`);
}

if (process.argv[1]?.endsWith("slice-stripe.ts")) void main();
