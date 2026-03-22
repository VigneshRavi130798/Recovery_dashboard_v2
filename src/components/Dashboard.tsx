import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchSignals, fetchUsdInr } from '../utils/api';
import { SIGNAL_METADATA, TIER_METADATA, STATUS_COLORS } from '../utils/constants';
import { Settings, RefreshCw, AlertTriangle, ArrowRight, ArrowLeft, ExternalLink, Info } from 'lucide-react';

const CACHE_KEY = 'dashboard_cache_v2';
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

const generatePrompt = (date: string, usdInr: number | null) => `Today is ${date}. ${usdInr ? `Current USD/INR is ${usdInr}.` : ''} You are a financial signal analyst. Based on your knowledge of the US-Iran war that started February 28 2026 and its ongoing impact on Indian markets, provide current status assessments for these 16 India market recovery signals. For each signal provide: st (g/a/r), val (short current value), shortSum (1 short sentence summary), detailedSum (5-6 line detailed summary), sources (2-3 objects with title, url, desc of real websites where the user can verify).

Also provide:
- "overallVerdict": A short, sharp, non-generic overall verdict (max 3 sentences). Synthesize the data into a clear stance. DO NOT give generic advice like "continue SIPs". Tell the user exactly what the data implies for their capital deployment right now.
- "tierSummary": An object with keys "t1", "t2", "t3", "t4". For each, provide a short 1-liner summary of the items within that tier.

Return ONLY raw JSON with this exact structure:
{
  "hormuz": {"st": "", "val": "", "shortSum": "", "detailedSum": "", "sources": [{"title":"", "url":"", "desc":""}]},
  "cease": {"st": "", "val": "", "shortSum": "", "detailedSum": "", "sources": []},
  "brent": {"st": "", "val": "", "shortSum": "", "detailedSum": "", "sources": []},
  "vix": {"st": "", "val": "", "shortSum": "", "detailedSum": "", "sources": []},
  "fii": {"st": "", "val": "", "shortSum": "", "detailedSum": "", "sources": []},
  "usdinr": {"st": "", "val": "", "shortSum": "", "detailedSum": "", "sources": []},
  "rbi": {"st": "", "val": "", "shortSum": "", "detailedSum": "", "sources": []},
  "us10y": {"st": "", "val": "", "shortSum": "", "detailedSum": "", "sources": []},
  "advdec": {"st": "", "val": "", "shortSum": "", "detailedSum": "", "sources": []},
  "small": {"st": "", "val": "", "shortSum": "", "detailedSum": "", "sources": []},
  "dma200": {"st": "", "val": "", "shortSum": "", "detailedSum": "", "sources": []},
  "bank": {"st": "", "val": "", "shortSum": "", "detailedSum": "", "sources": []},
  "gold": {"st": "", "val": "", "shortSum": "", "detailedSum": "", "sources": []},
  "ipo": {"st": "", "val": "", "shortSum": "", "detailedSum": "", "sources": []},
  "sip": {"st": "", "val": "", "shortSum": "", "detailedSum": "", "sources": []},
  "curve": {"st": "", "val": "", "shortSum": "", "detailedSum": "", "sources": []},
  "overallVerdict": "",
  "tierSummary": {"t1": "", "t2": "", "t3": "", "t4": ""}
}

Status rules:
- Brent: green < $95, amber < $110, red >= $110
- India VIX: green < 17, amber < 22, red >= 22
- USD/INR: green < 85.5, amber < 87, red >= 87
- US 10Y yield: green < 4.2%, amber < 4.6%, red >= 4.6%
- SIP inflows: green > ₹22,000 cr, amber > ₹18,000 cr, red below
- Hormuz: open = green, partial = amber, blocked = red
- Ceasefire: ceasefire = green, active talks = amber, none = red
- RBI stance: accommodative = green, neutral = amber, hawkish = red
- FII flows: net positive weekly = green, flat = amber, net negative = red
- Gold trend: falling from peak = green, flat = amber, rising = red
- Crude curve: contango = green, unknown = amber, backwardation = red
- IPO pipeline: 2+ mainboard DRHPs = green, some activity = amber, frozen = red
- A/D ratio: bullish (>2:1 for 5 days) = green, neutral = amber, bearish = red
- SmallCap vs Nifty: outperforming = green, tracking = amber, lagging = red
- Bank Nifty vs Nifty: outperforming >2% = green, tracking = amber, underperforming = red
- Nifty vs 200 DMA: >2% above = green, within 2% = amber, below = red
`;

export default function Dashboard({ apiKey, onClearKey }: { apiKey: string, onClearKey: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [selectedSignal, setSelectedSignal] = useState<string | null>(null);
  const [expandedTier, setExpandedTier] = useState<string | null>(null);
  const expandedRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError('');
    
    try {
      if (!forceRefresh) {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.timestamp < CACHE_DURATION) {
            setData(parsed.data);
            setLastUpdated(formatIST(parsed.timestamp));
            setLoading(false);
            return;
          }
        }
      }

      const [usdInr, _] = await Promise.all([
        fetchUsdInr(),
        new Promise(r => setTimeout(r, 500))
      ]);

      const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      const prompt = generatePrompt(dateStr, usdInr);
      
      const result = await fetchSignals(apiKey, prompt);
      
      if (usdInr && result.usdinr) {
        result.usdinr.val = `₹${usdInr.toFixed(2)}`;
      }

      const cacheData = {
        timestamp: Date.now(),
        data: result
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      
      setData(result);
      setLastUpdated(formatIST(cacheData.timestamp));
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching data.');
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (expandedTier && expandedRef.current) {
      setTimeout(() => {
        expandedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [expandedTier]);

  const formatIST = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }) + ' IST';
  };

  const getScore = () => {
    if (!data) return 0;
    let greenCount = 0;
    Object.keys(SIGNAL_METADATA).forEach(key => {
      if (data[key]?.st === 'g') greenCount++;
    });
    return greenCount;
  };

  const getTierScore = (tierId: string) => {
    if (!data) return 0;
    let greenCount = 0;
    Object.entries(SIGNAL_METADATA).forEach(([key, meta]) => {
      if (meta.tier === tierId && data[key]?.st === 'g') greenCount++;
    });
    return greenCount;
  };

  const getDeploymentAction = (score: number) => {
    if (score <= 3) return { text: 'Hold dry powder', desc: 'Keep SIPs only. No lump sum deployment.', tranche: 'None', trigger: 'Wait for 4+ green signals' };
    if (score <= 6) return { text: 'Deploy Tranche 1', desc: 'Deploy 25% of available capital, staggered over 2 weeks.', tranche: 'Tranche 1 (25%)', trigger: 'Wait for 7+ green signals for next tranche' };
    if (score <= 10) return { text: 'Deploy Tranche 2', desc: 'Deploy 50% cumulative, staggered over 2-3 weeks.', tranche: 'Tranche 2 (50%)', trigger: 'Wait for 11+ green signals for full deployment' };
    return { text: 'Deploy Tranche 3', desc: 'Full position. 2-3 year horizon.', tranche: 'Tranche 3 (100%)', trigger: 'Fully deployed' };
  };

  if (selectedSignal && data) {
    return <SignalDetail 
      signalKey={selectedSignal} 
      data={data[selectedSignal]} 
      onBack={() => setSelectedSignal(null)} 
    />;
  }

  const score = getScore();
  const action = getDeploymentAction(score);
  const dotColor = error ? 'bg-red-500' : loading ? 'bg-amber-500 animate-pulse' : 'bg-green-500 animate-pulse';

  return (
    <div className="min-h-screen bg-[#f5f5f3] font-sans pb-12">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
          <h1 className="text-base sm:text-lg font-semibold text-gray-900 leading-tight">India Recovery Signals</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => loadData(true)} 
            disabled={loading}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            aria-label="Refresh data"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={onClearKey}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 mt-6 space-y-6">
        
        {error && (
          <div className="bg-white rounded-2xl p-6 border border-red-200 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load signals</h3>
                <pre className="bg-red-50 text-red-800 p-3 rounded-lg text-sm font-mono whitespace-pre-wrap break-words mb-4">
                  {error}
                </pre>
                <div className="flex gap-3">
                  <button onClick={() => loadData(true)} className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800">
                    Try again
                  </button>
                  <button onClick={onClearKey} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                    Change API Key
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!error && (
          <>
            {/* Dashboard Info & Summary */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
              <div className="flex items-start gap-3 mb-4">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-base font-bold text-gray-900 mb-1">How to read this dashboard</h2>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    This tool tracks 16 critical macroeconomic and geopolitical signals to determine if it's safe to deploy capital into Indian equities during the US-Iran conflict. Signals are grouped into 4 tiers. Click on any tier to view its specific signals, and click a signal card to view its sources.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 border-t border-gray-100 pt-4">
                <RefreshCw className="w-3 h-3" />
                <span>Last refreshed: {lastUpdated || 'Updating...'}</span>
              </div>
            </div>

            {/* Score & Verdict */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-center">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Recovery Score</p>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-5xl font-bold text-gray-900">{loading ? '-' : score}</span>
                  <span className="text-xl text-gray-400 font-medium">/ 16</span>
                </div>
                <div className={`inline-flex px-4 py-2 rounded-xl font-semibold text-sm border w-fit ${
                  score <= 3 ? 'bg-red-50 text-red-700 border-red-200' :
                  score <= 6 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  score <= 10 ? 'bg-green-50 text-green-700 border-green-200' :
                  'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}>
                  {loading ? 'Analyzing...' : action.text}
                </div>
              </div>
              
              <div className="md:col-span-2 bg-gray-900 rounded-2xl p-6 shadow-lg text-white flex flex-col justify-center">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Overall Verdict</h3>
                <p className="text-gray-100 text-base leading-relaxed">
                  {loading ? (
                    <span className="animate-pulse bg-gray-700 h-16 w-full block rounded"></span>
                  ) : (
                    data?.overallVerdict || 'Awaiting analysis...'
                  )}
                </p>
              </div>
            </div>

            {/* Tiers Grid */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider px-2">Signal Tiers</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AnimatePresence mode="popLayout">
                  {['t1', 't2', 't3', 't4'].map((tierId) => {
                    const tier = TIER_METADATA[tierId as keyof typeof TIER_METADATA];
                    const tierScore = getTierScore(tierId);
                    const isExpanded = expandedTier === tierId;

                    if (expandedTier && !isExpanded) return null;

                    return (
                      <motion.button
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        transition={{ duration: 0.3 }}
                        key={tierId}
                        onClick={() => setExpandedTier(isExpanded ? null : tierId)}
                        className={`text-left rounded-2xl p-5 border transition-all duration-200 ${
                          isExpanded 
                            ? `ring-2 ring-offset-2 ring-${tier.color}-500 ${tier.bg} ${tier.border} col-span-1 sm:col-span-2` 
                            : `bg-white hover:${tier.bg} border-gray-200`
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold bg-white/80 ${tier.text} border ${tier.border}`}>{tier.id}</span>
                            <h3 className="font-bold text-gray-900">{tier.name}</h3>
                          </div>
                          <div className="flex items-baseline gap-1 bg-white/50 px-2 py-1 rounded-lg">
                            <span className="text-lg font-bold text-gray-900">{loading ? '-' : tierScore}</span>
                            <span className="text-xs text-gray-500 font-medium">/ 4</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {loading ? 'Analyzing tier summary...' : data?.tierSummary?.[tierId] || 'No summary available.'}
                        </p>
                        <div className={`mt-4 text-xs font-semibold flex items-center gap-1 ${isExpanded ? tier.text : 'text-gray-400'}`}>
                          {isExpanded ? 'Hide details' : 'View details'} <ArrowRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </div>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>

            {/* Expanded Tier Details */}
            <AnimatePresence>
              {expandedTier && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  ref={expandedRef} 
                  className="mt-6 pt-6 border-t border-gray-200"
                >
                  <div className="flex items-center gap-3 mb-4 px-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${TIER_METADATA[expandedTier as keyof typeof TIER_METADATA].bg} ${TIER_METADATA[expandedTier as keyof typeof TIER_METADATA].text} border ${TIER_METADATA[expandedTier as keyof typeof TIER_METADATA].border}`}>
                      {TIER_METADATA[expandedTier as keyof typeof TIER_METADATA].id}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900">
                      {TIER_METADATA[expandedTier as keyof typeof TIER_METADATA].name} Signals
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(SIGNAL_METADATA)
                      .filter(([_, meta]) => meta.tier === expandedTier)
                      .map(([key, meta]) => (
                        <SignalCard 
                          key={key}
                          id={key}
                          meta={meta}
                          data={data?.[key]}
                          loading={loading}
                          tier={TIER_METADATA[expandedTier as keyof typeof TIER_METADATA]}
                          onClick={() => !loading && data?.[key] && setSelectedSignal(key)}
                        />
                      ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </main>

      <footer className="max-w-5xl mx-auto px-4 sm:px-6 mt-12 text-center pb-8">
        <p className="text-xs text-gray-400 max-w-2xl mx-auto">
          Disclaimer: This dashboard is a personal tool based on predefined heuristics and AI analysis. It does not constitute professional financial advice. Always do your own research before investing.
        </p>
      </footer>
    </div>
  );
}

const SignalCard: React.FC<{ id: string, meta: any, data: any, loading: boolean, onClick: () => void, tier: any }> = ({ id, meta, data, loading, onClick, tier }) => {
  if (loading || !data) {
    return (
      <div className={`bg-white rounded-xl p-5 border ${tier.border} shadow-sm h-48 flex flex-col animate-pulse`}>
        <div className="flex justify-between items-start mb-3">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-5 bg-gray-200 rounded-full w-12"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-3"></div>
        <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
        <div className="h-3 bg-gray-200 rounded w-4/5 mt-auto"></div>
      </div>
    );
  }

  const status = data.st as 'g' | 'a' | 'r';
  const statusColors = STATUS_COLORS[status] || STATUS_COLORS.a;
  const statusLabels = { g: 'GREEN', a: 'AMBER', r: 'RED' };

  return (
    <button 
      onClick={onClick}
      className={`text-left bg-white rounded-xl p-5 border-2 ${tier.border} shadow-sm hover:shadow-md transition-all group flex flex-col h-full relative overflow-hidden`}
    >
      <div className={`absolute inset-0 ${tier.bg} opacity-30 pointer-events-none transition-opacity group-hover:opacity-50`}></div>
      
      <div className="relative z-10 flex justify-between items-start mb-3 w-full">
        <h3 className={`text-xs font-bold uppercase tracking-wider line-clamp-2 pr-2 ${tier.text}`}>{meta.name}</h3>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider shrink-0 ${statusColors.pill} border ${statusColors.border}`}>
          {statusLabels[status]}
        </span>
      </div>
      
      <div className="relative z-10 font-mono text-xl font-semibold text-gray-900 mb-2 truncate w-full">
        {data.val}
      </div>
      
      <p className="relative z-10 text-sm text-gray-700 line-clamp-3 mb-4 flex-grow">
        {data.shortSum}
      </p>
      
      <div className="relative z-10 flex items-center justify-between w-full mt-auto pt-3 border-t border-gray-200/50">
        <span className="text-[10px] text-gray-500 font-medium truncate pr-2">
          {meta.threshold}
        </span>
        <span className={`text-xs ${tier.text} font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0`}>
          Sources <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </button>
  );
}

function SignalDetail({ signalKey, data, onBack }: { signalKey: string, data: any, onBack: () => void }) {
  const meta = SIGNAL_METADATA[signalKey as keyof typeof SIGNAL_METADATA];
  const tier = TIER_METADATA[meta.tier as keyof typeof TIER_METADATA];
  const status = data.st as 'g' | 'a' | 'r';
  const colors = STATUS_COLORS[status] || STATUS_COLORS.a;
  const statusLabels = { g: 'GREEN', a: 'AMBER', r: 'RED' };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[#f5f5f3] overflow-y-auto font-sans flex flex-col">
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${tier.bg} ${tier.text} border ${tier.border}`}>
          {tier.id}
        </span>
        <h1 className="text-sm font-semibold text-gray-900 truncate">{meta.name}</h1>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 md:p-8">
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${colors.pill}`}>
              {statusLabels[status]}
            </span>
            <span className="text-sm text-gray-500 font-medium">Current Status</span>
          </div>
          
          <div className="font-mono text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            {data.val}
          </div>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-base sm:text-lg text-gray-700 leading-relaxed whitespace-pre-line">
              {data.detailedSum}
            </p>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-100">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Threshold Rules</h4>
            <p className="text-sm text-gray-600 font-mono bg-gray-50 p-3 rounded-lg inline-block">
              {meta.threshold}
            </p>
          </div>
        </div>

        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 px-2">Sources & Verification</h3>
        <div className="space-y-3">
          {data.sources && data.sources.length > 0 ? (
            data.sources.map((source: any, idx: number) => {
              let domain = '';
              try { domain = new URL(source.url).hostname.replace('www.', ''); } catch(e) {}
              
              return (
                <a 
                  key={idx}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group"
                >
                  <div className="flex justify-between items-start gap-4 mb-1">
                    <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {source.title}
                    </h4>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-500 shrink-0 mt-0.5" />
                  </div>
                  {domain && <p className="text-xs font-medium text-blue-600 mb-2">{domain}</p>}
                  <p className="text-sm text-gray-600 line-clamp-2">{source.desc}</p>
                </a>
              );
            })
          ) : (
            <div className="bg-white rounded-xl p-6 border border-gray-200 text-center text-gray-500 text-sm">
              No sources provided for this signal.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
