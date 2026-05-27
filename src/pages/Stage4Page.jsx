import React, { useState, useEffect } from 'react';
import { useStageStore } from '../store/stageStore';
import StageHeader from '../components/common/StageHeader';
import AICard from '../components/common/AICard';
import SyncButton from '../components/common/SyncButton';
import { 
  Droplets, 
  Zap, 
  Gauge, 
  ChevronDown, 
  ChevronUp, 
  Wrench, 
  Info, 
  TableProperties, 
  Sliders,
  AlertCircle,
  Download
} from 'lucide-react';
import { downloadMarkdownReport } from '../utils/reportGenerator';

export default function Stage4Page() {
  const { sessionId, stageOutputs, saveStageOutput, syncToNextStage, loading, setLoading, setError, error } = useStageStore();

  const [waterSource, setWaterSource] = useState('Borewell');
  const [availability, setAvailability] = useState('Continuous');
  const [powerSource, setPowerSource] = useState('Solar');
  const [budgetOption, setBudgetOption] = useState('flexible'); // 'flexible', 'low', 'medium', 'high', 'enterprise', 'custom'
  const [customBudget, setCustomBudget] = useState('');

  const [irrigationResult, setIrrigationResult] = useState(null);
  const [openSections, setOpenSections] = useState({
    method: true,
    components: true,
    waterNeeds: true,
    energy: true
  });

  const selectedCrop = stageOutputs.stage1?.selectedCrop || 'Paddy';
  const totalArea = stageOutputs.stage2?.totalArea || 1.0;

  useEffect(() => {
    const existing = stageOutputs.stage4;
    if (existing) {
      setWaterSource(existing.waterSource || 'Borewell');
      setAvailability(existing.availability || 'Continuous');
      setPowerSource(existing.powerSource || 'Solar');
      
      const existingBudget = existing.budget || '';
      if (existingBudget === '' || existingBudget.toLowerCase() === 'flexible') {
        setBudgetOption('flexible');
        setCustomBudget('');
      } else if (existingBudget === 'Under ₹15,000') {
        setBudgetOption('low');
      } else if (existingBudget === '₹15,000 - ₹40,000') {
        setBudgetOption('medium');
      } else if (existingBudget === '₹40,000 - ₹80,000') {
        setBudgetOption('high');
      } else if (existingBudget === '₹80,000+') {
        setBudgetOption('enterprise');
      } else {
        setBudgetOption('custom');
        setCustomBudget(existingBudget.replace('₹', ''));
      }

      if (existing.method) {
        setIrrigationResult({
          method: existing.method,
          rationale: existing.rationale,
          components: existing.components,
          waterNeeds: existing.waterNeeds,
          energyReq: existing.energyReq
        });
      } else {
        setIrrigationResult(null);
      }
    }
  }, [stageOutputs.stage4]);

  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const generateIrrigationPlan = async () => {
    setLoading(true);
    setError(null);
    setIrrigationResult(null);

    let budgetString = 'Flexible';
    if (budgetOption === 'low') budgetString = 'Under ₹15,000';
    else if (budgetOption === 'medium') budgetString = '₹15,000 - ₹40,000';
    else if (budgetOption === 'high') budgetString = '₹40,000 - ₹80,000';
    else if (budgetOption === 'enterprise') budgetString = '₹80,000+';
    else if (budgetOption === 'custom' && customBudget) budgetString = `₹${customBudget}`;

    try {
      const response = await fetch('/api/stage4/irrigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          waterSource,
          availability,
          powerSource,
          budget: budgetString,
          sessionContext: stageOutputs
        })
      });

      if (!response.ok) {
        throw new Error("Failed to formulate irrigation specification.");
      }

      const data = await response.json();
      setIrrigationResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => {
    if (!irrigationResult) return;

    let budgetString = 'Flexible';
    if (budgetOption === 'low') budgetString = 'Under ₹15,000';
    else if (budgetOption === 'medium') budgetString = '₹15,000 - ₹40,000';
    else if (budgetOption === 'high') budgetString = '₹40,000 - ₹80,000';
    else if (budgetOption === 'enterprise') budgetString = '₹80,000+';
    else if (budgetOption === 'custom' && customBudget) budgetString = `₹${customBudget}`;

    const stage4Data = {
      waterSource,
      availability,
      powerSource,
      budget: budgetString,
      ...irrigationResult
    };

    // Save and sync to Stage 5 (Seeding)
    syncToNextStage('stage4', stage4Data, 5);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <StageHeader
        number={4}
        title="Stage 4 — Irrigation Setup"
        description="Recommend the best organic-compatible irrigation method, components, and water schedule based on the farm's water and power situation."
      />

      {/* Input Parameters Form */}
      <div className="glass-card p-6 rounded-2xl border border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end shadow-sm">
        <div className="flex flex-col">
          <label className="text-xs font-bold text-slate-400 mb-1.5 uppercase flex items-center gap-1">
            <Droplets className="w-3.5 h-3.5 text-organic-green" />
            Water Source
          </label>
          <select
            value={waterSource}
            onChange={(e) => setWaterSource(e.target.value)}
            className="organic-input text-xs"
          >
            <option value="Borewell">Borewell (Tubewell)</option>
            <option value="Open Well">Open Well (Dugwell)</option>
            <option value="Rainwater Harvesting">Rainwater Harvesting</option>
            <option value="Canal">Canal Supply</option>
            <option value="AWG (Atmospheric Water Generation)">AWG (Atmospheric Generation)</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-bold text-slate-400 mb-1.5 uppercase flex items-center gap-1">
            <Gauge className="w-3.5 h-3.5 text-organic-green" />
            Water Availability
          </label>
          <select
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            className="organic-input text-xs"
          >
            <option value="Continuous">Continuous (24x7)</option>
            <option value="Limited">Limited (4-6 hrs/day)</option>
            <option value="Seasonal">Seasonal (Monsoon)</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-bold text-slate-400 mb-1.5 uppercase flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-organic-green" />
            Power Source
          </label>
          <select
            value={powerSource}
            onChange={(e) => setPowerSource(e.target.value)}
            className="organic-input text-xs"
          >
            <option value="Solar">Solar (DC Pump)</option>
            <option value="Grid">Grid (AC Supply)</option>
            <option value="None">None (Gravity-Fed)</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-bold text-slate-400 mb-1.5 uppercase flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5 text-organic-green" />
            Budget Target (INR)
          </label>
          <div className="flex gap-2">
            <select
              value={budgetOption}
              onChange={(e) => setBudgetOption(e.target.value)}
              className="organic-input text-xs flex-1 bg-white"
            >
              <option value="flexible">Flexible</option>
              <option value="low">Under ₹15,000</option>
              <option value="medium">₹15,000 - ₹40,000</option>
              <option value="high">₹40,000 - ₹80,000</option>
              <option value="enterprise">₹80,000+</option>
              <option value="custom">Custom...</option>
            </select>
            {budgetOption === 'custom' && (
              <input
                type="number"
                placeholder="e.g. 25000"
                value={customBudget}
                onChange={(e) => setCustomBudget(e.target.value)}
                className="organic-input text-xs w-[80px] shrink-0"
              />
            )}
          </div>
        </div>

        <div>
          <button
            onClick={generateIrrigationPlan}
            disabled={loading}
            className="btn-organic-primary w-full text-xs font-bold py-3 px-6 h-[46px] flex items-center justify-center gap-2"
          >
            <Sliders className="w-4 h-4" />
            Synthesize Setup
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-alert-amber/5 border border-alert-amber/20 text-alert-amber text-xs rounded-xl flex items-center gap-2 animate-shake">
          <AlertCircle className="w-4.5 h-4.5 shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {irrigationResult && (
        <div className="space-y-6 animate-fade-in">
          
          <AICard title={`Organic Irrigation Roadmap: ${selectedCrop}`} severity="success">
            
            {/* 1. RECOMMENDED METHOD */}
            <div className="border border-slate-100 rounded-xl overflow-hidden bg-white hover-shadow transition-all duration-200">
              <button 
                onClick={() => toggleSection('method')}
                className="w-full bg-slate-50/60 hover:bg-slate-50 px-5 py-4 flex items-center justify-between border-b border-slate-100 text-left transition-colors duration-150"
              >
                <div className="flex items-center gap-3">
                  <span className="p-1.5 rounded-lg bg-organic-lightGreen text-organic-green"><Droplets className="w-4 h-4" /></span>
                  <span className="font-extrabold text-sm text-slate-700">💧 1. Recommended Irrigation Method</span>
                </div>
                {openSections.method ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              
              {openSections.method && (
                <div className="p-5 text-xs leading-normal space-y-4">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[9px] uppercase font-bold text-slate-400">Design Selection:</span>
                    <span className="font-black text-xs text-organic-brown bg-organic-cream/40 border border-organic-cream px-3 py-1 rounded-lg">
                      {irrigationResult.method}
                    </span>
                  </div>
                  <div className="p-4 bg-organic-cream/15 rounded-xl border border-slate-100/80 space-y-1">
                    <span className="text-[9px] uppercase font-bold text-organic-green flex items-center gap-1">
                      <Info className="w-3 h-3" /> System Rationale & Crop Compatibility
                    </span>
                    <p className="text-slate-600 font-medium leading-relaxed mt-1">
                      {irrigationResult.rationale}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 2. COMPONENTS TABLE */}
            <div className="border border-slate-100 rounded-xl overflow-hidden bg-white hover-shadow transition-all duration-200">
              <button 
                onClick={() => toggleSection('components')}
                className="w-full bg-slate-50/60 hover:bg-slate-50 px-5 py-4 flex items-center justify-between border-b border-slate-100 text-left transition-colors duration-150"
              >
                <div className="flex items-center gap-3">
                  <span className="p-1.5 rounded-lg bg-organic-lightGreen text-organic-green"><TableProperties className="w-4 h-4" /></span>
                  <span className="font-extrabold text-sm text-slate-700">🔩 2. Drip / Sprinkler Bill of Materials (BOM)</span>
                </div>
                {openSections.components ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {openSections.components && (
                <div className="p-5 text-xs leading-normal space-y-3">
                  <p className="text-slate-400 font-semibold mb-2 text-[10px] uppercase">
                    Components Scaled to {totalArea} Acres Area Requirements:
                  </p>
                  <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500 uppercase text-[9px] tracking-wide">
                          <th className="px-5 py-3">Component name</th>
                          <th className="px-5 py-3">Specification</th>
                          <th className="px-5 py-3 text-center">Qty for {totalArea} Acre(s)</th>
                          <th className="px-5 py-3 text-right">Price Range (INR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-medium text-slate-600">
                        {irrigationResult.components && irrigationResult.components.map((comp, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors duration-100">
                            <td className="px-5 py-3.5 font-bold text-slate-800 flex items-center gap-1.5">
                              <Wrench className="w-3.5 h-3.5 text-organic-green/60" />
                              {comp.name}
                            </td>
                            <td className="px-5 py-3.5 font-mono text-[10px] text-slate-400">{comp.spec}</td>
                            <td className="px-5 py-3.5 text-center font-extrabold text-slate-700 bg-slate-50/20">{comp.qty}</td>
                            <td className="px-5 py-3.5 text-right font-black text-organic-green">{comp.priceRange}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* 3. WATER NEEDS CARD */}
            <div className="border border-slate-100 rounded-xl overflow-hidden bg-white hover-shadow transition-all duration-200">
              <button 
                onClick={() => toggleSection('waterNeeds')}
                className="w-full bg-slate-50/60 hover:bg-slate-50 px-5 py-4 flex items-center justify-between border-b border-slate-100 text-left transition-colors duration-150"
              >
                <div className="flex items-center gap-3">
                  <span className="p-1.5 rounded-lg bg-organic-lightGreen text-organic-green"><Gauge className="w-4 h-4" /></span>
                  <span className="font-extrabold text-sm text-slate-700">📊 3. Crop Water Needs &amp; Schedule</span>
                </div>
                {openSections.waterNeeds ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {openSections.waterNeeds && (
                <div className="p-5 text-xs leading-normal space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-organic-cream/15 rounded-xl border border-slate-100">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Daily Volume Required</span>
                      <span className="font-black text-slate-800 text-base">
                        {irrigationResult.waterNeeds?.litresPerDay?.toLocaleString() || 'N/A'} Litres
                      </span>
                      <p className="text-[9px] text-slate-400 font-semibold mt-1">Sized for exact transpiration demand on {totalArea} Acres</p>
                    </div>

                    <div className="p-4 bg-organic-cream/15 rounded-xl border border-slate-100">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Seasonal Volume Target</span>
                      <span className="font-black text-organic-green text-base">
                        {irrigationResult.waterNeeds?.litresPerSeason?.toLocaleString() || 'N/A'} Litres
                      </span>
                      <p className="text-[9px] text-slate-400 font-semibold mt-1">Calculated for standard 120 crop days</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-500 uppercase text-[9px] tracking-wide flex items-center gap-1">
                      <Droplets className="w-3.5 h-3.5 text-organic-green" /> Recommended Watering Frequency
                    </span>
                    <span className="font-extrabold text-organic-brown bg-white border border-slate-100 px-3.5 py-1.5 rounded-lg">
                      {irrigationResult.waterNeeds?.frequency}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 4. ENERGY CARD */}
            <div className="border border-slate-100 rounded-xl overflow-hidden bg-white hover-shadow transition-all duration-200">
              <button 
                onClick={() => toggleSection('energy')}
                className="w-full bg-slate-50/60 hover:bg-slate-50 px-5 py-4 flex items-center justify-between border-b border-slate-100 text-left transition-colors duration-150"
              >
                <div className="flex items-center gap-3">
                  <span className="p-1.5 rounded-lg bg-organic-lightGreen text-organic-green"><Zap className="w-4 h-4" /></span>
                  <span className="font-extrabold text-sm text-slate-700">⚡ 4. Energy Sizing &amp; Power Specifications</span>
                </div>
                {openSections.energy ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {openSections.energy && (
                <div className="p-5 text-xs leading-normal space-y-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Active Pump Power Sizing</span>
                    <h4 className="font-black text-slate-800 text-sm mt-0.5">{irrigationResult.energyReq?.powerNeeded}</h4>
                  </div>
                  
                  <div className="p-4 bg-organic-green/5 border border-organic-green/10 rounded-xl">
                    <span className="text-[9px] uppercase font-bold text-organic-green block mb-1">
                      {powerSource === 'Solar' ? 'PV Solar Panel Sizing Setup' : 'Power System Specifications'}
                    </span>
                    <p className="font-extrabold text-slate-700 text-xs leading-relaxed mt-0.5">
                      {irrigationResult.energyReq?.solarSizing}
                    </p>
                  </div>
                </div>
              )}
            </div>

          </AICard>

          {/* Sync & Proceed Button */}
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
              label="Sync &amp; Proceed to Stage 5 (Seeding)"
            />
          </div>

        </div>
      )}

    </div>
  );
}
