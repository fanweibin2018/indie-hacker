import { describe, it, expect } from 'vitest';
import { PHASES, PHASE_IDS, isPhaseId, getPhase } from '@/lib/phases';

describe('phases', () => {
  it('exposes exactly five phases', () => {
    expect(PHASE_IDS).toEqual(['discover', 'design', 'build', 'market', 'business']);
  });
  it('each phase has bilingual labels and a color var', () => {
    for (const p of PHASES) {
      expect(p.label.zh).toBeTruthy();
      expect(p.label.en).toBeTruthy();
      expect(p.colorVar).toMatch(/^--color-/);
    }
  });
  it('isPhaseId validates membership', () => {
    expect(isPhaseId('discover')).toBe(true);
    expect(isPhaseId('nope')).toBe(false);
  });
  it('getPhase returns the matching phase', () => {
    expect(getPhase('market').label.en).toBe('Market');
  });
});
