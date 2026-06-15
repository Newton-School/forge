import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "./badge";

describe("<Badge>", () => {
  it("renders its children", () => {
    render(<Badge tone="success">On Track</Badge>);
    expect(screen.getByText("On Track")).toBeInTheDocument();
  });

  it("applies the tone styling class", () => {
    render(<Badge tone="danger">Escalated</Badge>);
    const el = screen.getByText("Escalated");
    expect(el.className).toContain("text-danger");
  });
});
