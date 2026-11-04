import { readFileSync } from "node:fs";

export interface Rule {
  id: string; // "ns:NS-R1"
  title: string;
  text: string;
  /** Key values a matching answer must state, e.g. ["30 days"]. Empty when the rule has no number. */
  values: string[];
}

/** Parses a Northstar policy file: "## NS-R<n> Title", rule text, "Values: a, b" (or "none"). */
export function parsePolicy(markdown: string): Rule[] {
  if (!/^SYNTHETIC\./m.test(markdown)) throw new Error("policy file must carry the SYNTHETIC notice");
  const rules: Rule[] = [];
  for (const block of markdown.split(/^## /m).slice(1)) {
    const [head, ...body] = block.trim().split("\n");
    const m = head.match(/^(NS-R\d+) (.+)$/);
    if (!m) throw new Error(`bad rule heading: ${head}`);
    const valuesLine = body.find((l) => l.startsWith("Values:"));
    if (!valuesLine) throw new Error(`${m[1]} has no Values line`);
    const raw = valuesLine.slice("Values:".length).trim();
    rules.push({
      id: `ns:${m[1]}`,
      title: m[2],
      text: body.filter((l) => l !== valuesLine).join("\n").trim(),
      values: raw === "none" ? [] : raw.split(",").map((v) => v.trim()),
    });
  }
  return rules;
}

export const loadPolicy = (file: string): Rule[] => parsePolicy(readFileSync(file, "utf8"));
