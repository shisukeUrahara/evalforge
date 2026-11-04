import type { Rule } from "../context/northstar";
import type { AnswerOutput, Case } from "../domain/schemas";

const SMALL = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS: Record<string, number> = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };

/** "thirty days" -> "30 days", "forty-five" -> "45", "fifty percent" -> "50 percent". Lowercases. */
export function normalizeNumbers(text: string): string {
  let s = text.toLowerCase();
  s = s.replace(/\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)[- ](one|two|three|four|five|six|seven|eight|nine)\b/g, (_m, t: string, u: string) => String(TENS[t] + SMALL.indexOf(u)));
  s = s.replace(/\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)\b/g, (t) => String(TENS[t]));
  s = s.replace(new RegExp(`\\b(${SMALL.join("|")})\\b`, "g"), (w) => String(SMALL.indexOf(w)));
  return s;
}

/** A rule value like "30 days", "$7", "50%", "1 year", "5 business days" as a tolerant regex over normalized text. */
export function valuePattern(value: string): RegExp {
  const v = value.toLowerCase().trim();
  const money = v.match(/^\$(\d+(?:\.\d+)?)$/);
  if (money) return new RegExp(`(\\$\\s*${money[1]}(\\.00)?\\b|\\b${money[1]}(\\.00)?\\s*(dollars|usd)\\b)`);
  const pct = v.match(/^(\d+)%$/);
  if (pct) return new RegExp(`\\b${pct[1]}\\s*(%|percent)`);
  const unit = v.match(/^(\d+)\s+(.+?)s?$/);
  if (unit) return new RegExp(`\\b${unit[1]}[\\s-]*${unit[2].replace(/\s+/g, "[\\s-]+")}s?\\b`);
  throw new Error(`cannot build a pattern for value "${value}"`);
}

/** True when every mention is negated ("not 30 days", "no 30-day window"). */
function onlyNegated(text: string, re: RegExp): boolean {
  const g = new RegExp(re.source, "g");
  const hits = [...text.matchAll(g)];
  return hits.length > 0 && hits.every((m) => /\b(not|no|never|isn't|isnt)\s+(\w+\s+)?$/.test(text.slice(Math.max(0, m.index - 20), m.index)));
}

/**
 * Expected-property checks on an answer that passed the schema. Values allowed
 * by the case's own context are never penalized; a rule value must be stated
 * (number words count) and not only in a negated form.
 */
export function expectedChecks(c: Case, out: AnswerOutput, rules: ReadonlyMap<string, Rule>): { code: string; detail: string }[] {
  const failures: { code: string; detail: string }[] = [];
  const text = normalizeNumbers(out.answer);
  const ruleId = c.expected.must_match_rule;
  if (ruleId && !out.refused) {
    const rule = rules.get(`ns:${ruleId}`);
    if (!rule) throw new Error(`${c.id}: unknown rule ${ruleId}`);
    for (const value of rule.values) {
      const re = valuePattern(value);
      if (!re.test(text) || onlyNegated(text, re)) failures.push({ code: "semantic_rule_mismatch", detail: `does not state ${ruleId} value "${value}"` });
    }
  }
  for (const phrase of c.expected.must_not_say ?? []) {
    if (new RegExp(phrase, "i").test(out.answer)) failures.push({ code: "semantic_forbidden_phrase", detail: `says "${phrase}"` });
  }
  return failures;
}
