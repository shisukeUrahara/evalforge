import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { ConfirmForm, WaiveForm, type ActionState } from "./Actions";

test("a refused waiver shows the Denied view", async () => {
  const action = vi.fn(async (): Promise<ActionState> => ({ status: "denied", user: "maya", action: "waive" }));
  render(<WaiveForm run="r1" check="regression_count" action={action} />);
  fireEvent.change(screen.getByRole("textbox", { name: /Reason/ }), { target: { value: "tone change accepted" } });
  fireEvent.click(screen.getByRole("button", { name: "Record waiver and re-run gate" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Not allowed (403)maya may not waive");
  const form = action.mock.calls[0] as unknown as [ActionState, FormData];
  expect(Object.fromEntries(form[1])).toEqual({ run: "r1", check: "regression_count", reason: "tone change accepted" });
});

test("a confirm sends the case and the chosen decision", async () => {
  const action = vi.fn(async (): Promise<ActionState> => ({ status: "ok", message: "Recorded by lee. Gate re-run: block." }));
  render(<ConfirmForm run="r1" caseId="c014" action={action} />);
  fireEvent.click(screen.getByRole("button", { name: "Yes, unsupported" }));
  expect(await screen.findByRole("status")).toHaveTextContent("Gate re-run: block.");
  const form = action.mock.calls[0] as unknown as [ActionState, FormData];
  expect(form[1].get("case")).toBe("c014");
  expect(form[1].get("decision")).toBe("unsupported");
});
