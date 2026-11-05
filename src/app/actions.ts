"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@/components/gate/Actions";
import { ForbiddenError } from "@/core/auth/roles";
import { dataDir } from "./_lib/data";
import { confirmCase, waiveCheck } from "./_lib/gateActions";
import { pageUser } from "./_lib/session";

// Server actions are public POST endpoints: the user check and validation happen here, not in the form.
async function run(action: "waive" | "confirm", fn: (user: string) => { decision: string }): Promise<ActionState> {
  const user = await pageUser();
  try {
    const g = fn(user);
    revalidatePath("/");
    return { status: "ok", message: `Recorded by ${user}. Gate re-run: ${g.decision.replace("_", " ")}.` };
  } catch (e) {
    if (e instanceof ForbiddenError) return { status: "denied", user, action };
    return { status: "error", message: (e as Error).message };
  }
}

const WaiveInput = z.object({ run: z.string().min(1), check: z.string().min(1), reason: z.string().trim().min(10, "Give a reason of at least 10 characters.") });

export async function waiveAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const p = WaiveInput.safeParse({ run: form.get("run"), check: form.get("check"), reason: form.get("reason") });
  if (!p.success) return { status: "error", message: p.error.issues[0].message };
  return run("waive", (user) => waiveCheck(dataDir(), { runId: p.data.run, checkId: p.data.check, reason: p.data.reason, user, now: new Date() }));
}

const ConfirmInput = z.object({ run: z.string().min(1), case: z.string().min(1), decision: z.enum(["unsupported", "not_unsupported"]) });

export async function confirmAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const p = ConfirmInput.safeParse({ run: form.get("run"), case: form.get("case"), decision: form.get("decision") });
  if (!p.success) return { status: "error", message: "Not a valid confirm." };
  return run("confirm", (user) => confirmCase(dataDir(), { runId: p.data.run, caseId: p.data.case, decision: p.data.decision, user, now: new Date() }));
}
