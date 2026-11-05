import { render, screen, within } from "@testing-library/react";
import { expect, test } from "vitest";
import { gateView } from "@/core/views/gate";
import { CandidateSwitch, CheckRow, TrustRow, VerdictBanner } from "./Gate";

const v = gateView(process.cwd())!;

test("verdict banner and candidate switch read the committed B run", () => {
  render(
    <>
      <CandidateSwitch v={v} />
      <VerdictBanner v={v} />
    </>,
  );
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("BLOCK");
  expect(screen.getByRole("link", { current: "page" })).toHaveTextContent("B · friendlier prompt");
  expect(screen.getAllByRole("link").map((a) => a.getAttribute("href"))).toEqual(["/?c=B", "/?c=M", "/?c=C"]);
});

test("a failing check links each case to the comparison", () => {
  const check = v.tiers[1].checks[0];
  render(
    <ul>
      <CheckRow check={check} runId={v.selected.run_id} />
    </ul>,
  );
  expect(screen.getByText("FAIL")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "c042" })).toHaveAttribute("href", `/compare?run=${v.selected.run_id}&case=c042`);
});

test("trust lines without labels show no number, only 'waiting for human labels'", () => {
  render(
    <ul>
      {v.trust.lines.map((l) => (
        <TrustRow key={l.name} line={l} />
      ))}
    </ul>,
  );
  const kappa = screen.getByText("Agreement κ (judge vs human)").closest("li")!;
  expect(within(kappa).getByText("waiting for human labels")).toBeInTheDocument();
  expect(kappa.textContent).not.toMatch(/\d\.\d\d/);
  expect(screen.getByText("Canary recall").closest("li")).toHaveTextContent("1.00");
});
