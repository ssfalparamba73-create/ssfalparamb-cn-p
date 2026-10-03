import { describe, expect, it } from "vitest";
import { fitDonorNameFontSize } from "@/lib/receipt/fitDonorNameFontSize";

const measureByCharacterCount = (text: string, fontSize: number) => Array.from(text).length * fontSize * 0.6;

describe("receipt donor name font fitting", () => {
  it("keeps a short name at the maximum size", () => {
    const fontSize = fitDonorNameFontSize("Ali", 250, measureByCharacterCount, 28);

    expect(fontSize).toBe(28);
  });

  it("reduces the font size for a longer name while keeping it to two lines", () => {
    const fontSize = fitDonorNameFontSize(
      "Muhammed Abdul Rahman Kakkad",
      200,
      measureByCharacterCount,
      28,
    );

    expect(fontSize).toBeLessThan(28);
    expect(fontSize).toBeGreaterThanOrEqual(10);
  });

  it("scales a long name down to fit one line when requested", () => {
    const name = "ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMN";
    const fontSize = fitDonorNameFontSize(
      name,
      200,
      measureByCharacterCount,
      28,
      8,
      1,
    );

    expect(fontSize).toBeLessThan(28);
    expect(measureByCharacterCount(name, fontSize)).toBeLessThanOrEqual(200);
  });

  it("wraps a long unbroken name across lines instead of overflowing", () => {
    const fontSize = fitDonorNameFontSize(
      "ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJK",
      200,
      measureByCharacterCount,
      28,
    );

    expect(fontSize).toBeLessThan(28);
    expect(fontSize).toBeGreaterThanOrEqual(10);
  });
});
