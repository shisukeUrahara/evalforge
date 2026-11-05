import { readRunFile } from "@/core/artifacts/runs";
import { dataDir } from "../../../_lib/data";

export const runtime = "nodejs";

/** Serves runs/<id>/gate.json as a download. readRunFile refuses ids that are not plain. */
export async function GET(_req: Request, ctx: RouteContext<"/runs/[id]/gate.json">) {
  const { id } = await ctx.params;
  const text = readRunFile(dataDir(), id, "gate.json");
  if (!text) return new Response("no gate.json for this run\n", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
  return new Response(text, { headers: { "content-type": "application/json; charset=utf-8", "content-disposition": `attachment; filename="gate-${id}.json"` } });
}
