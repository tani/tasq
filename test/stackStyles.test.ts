import { describe, expect, it } from "bun:test";
import { getStackCardVisualStyle } from "../src/stackStyles";

describe("getStackCardVisualStyle", () => {
  it("returns desktop stack offsets", () => {
    const style = getStackCardVisualStyle(2, false);

    expect(style.isTop).toBe(false);
    expect(style.pointerEvents).toBe("none");
    expect(style.transform).toContain("calc(-50% + 28px)");
    expect(style.transform).toContain("calc(-50% + 36px)");
    expect(style.transform).toContain("translateZ(-80px)");
  });

  it("returns compact stack offsets", () => {
    const style = getStackCardVisualStyle(2, true);

    expect(style.isTop).toBe(false);
    expect(style.transform).toContain("calc(-50% + 18px)");
    expect(style.transform).toContain("calc(-50% + 24px)");
    expect(style.transform).toContain("translateZ(-56px)");
  });

  it("marks top card as interactive", () => {
    const style = getStackCardVisualStyle(0, false);

    expect(style.isTop).toBe(true);
    expect(style.pointerEvents).toBe("auto");
    expect(style.filter).toBe("none");
  });
});
