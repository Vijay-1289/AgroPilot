import React, { useState, useEffect } from 'react';
import { useStageStore } from '../store/stageStore';
import StageHeader from '../components/common/StageHeader';
import AICard from '../components/common/AICard';
import SyncButton from '../components/common/SyncButton';
import { 
  Sprout, 
  CalendarRange, 
  Target, 
  DollarSign, 
  Sliders, 
  LayoutGrid, 
  TableProperties, 
  Wrench,
  ChevronDown,
  ChevronUp,
  Ruler,
  Leaf,
  Download
} from 'lucide-react';
import { downloadMarkdownReport } from '../utils/reportGenerator';

export default function Stage3Page() {
  const { sessionId, stageOutputs, saveStageOutput, syncToNextStage, loading, setLoading, setError, error } = useStageStore();

  const [season, setSeason] = useState('Kharif');
  const [goal, setGoal] = useState('Commercial');
  const [budget, setBudget] = useState('');
  const [budgetType, setBudgetType] = useState('per-acre'); // 'per-acre' or 'total'
  
  const [planResult, setPlanResult] = useState(null);
  const [openSections, setOpenSections] = useState({
    seed: true,
    planting: true,
    layout: true,
    spacing: true,
    sowing: true,
    tools: true
  });

  const selectedCrop = stageOutputs.stage1?.selectedCrop || 'Paddy';
  const totalArea = stageOutputs.stage2?.totalArea || 1.0;

  useEffect(() => {
    const existing = stageOutputs.stage3;
    if (existing) {
      setSeason(existing.season || 'Kharif');
      setGoal(existing.goal || 'Commercial');
      setBudget(existing.budget || '');
      setBudgetType(existing.budgetType || 'per-acre');
      
      if (existing.seedType || existing.plantingMethod) {
        setPlanResult({
          seedType: existing.seedType,
          plantingMethod: existing.plantingMethod,
          plantingRationale: existing.plantingRationale,
          layout: existing.layout,
          spacing: existing.spacing,
          sowingMethod: existing.sowingMethod,
          tools: existing.tools
        });
      } else {
        setPlanResult(null);
      }
    }
  }, [stageOutputs.stage3]);

  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const generatePlan = async () => {
    setLoading(true);
    setError(null);
    setPlanResult(null);

    const budgetString = budget ? `₹${budget} ${budgetType === 'per-acre' ? 'per acre' : 'total budget'}` : 'Flexible';

    try {
      const response = await fetch('/api/stage3/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          season,
          goal,
          budget: budgetString,
          sessionContext: stageOutputs
        })
      });

      if (!response.ok) {
        throw new Error("Failed to synthesize farming plan.");
      }

      const data = await response.json();
      setPlanResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => {
    if (!planResult) return;

    const stage3Data = {
      season,
      goal,
      budget,
      budgetType,
      ...planResult
    };

    // Save and sync to Stage 4 (Irrigation)
    syncToNextStage('stage3', stage3Data, 4);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <StageHeader
        number={3}
        title="AI Sowing &amp; Layout Plan"
        description="Synthesize a comprehensive, zero-chemical organic cultivation roadmap. Our AI references regional ICAR standards to recommend compliant seed selections, custom spacing guidelines, sowing procedures, and required machinery."
      />

      {/* Sowing Parameters Form */}
      <div className="glass-card p-6 rounded-2xl border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="flex flex-col">
          <label className="text-xs font-bold text-slate-400 mb-1.5 uppercase flex items-center gap-1">
            <CalendarRange className="w-3.5 h-3.5 text-organic-green" />
            Cultivation Season
          </label>
          <select
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            className="organic-input text-xs"
          >
            <option value="Kharif">Kharif (Monsoon, June-Oct)</option>
            <option value="Rabi">Rabi (Winter, Nov-April)</option>
            <option value="Zaid">Zaid (Summer, March-June)</option>
            <option value="Year-Round">Year-Round / Perennial</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-bold text-slate-400 mb-1.5 uppercase flex items-center gap-1">
            <Target className="w-3.5 h-3.5 text-organic-green" />
            Farming Goal
          </label>
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="organic-input text-xs"
          >
            <option value="Subsistence">Subsistence (Home Food Security)</option>
            <option value="Commercial">Commercial (Local Market Mandi)</option>
            <option value="Export-Grade">Export-Grade (PGS-India Premium)</option>
            <option value="Seed Production">Seed Production (High-Spec)</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-bold text-slate-400 mb-1.5 uppercase flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-organic-green" />
            Expected Budget (₹)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Optional, e.g. 15000"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="organic-input text-xs flex-1 min-w-0"
            />
            <select
              value={budgetType}
              onChange={(e) => setBudgetType(e.target.value)}
              className="organic-input py-2 text-xs bg-slate-50 shrink-0"
            >
              <option value="per-acre">/ Acre</option>
              <option value="total">Total</option>
            </select>
          </div>
        </div>

        <div>
          <button
            onClick={generatePlan}
            disabled={loading}
            className="btn-organic-primary w-full text-xs font-bold py-3 px-6 h-[46px]"
          >
            <Sliders className="w-4 h-4" />
            Generate Plan
          </button>
        </div>
      </div>

      {planResult && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Main AI Plan Result */}
          <AICard title={`Organic Sowing Protocol: ${selectedCrop}`} severity="success">
            
            {/* 1. SEED TYPE */}
            <div className="border border-slate-100 rounded-xl overflow-hidden bg-white">
              <button 
                onClick={() => toggleSection('seed')}
                className="w-full bg-slate-50/60 hover:bg-slate-50 px-5 py-4 flex items-center justify-between border-b border-slate-100 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="p-1.5 rounded-lg bg-organic-lightGreen text-organic-green"><Sprout className="w-4 h-4" /></span>
                  <span className="font-extrabold text-sm text-slate-700">🌱 1. Seed Type Sourcing &amp; Variety</span>
                </div>
                {openSections.seed ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              
              {openSections.seed && (
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs leading-normal">
                  <div className="space-y-2">
                    <p className="text-slate-400 font-bold uppercase text-[9px]">Recommended Variety</p>
                    <p className="font-extrabold text-slate-800 text-sm">{planResult.seedType?.variety || 'N/A'}</p>
                    <p className="text-slate-500 font-medium">Suitable for organic cash cropping.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 bg-organic-cream/20 p-4 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Seed Source</span>
                      <span className="font-bold text-slate-800 leading-snug">{planResult.seedType?.source || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Days to Maturity</span>
                      <span className="font-bold text-organic-brown">{planResult.seedType?.daysToMaturity || 'N/A'}</span>
                    </div>
                    <div className="col-span-2 border-t border-slate-100 pt-2 mt-1">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Yield Potential / Acre</span>
                      <span className="font-black text-organic-green text-sm">{planResult.seedType?.yieldPotential || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. PLANTING METHOD */}
            <div className="border border-slate-100 rounded-xl overflow-hidden bg-white">
              <button 
                onClick={() => toggleSection('planting')}
                className="w-full bg-slate-50/60 hover:bg-slate-50 px-5 py-4 flex items-center justify-between border-b border-slate-100 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="p-1.5 rounded-lg bg-organic-lightGreen text-organic-green"><Leaf className="w-4 h-4" /></span>
                  <span className="font-extrabold text-sm text-slate-700">🧑🌾 2. Recommended Planting Method</span>
                </div>
                {openSections.planting ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {openSections.planting && (
                <div className="p-5 text-xs leading-normal space-y-2">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Planting Method</span>
                    <h4 className="font-black text-slate-800 text-sm">{planResult.plantingMethod || 'N/A'}</h4>
                  </div>
                  <div className="p-4 bg-organic-cream/15 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-[9px] uppercase font-bold text-organic-green block">Method Rationale</span>
                    <p className="text-slate-600 font-medium leading-relaxed">{planResult.plantingRationale || 'N/A'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* 3. ROW × COLUMN LAYOUT */}
            <div className="border border-slate-100 rounded-xl overflow-hidden bg-white">
              <button 
                onClick={() => toggleSection('layout')}
                className="w-full bg-slate-50/60 hover:bg-slate-50 px-5 py-4 flex items-center justify-between border-b border-slate-100 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="p-1.5 rounded-lg bg-organic-lightGreen text-organic-green"><LayoutGrid className="w-4 h-4" /></span>
                  <span className="font-extrabold text-sm text-slate-700">🔢 3. Row &times; Column Field Layout</span>
                </div>
                {openSections.layout ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {openSections.layout && (
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs leading-normal">
                  <div className="p-4 bg-organic-cream/20 rounded-xl border border-slate-100">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Grid Sowing Structure</span>
                    <p className="font-black text-slate-800 text-base leading-tight">
                      {planResult.layout?.rows || 0} Rows &times; {planResult.layout?.cols || 0} Columns
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">Recommended layout pattern</p>
                  </div>

                  <div className="p-4 bg-organic-cream/20 rounded-xl border border-slate-100">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Total Plant Capacity</span>
                    <p className="font-black text-organic-green text-lg leading-tight">
                      {planResult.layout?.totalPlants ? planResult.layout.totalPlants.toLocaleString() : 0} Plants
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">Calculated for {totalArea} Acres</p>
                  </div>
                </div>
              )}
            </div>

            {/* 4. SPACING SPECIFICATIONS */}
            <div className="border border-slate-100 rounded-xl overflow-hidden bg-white">
              <button 
                onClick={() => toggleSection('spacing')}
                className="w-full bg-slate-50/60 hover:bg-slate-50 px-5 py-4 flex items-center justify-between border-b border-slate-100 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="p-1.5 rounded-lg bg-organic-lightGreen text-organic-green"><Ruler className="w-4 h-4" /></span>
                  <span className="font-extrabold text-sm text-slate-700">📐 4. Geometric Spacing Guidelines</span>
                </div>
                {openSections.spacing ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {openSections.spacing && (
                <div className="p-5 text-xs leading-normal">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Row-to-Row</span>
                      <span className="font-black text-slate-800 text-base">{planResult.spacing?.rowToRow || 'N/A'}</span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Plant-to-Plant</span>
                      <span className="font-black text-slate-800 text-base">{planResult.spacing?.plantToPlant || 'N/A'}</span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Sowing Depth</span>
                      <span className="font-black text-organic-brown text-base">{planResult.spacing?.depth || 'N/A'}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold text-center mt-3">
                    *Adherence to these margins prevents soil nutrient starvation and increases light interception.
                  </p>
                </div>
              )}
            </div>

            {/* 5. SOWING METHOD */}
            <div className="border border-slate-100 rounded-xl overflow-hidden bg-white">
              <button 
                onClick={() => toggleSection('sowing')}
                className="w-full bg-slate-50/60 hover:bg-slate-50 px-5 py-4 flex items-center justify-between border-b border-slate-100 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="p-1.5 rounded-lg bg-organic-lightGreen text-organic-green"><TableProperties className="w-4 h-4" /></span>
                  <span className="font-extrabold text-sm text-slate-700">🌾 5. Sowing Method Pros &amp; Cons</span>
                </div>
                {openSections.sowing ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {openSections.sowing && (
                <div className="p-5 text-xs leading-normal space-y-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Sowing Method</span>
                    <h4 className="font-black text-slate-800 text-sm mt-0.5">{planResult.sowingMethod?.name || 'N/A'}</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-organic-lightGreen/10 border border-organic-lightGreen/20 text-organic-green rounded-xl">
                      <span className="text-[9px] uppercase font-bold block mb-1">Organic Advantages</span>
                      <p className="font-medium leading-relaxed">{planResult.sowingMethod?.pros || 'N/A'}</p>
                    </div>
                    <div className="p-4 bg-alert-amber/5 border border-alert-amber/20 text-alert-amber rounded-xl">
                      <span className="text-[9px] uppercase font-bold block mb-1">Operational Challenges</span>
                      <p className="font-medium leading-relaxed">{planResult.sowingMethod?.cons || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 6. RECOMMENDED AGRI-TECH SMART TOOLS */}
            <div className="border border-slate-100 rounded-xl overflow-hidden bg-white">
              <button 
                onClick={() => toggleSection('tools')}
                className="w-full bg-slate-50/60 hover:bg-slate-50 px-5 py-4 flex items-center justify-between border-b border-slate-100 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="p-1.5 rounded-lg bg-organic-lightGreen text-organic-green"><Wrench className="w-4 h-4" /></span>
                  <span className="font-extrabold text-sm text-slate-700">🔧 6. Precision Agri-Tech Smart Tools</span>
                </div>
                {openSections.tools ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {openSections.tools && (
                <div className="p-5 text-xs leading-normal">
                  <p className="text-slate-500 mb-4 text-[11px]">
                    Standard machinery and items suited for Indian micro-budgets. Can be sourced locally or via custom hiring centers (CHCs):
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {planResult.tools && planResult.tools.map((tool, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-organic-cream/10 flex flex-col justify-between hover-glow">
                        <div className="space-y-1">
                          <h5 className="font-extrabold text-slate-800 text-xs leading-tight">{tool.name}</h5>
                          <p className="text-[10px] text-slate-400 font-medium">{tool.spec}</p>
                        </div>
                        <div className="border-t border-slate-100/60 pt-2.5 mt-3 flex items-center justify-between">
                          <span className="text-[9px] uppercase font-bold text-slate-400">Price Range</span>
                          <span className="font-black text-organic-green text-xs">{tool.priceRange}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </AICard>

          {/* Proceed Trigger */}
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
              label="Sync &amp; Proceed to Stage 4 (Irrigation Setup)"
            />
          </div>

        </div>
      )}

    </div>
  );
}
