import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, test } from "vitest";
import { Drawer } from "@/components/Drawer";
import { comparisonView } from "@/core/views/comparison";
import { gateView } from "@/core/views/gate";
import { AnswerColumn, CaseList, compareHref, Provenance, QuestionCard } from "./Compare";

const cwd = process.cwd();
const v = comparisonView(cwd, gateView(cwd)!.selected.run_id);
const s = v.selected!;

test("question and both answers show refused, cited ids and failed checks", () => {
  render(
    <>
      <QuestionCard s={s} />
      <AnswerColumn a={s.baseline} unsupported={s.unsupported.baseline} />
      <AnswerColumn a={s.candidate} unsupported={s.unsupported.candidate} />
    </>,
  );
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(s.case.question);
  const cand = screen.getByRole("region", { name: "Answer B" });
  expect(within(cand).getByText("refused:").nextSibling).toHaveTextContent(s.candidate.refused ? "yes" : "no");
  for (const c of s.candidate.checks) expect(within(cand).getByText(c.code)).toBeInTheDocument();
});

test("provenance lists each source slice with license and pin, the manifest and a +/- prompt diff", () => {
  render(<Provenance v={v} />);
  for (const src of s.sources) expect(screen.getByText(src.id)).toBeInTheDocument();
  expect(screen.getAllByText("MIT").length).toBe(s.sources.filter((x) => x.license === "MIT").length);
  expect(screen.getByText("dataset_sha")).toBeInTheDocument();
  const diff = screen.getByLabelText("Prompt diff, baseline to candidate");
  expect(diff.querySelector(".text-success")).not.toBeNull();
  expect(diff.querySelector(".text-danger")).not.toBeNull();
});

test("compareHref drops empty params; the drawer opens and closes as a sheet", () => {
  expect(compareHref({ run: "r1", case: "c014", only: undefined })).toBe("/compare?run=r1&case=c014");
  render(<Drawer label="Provenance">inside</Drawer>);
  const button = screen.getByRole("button", { name: "Provenance" });
  fireEvent.click(button);
  expect(button).toHaveAttribute("aria-expanded", "true");
  fireEvent.click(screen.getByRole("button", { name: "Close" }));
  expect(button).toHaveAttribute("aria-expanded", "false");
});

test("claims are underlined by verdict and listed with their source; the filter keeps regressions only", () => {
  const withClaims = comparisonView(cwd, v.run_id, "c042").selected!.candidate;
  render(<AnswerColumn a={withClaims} unsupported={2} />);
  const list = screen.getByRole("list", { name: "Material claims" });
  expect(within(list).getAllByText("unsupported").length).toBeGreaterThan(0);
  expect(within(list).getAllByText(/^(judge|human)$/).length).toBe(withClaims.claims.filter((c) => c.material).length);
  expect(document.querySelector("mark.decoration-danger")).not.toBeNull();
});

test("regressions only lists the 8 regressions and links keep the filter", () => {
  render(<CaseList v={v} only="reg" />);
  const links = within(screen.getByRole("region", { name: "Cases" })).getAllByRole("link");
  expect(links[0]).toHaveAttribute("href", `/compare?run=${v.run_id}&case=${s.case.id}`);
  expect(links.slice(1)).toHaveLength(v.rows.filter((r) => r.regression).length);
  expect(links[1].getAttribute("href")).toContain("only=reg");
  expect(screen.getByText(/of 50 cases \(regressions\)/)).toBeInTheDocument();
});
