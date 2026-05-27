import React, { useState, useEffect } from 'react';
import { useStageStore } from '../store/stageStore';
import StageHeader from '../components/common/StageHeader';
import AICard from '../components/common/AICard';
import { 
  Store, 
  Coins, 
  ArrowRight, 
  MapPin, 
  CheckCircle2, 
  Info,
  CalendarDays,
  FileBadge2,
  Table,
  Sliders,
  Sparkles,
  Award
} from 'lucide-react';
import { downloadMarkdownReport } from '../utils/reportGenerator';

export default function Stage10Page() {
  const { sessionId, stageOutputs, saveStageOutput, loading, setLoading, setError, error, resetSession } = useStageStore();

  const [quantity, setQuantity] = useState('20');
  const [grade, setGrade] = useState('Grade A (Premium)');

  const [marketResult, setMarketResult] = useState(null);
  
  // Custom states for local calculator
  const [calcQuantity, setCalcQuantity] = useState(20);
  const [showFinishOverlay, setShowFinishOverlay] = useState(false);

  const selectedCrop = stageOutputs.stage1?.selectedCrop || 'Paddy';
  const locationName = stageOutputs.stage1?.locationName || 'Nalgonda, Telangana';

  // Dynamically set default quantity based on Stage 8 yield estimate or crop yield per acre scaled by area
  useEffect(() => {
    if (!stageOutputs.stage10) {
      const stage8Yield = stageOutputs.stage8?.yieldEstimate?.expectedYield;
      if (stage8Yield) {
        const match = stage8Yield.match(/(\d+(?:\.\d+)?)/);
        if (match) {
          setQuantity(match[1]);
          setCalcQuantity(parseFloat(match[1]) || 20);
          return;
        }
      }
      
      const crop = selectedCrop.toLowerCase();
      const area = parseFloat(stageOutputs.stage2?.totalArea || 1.0);
      let yieldPerAcre = 20; // default for Paddy in quintals
      if (crop.includes('groundnut')) yieldPerAcre = 9;
      else if (crop.includes('maize') || crop.includes('corn')) yieldPerAcre = 21;
      else if (crop.includes('cotton')) yieldPerAcre = 7;
      else if (crop.includes('tomato')) yieldPerAcre = 135;
      else if (crop.includes('turmeric')) yieldPerAcre = 22;
      else if (crop.includes('sugarcane')) yieldPerAcre = 370;
      else if (crop.includes('mango')) yieldPerAcre = 45;
      else if (crop.includes('gram')) yieldPerAcre = 6;
      else if (crop.includes('chilli') || crop.includes('chillies')) yieldPerAcre = 13;

      const estimatedTotal = Math.round(yieldPerAcre * area);
      setQuantity(estimatedTotal.toString());
      setCalcQuantity(estimatedTotal);
    }
  }, [selectedCrop, stageOutputs.stage8, stageOutputs.stage2, stageOutputs.stage10]);

  // Hydrate stored outputs
  useEffect(() => {
    const existing = stageOutputs.stage10;
    if (existing) {
      setQuantity(existing.quantity || '20');
      setGrade(existing.grade || 'Grade A (Premium)');
      setCalcQuantity(parseFloat(existing.quantity) || 20);
      setMarketResult({
        prices: existing.prices,
        bestMarket: existing.bestMarket,
        earnings: existing.earnings,
        channels: existing.channels,
        packaging: existing.packaging,
        certSteps: existing.certSteps
      });
    }
  }, [stageOutputs.stage10]);

  const runMarketAnalysis = async () => {
    setLoading(true);
    setError(null);
    setMarketResult(null);

    try {
      const response = await fetch('/api/stage10/market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: parseFloat(quantity),
          grade,
          sessionContext: stageOutputs
        })
      });

      if (!response.ok) {
        throw new Error("Failed to compile APMC price structures.");
      }

      const data = await response.json();
      setMarketResult(data);
      setCalcQuantity(parseFloat(quantity));

      // Save output to global store
      saveStageOutput('stage10', {
        quantity,
        grade,
        ...data
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    setShowFinishOverlay(true);
  };

  const handleRestart = () => {
    setShowFinishOverlay(false);
    resetSession();
  };

  const downloadReport = () => {
    downloadMarkdownReport(stageOutputs, sessionId);
  };

  return (
    <div className="space-y-8 relative">
      
      {/* Inner Animated Container (Transforms restricted here to allow fixed overlay position viewport alignment) */}
      <div className="space-y-8 animate-fade-in">
        <StageHeader
          number={10}
          title="APMC Market &amp; Premium Selling"
          description="Find the most profitable sales channels and certifications. We pull active regional APMC Mandi rates, calculate direct-to-consumer premiums, and outline step-by-step PGS-India group organic certification pathways."
        />

        {/* Input Form */}
        <div className="glass-card p-6 rounded-2xl border border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-400 mb-1.5 uppercase">Harvested Quantity (Quintals)</label>
            <input
              type="number"
              placeholder="e.g. 20"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="organic-input text-xs font-mono font-bold"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-400 mb-1.5 uppercase">Produce Batch Grade</label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="organic-input text-xs"
            >
              <option value="Grade A (Premium)">Grade A (Premium - Polished/No blemishes)</option>
              <option value="Grade B (Standard)">Grade B (Standard - Minor blemishes)</option>
              <option value="Grade C (Utility)">Grade C (Utility - Broken/Feed-grade)</option>
            </select>
          </div>

          <div>
            <button
              onClick={runMarketAnalysis}
              disabled={loading || !quantity}
              className="btn-organic-primary w-full text-xs font-bold py-3.5 h-[46px]"
            >
              <Store className="w-4 h-4" />
              Analyze Markets
            </button>
          </div>
        </div>

        {marketResult && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Main AI advice */}
            <AICard title="Premium Organic Commercialization Strategy" severity="success">
              
              {/* Split recommend details */}
              <div className="p-4 bg-organic-green/5 border border-organic-green/10 rounded-xl leading-relaxed text-xs">
                <span className="text-[9px] uppercase font-bold text-organic-green block mb-0.5">Best Market Dispatch recommendation</span>
                <p className="font-extrabold text-slate-800 text-sm leading-snug">{marketResult.bestMarket.name}</p>
                <p className="text-slate-500 font-medium mt-1">{marketResult.bestMarket.rationale}</p>
              </div>

              {/* Earnings compare */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                
                {/* Premium Earnings Calculator (Left) */}
                <div className="md:col-span-2 space-y-4">
                  <h4 className="font-extrabold text-sm text-slate-800 flex items-center justify-between border-b border-slate-100 pb-2 uppercase">
                    <span className="flex items-center gap-1.5">
                      <Coins className="w-4.5 h-4.5 text-organic-green" />
                      Organic Premium Estimator
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase">
                      Quantity: {calcQuantity} Quintals
                    </span>
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    
                    {/* Conventional */}
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Conventional APMC Value</span>
                      <span className="font-black text-slate-500 text-lg">
                        ₹{Math.round(marketResult.earnings.conventionalEarnings).toLocaleString()}
                      </span>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1">At average regional Mandi price</p>
                    </div>

                    {/* Organic */}
                    <div className="p-4 bg-organic-lightGreen/15 border border-organic-green/10 rounded-xl">
                      <span className="text-[9px] uppercase font-bold text-organic-green block mb-0.5">Organic Premium Value</span>
                      <span className="font-black text-organic-green text-lg">
                        ₹{Math.round(marketResult.earnings.organicEarnings).toLocaleString()}
                      </span>
                      <p className="text-[10px] text-organic-green font-bold mt-1">PGS-India Premium realized</p>
                    </div>
                  </div>

                  {/* Gained Premium Box */}
                  <div className="p-3.5 bg-organic-green text-white rounded-xl shadow-md shadow-organic-green/10 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <span className="text-organic-lightGreen font-bold text-[9px] uppercase tracking-wide">Net Financial Organic Premium Gained</span>
                      <p className="text-slate-100 font-medium">Extra income pocketed due to chemical-free methods</p>
                    </div>
                    <span className="font-black text-base bg-white/20 px-3.5 py-2 rounded-lg border border-white/10 shrink-0">
                      + ₹{Math.round(marketResult.earnings.netPremiumGained).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Slider scale (Right) */}
                <div className="md:col-span-1 space-y-4">
                  <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2 uppercase font-sans">
                    <Sliders className="w-4.5 h-4.5 text-organic-green" />
                    Dynamic Calculator
                  </h4>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4 text-xs font-semibold">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Adjust volume (Quintals)</label>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={calcQuantity}
                        onChange={(e) => {
                          const newQ = parseInt(e.target.value);
                          setCalcQuantity(newQ);
                          // Live calculate local estimations
                          const basePrice = marketResult.prices[0]?.conventionalPrice || 1900;
                          const premiumPrice = marketResult.prices[0]?.organicPremium || 2400;
                          setMarketResult(prev => ({
                            ...prev,
                            earnings: {
                              conventionalEarnings: newQ * basePrice,
                              organicEarnings: newQ * premiumPrice,
                              netPremiumGained: newQ * (premiumPrice - basePrice)
                            }
                          }));
                        }}
                        className="w-full accent-organic-green"
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium text-center leading-normal">
                      *Slide the range bar above to simulate different yield scenarios. Formula accounts for cooperative premium rates.
                    </div>
                  </div>
                </div>

              </div>

              {/* APMC Mandi price comparison */}
              <div className="space-y-4 mt-6">
                <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2 uppercase">
                  <Table className="w-4.5 h-4.5 text-organic-green" />
                  Sortable Mandi &amp; Hub Price Comparison
                </h4>

                <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500 uppercase text-[9px] tracking-wide">
                        <th className="px-5 py-3">APMC Mandi / Hub</th>
                        <th className="px-5 py-3">Proximity</th>
                        <th className="px-5 py-3 text-center">Conventional rate (₹/Q)</th>
                        <th className="px-5 py-3 text-center">Organic Premium rate (₹/Q)</th>
                        <th className="px-5 py-3 text-right">Mandi Advantage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-medium text-slate-600">
                      {marketResult.prices.map((m, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="px-5 py-3.5 font-bold text-slate-800 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {m.marketName}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-[10px] text-slate-400">{m.distance}</td>
                          <td className="px-5 py-3.5 text-center font-bold text-slate-500">₹{m.conventionalPrice}</td>
                          <td className="px-5 py-3.5 text-center font-black text-organic-green bg-organic-lightGreen/5">₹{m.organicPremium}</td>
                          <td className="px-5 py-3.5 text-right font-semibold text-organic-brown">{m.bestFor}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Channels comparisons */}
              <div className="space-y-4 mt-6">
                <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2 uppercase">
                  <Store className="w-4.5 h-4.5 text-organic-green" />
                  Sales Channels Comparison
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {marketResult.channels.map((chan, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm flex flex-col justify-between hover-glow text-xs leading-normal">
                      <div className="space-y-2">
                        <h5 className="font-black text-slate-800 text-xs leading-snug">{chan.channelName}</h5>
                        <p className="text-[10px] text-slate-600 font-medium leading-relaxed">
                          <span className="text-organic-green font-bold">Pros:</span> {chan.pros}
                        </p>
                        <p className="text-[10px] text-slate-600 font-medium leading-relaxed">
                          <span className="text-alert-amber font-bold">Cons:</span> {chan.cons}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Certification pathway */}
              <div className="space-y-4 mt-6 border-t border-slate-100 pt-5">
                <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Award className="w-4.5 h-4.5 text-organic-green animate-bounce" />
                  PGS-India Organic Green Logo Certification Pathway
                </h4>

                <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm divide-y divide-slate-100">
                  {marketResult.certSteps.map((step, idx) => (
                    <div key={idx} className="p-4 hover:bg-slate-50/20 text-xs leading-normal">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                        <span className="font-black text-slate-700 text-sm flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-organic-green shrink-0" />
                          {step.step}
                        </span>
                        
                        <div className="flex gap-3 text-[10px] font-bold text-slate-400 uppercase">
                          <span>Authority: <span className="text-slate-600">{step.authority}</span></span>
                          <span>•</span>
                          <span>Time: <span className="text-organic-brown">{step.duration}</span></span>
                          <span>•</span>
                          <span>Cost: <span className="text-organic-green">{step.cost}</span></span>
                        </div>
                      </div>
                      
                      <p className="text-slate-500 font-medium leading-relaxed mt-1">
                        {step.details}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </AICard>

            {/* Finish Sowing Session Trigger */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 border-t border-slate-100/60 pt-6 mt-6">
              <button
                onClick={downloadReport}
                className="btn-organic-secondary py-4 px-8 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200 text-slate-700 shadow-sm"
              >
                📥 Download Farm Report (.MD)
              </button>
              <button
                onClick={handleFinish}
                className="btn-organic-primary py-4 px-10 font-bold tracking-wider uppercase text-xs shadow-xl scale-105"
              >
                <Sparkles className="w-4 h-4 animate-spin text-organic-lightGreen" />
                Complete 10-Stage Farm Plan
              </button>
            </div>

          </div>
        )}
      </div>

      {/* SUCCESS OVERLAY - Renders at root depth without transform constraints for perfect viewport centering */}
      {showFinishOverlay && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg text-center space-y-6 animate-fade-in shadow-2xl relative overflow-hidden border border-slate-100">
            <div className="absolute top-0 right-0 w-32 h-32 bg-organic-leaf/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="w-20 h-20 rounded-full bg-organic-lightGreen/40 text-organic-green flex items-center justify-center mx-auto shadow-inner border border-organic-green/10">
              <Award className="w-10 h-10 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-800 font-sans tracking-tight">Congratulations, Pilot!</h2>
              <h3 className="text-xs uppercase font-extrabold tracking-widest text-organic-brown">10-Stage Farm Audit Completed</h3>
              <p className="text-slate-500 text-xs leading-relaxed max-w-sm mx-auto pt-2">
                Your entire chemical-free sowing, spacing coordinates, irrigation component bill of materials, organic storage, and market price multipliers have been compiled and hydrated inside your local Zustand store.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs flex items-center justify-between">
              <span className="text-slate-400 font-bold uppercase text-[9px]">Active Sowing session ID</span>
              <span className="font-mono font-black text-slate-700 bg-white border px-3.5 py-1.5 rounded-lg shadow-sm">{sessionId || 'sess_1234'}</span>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={downloadReport}
                className="btn-organic-primary py-3 text-xs font-extrabold flex items-center justify-center gap-2 bg-organic-green hover:bg-emerald-700 text-white w-full shadow-lg"
              >
                📥 Download Complete Farm Report (.MD)
              </button>
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button
                  onClick={() => setShowFinishOverlay(false)}
                  className="btn-organic-secondary py-3 text-xs font-bold flex-1"
                >
                  Go Back to Summary
                </button>
                <button
                  onClick={handleRestart}
                  className="py-3 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex-1"
                >
                  Start New Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
