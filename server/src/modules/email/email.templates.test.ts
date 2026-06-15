import { describe, it, expect } from "vitest";
import { missingVars, renderTemplate } from "./email.templates.js";

describe("email.templates — renderTemplate", () => {
  it("substitutes known merge fields (whitespace tolerant)", () => {
    expect(renderTemplate("Hi {{name}}, ref {{ ref }}", { name: "Aniket", ref: "CON-1" }))
      .toBe("Hi Aniket, ref CON-1");
  });

  it("coerces numbers/booleans and leaves unknown placeholders intact", () => {
    expect(renderTemplate("{{count}} due, ok={{ok}} {{unknown}}", { count: 3, ok: true }))
      .toBe("3 due, ok=true {{unknown}}");
  });

  it("treats null/undefined as missing (placeholder preserved)", () => {
    expect(renderTemplate("Hi {{name}}", { name: null })).toBe("Hi {{name}}");
  });
});

describe("email.templates — missingVars", () => {
  it("lists distinct unfilled placeholders", () => {
    expect(missingVars("{{a}} {{b}} {{a}} {{c}}", { a: "x" }).sort()).toEqual(["b", "c"]);
  });

  it("returns empty when all are supplied", () => {
    expect(missingVars("{{a}}", { a: "x" })).toEqual([]);
  });
});
