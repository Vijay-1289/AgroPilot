import React, { useState, useEffect } from 'react';
import { useStageStore } from '../store/stageStore';
import StageHeader from '../components/common/StageHeader';
import AICard from '../components/common/AICard';
import SyncButton from '../components/common/SyncButton';
import { 
  Sparkles, 
  Beaker, 
  Wrench, 
  CalendarDays, 
  CheckSquare, 
  Square,
  BookmarkCheck,
  Compass,
  Download
} from 'lucide-react';
import { downloadMarkdownReport } from '../utils/reportGenerator';

export default function Stage5Page() {
  const { sessionId, stageOutputs, saveStageOutput, syncToNextStage, loading, setLoading, setError, error } = useStageStore();

  const [seedingResult, setSeedingResult] = useState(null);
  
  // Track checked days in the 14-day germination plan locally for user interaction
  const [checkedDays, setCheckedDays] = useState({});

  const selectedCrop = stageOutputs.stage1?.selectedCrop || 'Paddy';
  const selectedVariety = stageOutputs.stage3?.seedType?.variety || 'Organic Selection';

  useEffect(() => {
    const existing = stageOutputs.stage5;
    if (existing) {
      setSeedingResult({
        seedTreatment: existing.seedTreatment,
        sowingTools: existing.sowingTools,
        germinationPlan: existing.germinationPlan
      });
      // Restore checked days
      setCheckedDays(existing.checkedDays || {});
    }
  }, [stageOutputs.stage5]);

  const loadSeedingProtocol = async () => {
    setLoading(true);
    setError(null);
    setSeedingResult(null);

    try {
      const response = await fetch('/api/stage5/seeding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionContext: stageOutputs })
      });

      if (!response.ok) {
        throw new Error("Failed to compile seeding protocols.");
      }

      const data = await response.json();
      setSeedingResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleDayCheck = (dayIndex) => {
    setCheckedDays(prev => ({
      ...prev,
      [dayIndex]: !prev[dayIndex]
    }));
  };

  const handleProceed = () => {
    if (!seedingResult) return;

    const stage5Data = {
      ...seedingResult,
      checkedDays
    };

    // Save and sync to Stage 6 (Monitoring)
    syncToNextStage('stage5', stage5Data, 6);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <StageHeader
        number={5}
        title="Organic Seed Coating &amp; Germination Watch"
        description="Shield seeds from initial soil-borne pathogens using bio-inoculants and dynamic natural mixtures. We formulate specialized local sowing tools and map a 14-day chronological germination audit schedule."
      />

      {/* Initialize trigger if not loaded */}
      {!seedingResult && (
        <div className="glass-card p-8 rounded-2xl border border-slate-100 text-center space-y-5 max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-organic-lightGreen text-organic-green flex items-center justify-center mx-auto shadow-md">
            <Beaker className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-base">Load Seeding Protocols</h3>
            <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
              Compile tailored seed dressing mixtures, select local sowing drills/markers, and initialize the interactive 14-day emergence audit for <span className="font-semibold">{selectedVariety} ({selectedCrop})</span>.
            </p>
          </div>
          <button
            onClick={loadSeedingProtocol}
            disabled={loading}
            className="btn-organic-primary w-full text-xs font-bold py-3.5"
          >
            {loading ? "Compiling formulations..." : "Synthesize Seeding Protocol"}
          </button>
        </div>
      )}

      {seedingResult && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Main AI advice container */}
          <AICard title={`Seed Coating Recipe: ${seedingResult.seedTreatment.name}`} severity="success">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Recipe card (Left) */}
              <div className="md:col-span-2 space-y-4">
                <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2 uppercase">
                  <Beaker className="w-4.5 h-4.5 text-organic-green" />
                  Bio-Coating Formulation
                </h4>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs leading-relaxed space-y-3">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Ingredients &amp; Ratios</span>
                    <p className="font-bold text-slate-800">{seedingResult.seedTreatment.ingredients}</p>
                  </div>
                  
                  <div className="border-t border-slate-200/60 pt-3">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Step-by-Step Coating Process</span>
                    <p className="text-slate-600 font-medium">{seedingResult.seedTreatment.process}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-3.5 rounded-xl border border-slate-100 bg-organic-cream/20 text-xs">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Treatment Frequency</span>
                    <p className="font-bold text-slate-800">{seedingResult.seedTreatment.frequency}</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-100 bg-organic-cream/20 text-xs">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Drying Guidelines</span>
                    <p className="font-bold text-organic-brown">{seedingResult.seedTreatment.dryingInstructions}</p>
                  </div>
                </div>
              </div>

              {/* Sowing Machinery Tools (Right) */}
              <div className="md:col-span-1 space-y-4">
                <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2 uppercase">
                  <Wrench className="w-4.5 h-4.5 text-organic-green" />
                  Recommended Sowing Tools
                </h4>

                <div className="space-y-3.5">
                  {seedingResult.sowingTools.map((tool, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm flex flex-col justify-between hover-glow">
                      <div>
                        <h5 className="font-extrabold text-slate-800 text-xs leading-snug">{tool.name}</h5>
                        <p className="text-[9px] text-slate-400 font-medium mt-0.5 leading-snug">{tool.spec}</p>
                      </div>
                      <div className="border-t border-slate-100 pt-2.5 mt-3 flex items-center justify-between text-[10px]">
                        <span className="font-bold text-slate-400 uppercase">Est. Price</span>
                        <span className="font-black text-organic-green">{tool.priceRange}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* 14-Day Germination Watch Schedule (CHECKLIST) */}
            <div className="space-y-4 mt-6">
              <h4 className="font-extrabold text-sm text-slate-800 flex items-center justify-between border-b border-slate-100 pb-2 uppercase">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="w-4.5 h-4.5 text-organic-green" />
                  14-Day Germination Checkup Calendar
                </span>
                <span className="text-[10px] text-organic-green font-extrabold tracking-widest bg-organic-lightGreen px-2.5 py-0.5 rounded-md uppercase">
                  Interactive Tracker
                </span>
              </h4>

              <p className="text-slate-500 text-[11px] leading-relaxed">
                Emergence marks the most critical window in seedling survival. Check off each procedural day below as you audit your farm plot to log germination benchmarks:
              </p>

              {/* Checklist grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                {seedingResult.germinationPlan.map((plan, idx) => {
                  const isChecked = !!checkedDays[idx];
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleDayCheck(idx)}
                      className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all duration-200 ${
                        isChecked 
                          ? 'bg-organic-green/5 border-organic-green/40 shadow-sm' 
                          : 'bg-white hover:bg-slate-50 border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className="shrink-0 mt-0.5 text-organic-green">
                        {isChecked ? <BookmarkCheck className="w-5 h-5 text-organic-green" /> : <Square className="w-5 h-5 text-slate-300" />}
                      </div>

                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-black uppercase tracking-wider ${isChecked ? 'text-organic-green' : 'text-organic-brown'}`}>
                            {plan.day}
                          </span>
                          {isChecked && (
                            <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-organic-green/10 text-organic-green uppercase">
                              Done
                            </span>
                          )}
                        </div>
                        
                        <p className={`font-semibold text-xs leading-snug text-slate-800 ${isChecked ? 'line-through text-slate-400' : ''}`}>
                          {plan.action}
                        </p>
                        
                        <div className="border-t border-slate-100/60 pt-1.5 flex items-center justify-between text-[9px]">
                          <span className="text-slate-400 font-bold uppercase">Emergence Target:</span>
                          <span className={`font-extrabold ${isChecked ? 'text-slate-400' : 'text-slate-600'}`}>{plan.target}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </AICard>

          {/* Sync Trigger */}
          <div className="flex flex-col sm:flex-row justify-between items-center border-t border-slate-100/60 pt-6 mt-6 gap-4">
            <button
              onClick={() => downloadMarkdownReport(stageOutputs, sessionId)}
              className="btn-organic-secondary py-3 px-6 text-xs font-bold w-full sm:w-auto hover:bg-slate-50 transition-all border border-slate-200 text-slate-700 flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Download Draft Report (.MD)
            </button>
            <SyncButton
              onClick={handleProceed}
              loading={loading}
              label="Sync &amp; Proceed to Stage 6 (Growth Monitoring)"
            />
          </div>

        </div>
      )}

    </div>
  );
}
