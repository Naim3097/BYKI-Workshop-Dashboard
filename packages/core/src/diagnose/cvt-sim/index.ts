// CVT transmission diagnostic SIMULATION engine (ported from MNA's storefront).
// In-browser, no hardware: an oscilloscope + signal-analysis engine over a
// grounded CVT knowledge base that produces ranked, evidence-backed findings.
//
// These modules are the original proven JS, brought in under `allowJs` so the
// behaviour is byte-for-byte identical; types can be tightened incrementally.
// Pure-logic entry points are re-exported here; the rendering modules
// (oscilloscope, effects/*) are imported directly by the diagnose UI as needed,
// since they touch browser-only canvas APIs.

export * as analysisEngine from './analysis-engine.js'
export * as report from './report.js'
export * as cvtKnowledge from './cvt-knowledge.js'
export * as cvtContext from './cvt-context.js'
export * as driveMap from './drive-map.js'
