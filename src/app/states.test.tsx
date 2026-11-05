import { fireEvent, render, screen } from "@testing-library/react";
import { appendFileSync, cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test, vi } from "vitest";
import { LABELS_LOG } from "@/core/metrics/report";
import { labelsChangedSince } from "./_lib/stale";
import ErrorPage from "./error";
import Loading from "./loading";
import NotFound from "./not-found";

vi.mock("next/server", () => ({ connection: async () => {} }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock("next/navigation", async (orig) => ({ ...(await orig<object>()), notFound: () => { throw new Error("NOT_FOUND"); } }));

const dirs: string[] = [];
const temp = () => {
  const d = mkdtempSync(path.join(tmpdir(), "ef-states-"));
  dirs.push(d);
  return d;
};
afterEach(() => {
  delete process.env.EF_DATA_DIR;
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe("error page", () => {
  test("shows the digest and retries", () => {
    const retry = vi.fn();
    render(<ErrorPage error={Object.assign(new Error("x"), { digest: "abc123" })} retry={retry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("error id abc123");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledOnce();
  });
});

test("not-found links to the three tabs; loading is a status with shapes only", () => {
  render(<NotFound />);
  expect(screen.getAllByRole("link").map((a) => a.getAttribute("href"))).toEqual(["/", "/compare", "/judge"]);
  render(<Loading />);
  expect(screen.getByRole("status", { name: "Loading" }).textContent).toBe("");
});

test("empty: with no runs the gate page shows the command that makes one", async () => {
  process.env.EF_DATA_DIR = temp();
  const { default: GatePage } = await import("./page");
  render(await GatePage({ searchParams: Promise.resolve({}), params: Promise.resolve({}) } as never));
  expect(screen.getByText("pnpm ef run --split holdout --candidate prompt:B.v1")).toBeInTheDocument();
});

test("invalid run: an unknown run id or case id is a 404", async () => {
  const { default: ComparePage } = await import("./compare/page");
  const page = (q: Record<string, string>) => ComparePage({ searchParams: Promise.resolve(q), params: Promise.resolve({}) } as never);
  await expect(page({ run: "20990101T000000Z-holdout-X" })).rejects.toThrow("NOT_FOUND");
  await expect(page({ run: "20261105T043553Z-holdout-B", case: "c999" })).rejects.toThrow("NOT_FOUND");
});

test("stale: a label added after the gate ran is detected", () => {
  const dir = temp();
  const gate = readFileSync("runs/20261105T043553Z-holdout-B/gate.json", "utf8");
  cpSync("data/labels", path.join(dir, "data/labels"), { recursive: true });
  expect(labelsChangedSince(dir, gate)).toBe(false);
  mkdirSync(path.dirname(path.join(dir, LABELS_LOG)), { recursive: true });
  appendFileSync(path.join(dir, LABELS_LOG), '{"x":1}\n');
  expect(labelsChangedSince(dir, gate)).toBe(true);
});

test("pending confirm: the verdict reads PENDING CONFIRM in amber", async () => {
  const { gateView } = await import("@/core/views/gate");
  const { VerdictBanner } = await import("@/components/gate/Gate");
  const v = gateView(process.cwd())!;
  render(<VerdictBanner v={{ ...v, decision: "pending_confirm", counts: { ...v.counts, pending: 1 } }} />);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("PENDING CONFIRM");
  expect(screen.getByRole("heading", { level: 1 })).toHaveClass("text-warn");
  expect(screen.getByText(/1 pending confirm/)).toBeInTheDocument();
});
