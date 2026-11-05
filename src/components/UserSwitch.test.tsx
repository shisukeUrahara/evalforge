import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { userFromCookie } from "@/app/_lib/user";
import { ForbiddenError, requireAction } from "@/core/auth/roles";
import { Denied } from "./Denied";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
import { UserSwitch } from "./UserSwitch";

test("no or unknown cookie means maya, and maya is refused waive and confirm", () => {
  for (const v of [undefined, "", "bob", "toString"]) expect(userFromCookie(v)).toBe("maya");
  expect(() => requireAction(userFromCookie(undefined), "waive")).toThrow(ForbiddenError);
  expect(() => requireAction("maya", "confirm")).toThrow(ForbiddenError);
  expect(requireAction(userFromCookie("lee"), "waive")).toBe("lee");
});

test("switching user sets the ef_user cookie and refreshes", () => {
  render(<UserSwitch user="maya" />);
  fireEvent.change(screen.getByRole("combobox", { name: "Demo user" }), { target: { value: "lee" } });
  expect(document.cookie).toContain("ef_user=lee");
  expect(refresh).toHaveBeenCalledOnce();
});

test("Denied names the user and says 403", () => {
  render(<Denied user="maya" action="waive" />);
  expect(screen.getByRole("alert")).toHaveTextContent("Not allowed (403)maya may not waive");
});
