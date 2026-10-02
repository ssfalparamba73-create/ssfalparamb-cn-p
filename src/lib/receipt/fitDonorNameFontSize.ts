export type TextWidthMeasurer = (text: string, fontSize: number) => number;

/** Returns the largest font size that can wrap a receipt name within the line limit. */
export function fitDonorNameFontSize(
  text: string,
  maxWidth: number,
  measureText: TextWidthMeasurer,
  maxFontSize: number,
  minFontSize = 10,
  maxLines = 2,
): number {
  if (!text.trim() || maxWidth <= 0) return maxFontSize;

  for (let fontSize = maxFontSize; fontSize >= minFontSize; fontSize -= 0.5) {
    if (fitsWithinLines(text, maxWidth, fontSize, measureText, maxLines)) {
      return Math.round(fontSize * 10) / 10;
    }
  }

  return minFontSize;
}

function fitsWithinLines(
  text: string,
  maxWidth: number,
  fontSize: number,
  measureText: TextWidthMeasurer,
  maxLines: number,
): boolean {
  let lineCount = 1;
  let currentLine = "";

  for (const word of text.trim().split(/\s+/u).filter(Boolean)) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (measureText(candidate, fontSize) <= maxWidth) {
      currentLine = candidate;
      continue;
    }

    if (currentLine) {
      lineCount += 1;
      currentLine = "";
      if (lineCount > maxLines) return false;
    }

    if (measureText(word, fontSize) <= maxWidth) {
      currentLine = word;
      continue;
    }

    for (const character of Array.from(word)) {
      const characterCandidate = `${currentLine}${character}`;
      if (measureText(characterCandidate, fontSize) <= maxWidth) {
        currentLine = characterCandidate;
        continue;
      }

      if (currentLine) lineCount += 1;
      if (lineCount > maxLines || measureText(character, fontSize) > maxWidth) {
        return false;
      }
      currentLine = character;
    }
  }

  return lineCount <= maxLines;
}
