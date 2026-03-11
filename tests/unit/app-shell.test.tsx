import { render, screen } from "@testing-library/react";

import HomePage from "@/app/page";

test("shows the Ashfall Collective heading", () => {
  render(<HomePage />);

  expect(
    screen.getByRole("heading", { name: /ashfall collective/i }),
  ).toBeInTheDocument();
});
