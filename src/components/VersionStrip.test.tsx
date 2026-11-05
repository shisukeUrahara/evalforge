import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { VersionStrip } from "./VersionStrip";

test("shows dataset + sha, every prompt and model, judge + sha and the run id", () => {
  render(
    <VersionStrip
      v={{ dataset: "support-v1", dataset_sha: "d6f7e2a", prompts: ["A.v1", "B.v1"], models: ["openai:gpt-4.1-mini-2025-04-14"], judge: "claims.v1", judge_sha: "bf30d0b", run_id: "20261105T043553Z-holdout-B" }}
    />,
  );
  expect(screen.getByLabelText("Versions")).toHaveTextContent(
    "dataset support-v1·sha d6f7e2a·prompt A.v1·prompt B.v1·model openai:gpt-4.1-mini-2025-04-14·judge claims.v1·sha bf30d0b·run 20261105T043553Z-holdout-B",
  );
});
