import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { judgeView } from "@/core/views/judge";
import { Canaries, ConfusionMatrix, Disagreements } from "./Judge";

const v = judgeView(process.cwd());

test("canaries show the measured sets with ranges", () => {
  render(<Canaries sets={v.canaries} />);
  expect(screen.getByText(/^10\/10 caught · 95% range/)).toBeInTheDocument();
  expect(screen.getByText(/^30\/30 caught · 95% range/)).toBeInTheDocument();
});

test("no labels: the matrix and disagreements say so instead of showing zeros", () => {
  render(
    <>
      <ConfusionMatrix confusion={[[0, 0, 0], [0, 0, 0], [0, 0, 0]]} claims={0} />
      <Disagreements items={[]} />
    </>,
  );
  expect(screen.getByText(/Waiting for human labels/)).toBeInTheDocument();
  expect(screen.queryByRole("table")).toBeNull();
});

test("the committed holdout labels fill the matrix", () => {
  render(<ConfusionMatrix confusion={v.trust.confusion} claims={v.trust.claims_labeled} />);
  expect(v.trust.claims_labeled).toBeGreaterThan(0);
  expect(screen.getByRole("table")).toBeInTheDocument();
});

test("with labels the matrix has human rows and judge columns", () => {
  render(<ConfusionMatrix confusion={[[5, 1, 0], [2, 4, 0], [0, 0, 1]]} claims={13} />);
  expect(screen.getAllByRole("rowheader").map((h) => h.textContent)).toEqual(["supported", "unsupported", "uncertain"]);
  expect(screen.getAllByRole("cell").map((c) => c.textContent)).toEqual(["5", "1", "0", "2", "4", "0", "0", "0", "1"]);
});
