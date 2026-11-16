import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { supportsUnified911 } from '../src/saudi-emergency';

const source = readFileSync('src/saudi-emergency.ts', 'utf8');

describe('TEMAN Saudi emergency number scoping', () => {
  it('shows unified 911 only in the Makkah city view', () => {
    expect(supportsUnified911('makkah')).toBe(true);
    expect(supportsUnified911('madinah')).toBe(false);
    expect(source).toContain(
      "section.querySelector<HTMLButtonElement>('[data-service=\"unified\"]')!.hidden = !supportsUnified911(city());",
    );
  });

  it('keeps nationwide service-specific emergency contacts available', () => {
    for (const number of ['997', '999', '998', '937']) {
      expect(source).toContain(`data-number="${number}"`);
    }
  });

  it('keeps the Makkah-specific 911 label explicit in all core languages', () => {
    expect(source).toContain("unifiedHint: 'Wilayah Makkah'");
    expect(source).toContain("unifiedHint: 'Makkah Region'");
    expect(source).toContain("unifiedHint: 'منطقة مكة المكرمة'");
  });
});
