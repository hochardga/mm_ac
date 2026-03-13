import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import ShellLoading from "@/app/(shell)/loading";

test("renders a route-progress loading treatment", () => {
  render(<ShellLoading />);

  expect(screen.getByText("Loading route content")).toBeInTheDocument();
});
