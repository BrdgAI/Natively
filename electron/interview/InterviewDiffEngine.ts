import { diffLines } from 'diff';

export interface InterviewDiffResult {
  diffText: string;
  changedSections: string[];
  summary: string[];
}

export class InterviewDiffEngine {
  public diffText(before: string, after: string): InterviewDiffResult {
    const chunks = diffLines(before || '', after || '');
    const lines: string[] = [];
    const changedSections: string[] = [];
    const summary: string[] = [];

    for (const chunk of chunks) {
      const prefix = chunk.added ? '+' : chunk.removed ? '-' : ' ';
      const value = chunk.value.replace(/\r/g, '');
      const splitLines = value.split('\n').filter((line, index, arr) => !(index === arr.length - 1 && line === ''));
      for (const line of splitLines.slice(0, 120)) {
        lines.push(`${prefix}${line}`);
      }

      if (chunk.added) {
        const label = this.firstMeaningfulLine(splitLines);
        if (label) {
          changedSections.push(`Added: ${label}`);
          summary.push(`Added logic around: ${label}`);
        }
      } else if (chunk.removed) {
        const label = this.firstMeaningfulLine(splitLines);
        if (label) {
          changedSections.push(`Removed: ${label}`);
          summary.push(`Removed or replaced: ${label}`);
        }
      }
    }

    return {
      diffText: lines.join('\n').trim(),
      changedSections: dedupe(changedSections).slice(0, 8),
      summary: dedupe(summary).slice(0, 6),
    };
  }

  private firstMeaningfulLine(lines: string[]): string | null {
    for (const line of lines) {
      const normalized = line.trim();
      if (!normalized) continue;
      if (normalized === '{' || normalized === '}' || normalized === '```') continue;
      return normalized.slice(0, 120);
    }
    return null;
  }
}

function dedupe(items: string[]): string[] {
  return Array.from(new Set(items));
}
