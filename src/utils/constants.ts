// src/utils/constants.ts
export const SIGNAL_METADATA = {
  hormuz: { name: 'Strait of Hormuz', tier: 't1', threshold: 'open=g, partial=a, blocked=r' },
  cease: { name: 'Ceasefire Talks', tier: 't1', threshold: 'ceasefire=g, active=a, none=r' },
  brent: { name: 'Brent Crude', tier: 't1', threshold: '<$95=g, <$110=a, >=$110=r' },
  vix: { name: 'India VIX', tier: 't1', threshold: '<17=g, <22=a, >=22=r' },
  
  fii: { name: 'FII Equity Flows', tier: 't2', threshold: '+ve=g, flat=a, -ve=r' },
  usdinr: { name: 'USD/INR', tier: 't2', threshold: '<85.5=g, <87=a, >=87=r' },
  rbi: { name: 'RBI Stance', tier: 't2', threshold: 'accommodative=g, neutral=a, hawkish=r' },
  us10y: { name: 'US 10Y Yield', tier: 't2', threshold: '<4.2%=g, <4.6%=a, >=4.6%=r' },
  
  advdec: { name: 'A/D Ratio', tier: 't3', threshold: 'bullish=g, neutral=a, bearish=r' },
  small: { name: 'SmallCap vs Nifty', tier: 't3', threshold: 'outperforming=g, tracking=a, lagging=r' },
  dma200: { name: 'Nifty vs 200 DMA', tier: 't3', threshold: '>2% above=g, within 2%=a, below=r' },
  bank: { name: 'Bank Nifty vs Nifty', tier: 't3', threshold: '>2% outperf=g, tracking=a, underperf=r' },
  
  gold: { name: 'Gold Trend', tier: 't4', threshold: 'falling=g, flat=a, rising=r' },
  ipo: { name: 'IPO Pipeline', tier: 't4', threshold: '2+ DRHPs=g, some=a, frozen=r' },
  sip: { name: 'SIP Inflows', tier: 't4', threshold: '>22k cr=g, >18k cr=a, <18k cr=r' },
  curve: { name: 'Crude Curve', tier: 't4', threshold: 'contango=g, unknown=a, backwardation=r' },
};

export const TIER_METADATA = {
  t1: { id: 'T1', name: 'Geopolitical de-escalation', color: 'orange', hex: '#c2410c', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  t2: { id: 'T2', name: 'Macro & capital flows', color: 'blue', hex: '#1d4ed8', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  t3: { id: 'T3', name: 'Domestic market internals', color: 'purple', hex: '#6d28d9', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  t4: { id: 'T4', name: 'Sentiment & soft signals', color: 'teal', hex: '#0f766e', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
};

export const STATUS_COLORS = {
  g: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-500', pill: 'bg-green-100 text-green-800' },
  a: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-500', pill: 'bg-amber-100 text-amber-800' },
  r: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-500', pill: 'bg-red-100 text-red-800' },
};
