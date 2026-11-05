import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/compare", useRouter: () => ({ refresh: () => {} }) }));
import { isActive, Nav } from "./Nav";

test("marks the current page in both navs", () => {
  render(<Nav />);
  const current = screen.getAllByRole("link", { current: "page" });
  expect(current.map((a) => a.textContent)).toEqual(["Comparison", "Compare"]);
  expect(screen.getByRole("link", { name: "EvalForge" })).toHaveAttribute("href", "/");
});

test("Release gate is only active on the home page", () => {
  expect(isActive("/", "/")).toBe(true);
  expect(isActive("/judge", "/")).toBe(false);
  expect(isActive("/compare", "/compare")).toBe(true);
});
