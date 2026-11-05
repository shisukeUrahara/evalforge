/** Arms: A steel, B violet, M sky, C coral. A small dot plus the mono letter. */
export const ARM_DOT: Record<string, string> = { A: "bg-muted", A2: "bg-muted", B: "bg-brand", M: "bg-arm-m", M2: "bg-arm-m", C: "bg-danger" };

export function ArmDot({ arm }: { arm: string }) {
  return <span aria-hidden className={`inline-block size-2 shrink-0 rounded-full ${ARM_DOT[arm] ?? "bg-muted"}`} />;
}
