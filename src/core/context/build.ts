import { contextRef, type Slice } from "./slices";

export interface FrozenContext {
  ref: string;
  slices: Slice[];
  /** The text the model sees: one block per slice, headed by its id. */
  text: string;
}

/** Builds the frozen context for one case. Unknown ids throw: a case can only cite real slices. */
export function buildContext(ids: readonly string[], all: ReadonlyMap<string, Slice>): FrozenContext {
  const slices = ids.map((id) => {
    const s = all.get(id);
    if (!s) throw new Error(`unknown slice id: ${id}`);
    return s;
  });
  const text = slices.map((s) => `[${s.id}] ${s.title}\n${s.text}`).join("\n\n");
  return { ref: contextRef(slices), slices, text };
}
