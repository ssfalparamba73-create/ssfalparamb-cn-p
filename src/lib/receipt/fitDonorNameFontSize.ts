export type TextWidthMeasurer = (text: string, fontSize: number) => number;

/** Returns the largest font size that can wrap a receipt name within the line limit. */
export function fitDonorNameFontSize(
  text: string,
  maxWidth: number,
  measureText: TextWidthMeasurer,
  maxFontSize: number,
  minFontSize = 10,
  maxLines = 2,
  maxHeight = Number.POSITIVE_INFINITY,
  lineHeightMultiplier = 1.25,
): number {
  if (!text.trim()) return maxFontSize;
  if (maxWidth <= 0 || maxHeight <= 0) return minFontSize;

  const segmenter = typeof Intl.Segmenter === "undefined"
    ? null
    : new Intl.Segmenter(undefined, { granularity: "grapheme" });
  const words = text.trim().split(/\s+/u).filter(Boolean).map((word) =>
    segmenter
      ? Array.from(segmenter.segment(word), ({ segment }) => segment)
      : Array.from(word),
  );

  for (let fontSize = maxFontSize; fontSize >= minFontSize; fontSize -= 0.5) {
    const lineCount = countWrappedLines(words, maxWidth, fontSize, measureText, maxLines);
    if (
      lineCount <= maxLines &&
      lineCount * fontSize * lineHeightMultiplier <= maxHeight
    ) {
      return Math.round(fontSize * 10) / 10;
    }
  }

  return minFontSize;
}

function countWrappedLines(
  words: string[][],
  maxWidth: number,
  fontSize: number,
  measureText: TextWidthMeasurer,
  maxLines: number,
): number {
  let lineCount = 1;
  let currentLine = "";

  for (const graphemes of words) {
    const word = graphemes.join("");
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (measureText(candidate, fontSize) <= maxWidth) {
      currentLine = candidate;
      continue;
    }

    if (currentLine) {
      lineCount += 1;
      currentLine = "";
      if (lineCount > maxLines) return lineCount;
    }

    if (measureText(word, fontSize) <= maxWidth) {
      currentLine = word;
      continue;
    }

    for (const grapheme of graphemes) {
      const characterCandidate = `${currentLine}${grapheme}`;
      if (measureText(characterCandidate, fontSize) <= maxWidth) {
        currentLine = characterCandidate;
        continue;
      }

      if (measureText(grapheme, fontSize) > maxWidth) return maxLines + 1;
      if (currentLine) lineCount += 1;
      if (lineCount > maxLines) return lineCount;
      currentLine = grapheme;
    }
  }

  return lineCount;
}
