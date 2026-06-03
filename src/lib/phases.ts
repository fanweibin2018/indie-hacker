export const PHASE_IDS = ['discover', 'design', 'build', 'market', 'business'] as const;
export type PhaseId = (typeof PHASE_IDS)[number];

export interface Phase {
  id: PhaseId;
  label: { zh: string; en: string };
  blurb: { zh: string; en: string };
  colorVar: `--color-${PhaseId}`;
}

export const PHASES: Phase[] = [
  { id: 'discover', label: { zh: '需求挖掘', en: 'Discover' }, blurb: { zh: '找问题、验证需求、市场调研', en: 'Find problems, validate demand, research markets' }, colorVar: '--color-discover' },
  { id: 'design',   label: { zh: '设计',     en: 'Design'   }, blurb: { zh: '产品、UX、视觉、原型', en: 'Product, UX, visual, prototyping' }, colorVar: '--color-design' },
  { id: 'build',    label: { zh: '开发',     en: 'Build'    }, blurb: { zh: '技术选型、工程实践、工具链', en: 'Stack, engineering, tooling' }, colorVar: '--color-build' },
  { id: 'market',   label: { zh: '营销',     en: 'Market'   }, blurb: { zh: '获客、内容、SEO、社区、增长', en: 'Acquisition, content, SEO, community, growth' }, colorVar: '--color-market' },
  { id: 'business', label: { zh: '商业分析', en: 'Business' }, blurb: { zh: '定价、商业模式、数据、财务', en: 'Pricing, models, data, finance' }, colorVar: '--color-business' },
];

const PHASE_MAP = new Map(PHASES.map((p) => [p.id, p]));

export function isPhaseId(value: string): value is PhaseId {
  return (PHASE_IDS as readonly string[]).includes(value);
}

export function getPhase(id: PhaseId): Phase {
  const phase = PHASE_MAP.get(id);
  if (!phase) throw new Error(`Unknown phase: ${id}`);
  return phase;
}
