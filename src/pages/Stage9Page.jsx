import React, { useState, useEffect } from 'react';
import { useStageStore } from '../store/stageStore';
import StageHeader from '../components/common/StageHeader';
import AICard from '../components/common/AICard';
import SyncButton from '../components/common/SyncButton';
import { 
  Warehouse, 
  Thermometer, 
  Droplet, 
  Wind, 
  Activity, 
  Table, 
  Sliders, 
  FolderLock, 
  HelpCircle,
  Wrench,
  ChevronDown,
  ChevronUp,
  Download
} from 'lucide-react';
import { downloadMarkdownReport } from '../utils/reportGenerator';

export default function Stage9Page() {
  const { sessionId, stageOutputs, saveStageOutput, syncToNextStage, loading, setLoading, setError, error } = useStageStore();

  const [storageType, setStorageType] = useState('Hermetic bags');
  const [durationValue, setDurationValue] = useState('6');
  const [durationUnit, setDurationUnit] = useState('months');
  const [targetUse, setTargetUse] = useState('Local sale');

  const [storageResult, setStorageResult] = useState(null);
  
  // Collapse/Expand state for seed protocol
  const [showSeedProtocol, setShowSeedProtocol] = useState(false);

  const selectedCrop = stageOutputs.stage1?.selectedCrop || 'Paddy';

  // Dynamically set defaults based on crop perishability if no stored outputs exist
  useEffect(() => {
    if (!stageOutputs.stage9) {
      const crop = selectedCrop.toLowerCase();
      if (crop.includes('mango') || crop.includes('tomato')) {
        setStorageType('Cold room');
        setDurationValue('2');
        setDurationUnit('weeks');
        setTargetUse('Export');
      } else if (crop.includes('turmeric')) {
        setStorageType('Warehouse');
        setDurationValue('8');
        setDurationUnit('months');
        setTargetUse('Local sale');
      } else if (crop.includes('sugarcane')) {
        setStorageType('None available');
        setDurationValue('3');
        setDurationUnit('weeks');
        setTargetUse('Local sale');
      } else {
        // Grains, cotton, groundnuts
        setStorageType('Hermetic bags');
        setDurationValue('6');
        setDurationUnit('months');
        setTargetUse('Local sale');
      }
    }
  }, [selectedCrop, stageOutputs.stage9]);

  // Restore stored state
  useEffect(() => {
    const existing = stageOutputs.stage9;
    if (existing) {
      setStorageType(existing.storageType || 'Hermetic bags');
      // Split duration
      if (existing.duration) {
        const parts = existing.duration.split(' ');
        setDurationValue(parts[0] || '6');
        setDurationUnit(parts[1] || 'months');
      }
      setTargetUse(existing.targetUse || 'Local sale');
      setStorageResult({
        conditions: existing.conditions,
        treatments: existing.treatments,
        grading: existing.grading,
        packaging: existing.packaging,
        seedProtocol: existing.seedProtocol,
        products: existing.products
      });
    }
  }, [stageOutputs.stage9]);

  const generateStoragePlan = async () => {
    setLoading(true);
    setError(null);
    setStorageResult(null);

    const durationString = `${durationValue} ${durationUnit}`;

    try {
      const response = await fetch('/api/stage9/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storageType,
          duration: durationString,
          targetUse,
          sessionContext: stageOutputs
        })
      });

      if (!response.ok) {
        throw new Error("Failed to formulate storage specifications.");
      }

      const data = await response.json();
      setStorageResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => {
    if (!storageResult) return;

    const stage9Data = {
      storageType,
      duration: `${durationValue} ${durationUnit}`,
      targetUse,
      ...storageResult
    };

    // Save and sync to Stage 10 (Market & Selling)
    syncToNextStage('stage9', stage9Data, 10);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <StageHeader
        number={9}
        title="Organic Storage &amp; Preservation"
        description="Preserve harvested organic crop grains without toxic chemical fumigation. Our system formulates safe temperature boundaries, dried neem seed coatings, and airtight hermetic sealing specifications."
      />

      {/* Input controls */}
      <div className="glass-card p-6 rounded-2xl border border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
        <div className="flex flex-col">
          <label className="text-xs font-bold text-slate-400 mb-1.5 uppercase">Storage Infrastructure</label>
          <select
            value={storageType}
            onChange={(e) => setStorageType(e.target.value)}
            className="organic-input text-xs"
          >
            <option value="Hermetic bags">Hermetic Bags (PICS bags)</option>
            <option value="On-farm shed">On-Farm Mud Shed (Traditional)</option>
            <option value="Warehouse">State Cooperative Warehouse</option>
            <option value="Cold room">Controlled Atmosphere Cold Room</option>
            <option value="None available">None (Direct selling from plot)</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-bold text-slate-400 mb-1.5 uppercase">Target Storage Time</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={durationValue}
              onChange={(e) => setDurationValue(e.target.value)}
              className="organic-input text-xs flex-1 min-w-0"
            />
            <select
              value={durationUnit}
              onChange={(e) => setDurationUnit(e.target.value)}
              className="organic-input py-2 text-xs bg-slate-50 shrink-0"
            >
              <option value="weeks">Weeks</option>
              <option value="months">Months</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-bold text-slate-400 mb-1.5 uppercase">Intended Market Target</label>
          <select
            value={targetUse}
            onChange={(e) => setTargetUse(e.target.value)}
            className="organic-input text-xs"
          >
            <option value="Home consumption">Self / Home Consumption</option>
            <option value="Local sale">Local Mandi / Co-op Wholesalers</option>
            <option value="Export">Direct Retail Packaging / Organic Export</option>
          </select>
        </div>

        <div>
          <button
            onClick={generateStoragePlan}
            disabled={loading}
            className="btn-organic-primary w-full text-xs font-bold py-3 px-6 h-[46px]"
          >
            <Warehouse className="w-4 h-4" />
            Synthesize Storage
          </button>
        </div>
      </div>

      {storageResult && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Main AI advice */}
          <AICard title="NPOP Preserved Storage Protocol" severity="success">
            
            {/* Storage Micro-Conditions HUD */}
            <div className="space-y-4">
              <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2 uppercase">
                <Thermometer className="w-4.5 h-4.5 text-organic-green" />
                Critical Storage Microclimate Margins
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Temperature Bounds */}
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3 text-xs leading-normal">
                  <div className="p-2 rounded-lg bg-alert-amber/10 text-alert-amber shrink-0"><Thermometer className="w-5 h-5" /></div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Optimal Temperature</span>
                    <p className="font-black text-slate-800 text-sm">{storageResult.conditions.tempMin}°C - {storageResult.conditions.tempMax}°C</p>
                  </div>
                </div>

                {/* Humidity Bounds */}
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3 text-xs leading-normal">
                  <div className="p-2 rounded-lg bg-organic-green/10 text-organic-green shrink-0"><Droplet className="w-5 h-5" /></div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Safe Humidity Bounds</span>
                    <p className="font-black text-slate-800 text-sm">{storageResult.conditions.humidityMin}% - {storageResult.conditions.humidityMax}%</p>
                  </div>
                </div>

                {/* Ventilation Info */}
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3 text-xs leading-normal">
                  <div className="p-2 rounded-lg bg-organic-brown/10 text-organic-brown shrink-0"><Wind className="w-5 h-5" /></div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Air Exchange Rule</span>
                    <p className="font-bold text-slate-700 text-[10px] leading-tight mt-0.5">{storageResult.conditions.ventilation}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Organic Preservation Techniques */}
            <div className="space-y-4 mt-6">
              <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2 uppercase">
                <FolderLock className="w-4.5 h-4.5 text-organic-green" />
                Ranked Bio-Preservation Treatments
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {storageResult.treatments.map((t, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-organic-cream/10 flex flex-col justify-between hover-glow text-xs leading-normal">
                    <div className="space-y-2">
                      <h5 className="font-black text-slate-800 text-xs leading-tight">{t.treatment}</h5>
                      <p className="text-slate-500 font-medium leading-snug">{t.application}</p>
                    </div>
                    
                    <div className="border-t border-slate-100/60 pt-2.5 mt-3 flex items-center justify-between text-[10px] font-medium text-slate-400">
                      <span>Efficacy: <span className="font-bold text-slate-600">{t.duration}</span></span>
                      <span className="font-black text-organic-green">{t.costPerQuintal} / quintal</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Produce Grading Grid Table */}
            <div className="space-y-4 mt-6">
              <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2 uppercase">
                <Table className="w-4.5 h-4.5 text-organic-green" />
                Produce Quality Grading Guidelines
              </h4>

              <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500 uppercase text-[9px] tracking-wide">
                      <th className="px-5 py-3">Quality Grade</th>
                      <th className="px-5 py-3">NPOP Grading Criterion</th>
                      <th className="px-5 py-3 text-right">Recommended Sales Target</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-medium text-slate-600">
                    {storageResult.grading.map((g, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-5 py-3.5 font-bold text-slate-800">{g.grade}</td>
                        <td className="px-5 py-3.5 text-slate-400 font-semibold">{g.criteria}</td>
                        <td className="px-5 py-3.5 text-right font-extrabold text-organic-brown">{g.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Packaging and Seed Protocol Accordion */}
            <div className="space-y-4 mt-6">
              <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2 uppercase">
                <Activity className="w-4.5 h-4.5 text-organic-green" />
                Sales-Channel Packaging Bags
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {storageResult.packaging.map((pack, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs font-semibold">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400">Target Channel</span>
                      <span className="font-black text-slate-800 block">{pack.channel}</span>
                      <span className="text-[10px] text-slate-400 font-medium block leading-tight mt-0.5">{pack.material}</span>
                    </div>
                    <span className="font-black text-organic-green text-sm shrink-0">{pack.priceRange}</span>
                  </div>
                ))}
              </div>

              {/* Accordion Seed Saving Protocol */}
              <div className="border border-slate-100 rounded-xl overflow-hidden bg-white mt-4">
                <button
                  onClick={() => setShowSeedProtocol(!showSeedProtocol)}
                  className="w-full bg-slate-50/50 hover:bg-slate-50 px-5 py-4 flex items-center justify-between border-b border-slate-100 text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-md bg-organic-green/10 text-organic-green"><FolderLock className="w-4 h-4" /></span>
                    <span className="font-extrabold text-sm text-slate-700">Seed Saving &amp; Pot Labelling Protocol</span>
                  </div>
                  {showSeedProtocol ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {showSeedProtocol && (
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs leading-normal">
                    <div className="space-y-3">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Mother Crop Selection</span>
                        <p className="text-slate-600 font-medium">{storageResult.seedProtocol.selection}</p>
                      </div>
                      <div className="border-t border-slate-100 pt-2.5">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Moisture Sun-Drying Threshold</span>
                        <p className="text-slate-600 font-medium">{storageResult.seedProtocol.drying}</p>
                      </div>
                    </div>

                    <div className="bg-organic-cream/20 p-4 rounded-xl border border-slate-100 space-y-3">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Storage Pot / Airtight Container</span>
                        <p className="font-extrabold text-slate-800">{storageResult.seedProtocol.container}</p>
                      </div>
                      <div className="border-t border-slate-100 pt-2.5">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5 font-mono">Mandatory Tag/Label Format</span>
                        <p className="font-mono text-[10px] text-organic-brown bg-white p-2.5 rounded border border-slate-100 font-semibold leading-relaxed">
                          {storageResult.seedProtocol.labelling}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Storage Tech Products */}
            <div className="space-y-4 mt-6 border-t border-slate-100 pt-5">
              <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wide flex items-center gap-1">
                <Wrench className="w-4 h-4 text-organic-green" />
                Approved Storage Technologies
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {storageResult.products.map((p, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm flex flex-col justify-between hover-glow text-xs leading-normal">
                    <div>
                      <h5 className="font-extrabold text-slate-800 text-xs leading-snug">{p.name}</h5>
                      <p className="text-[9px] text-slate-400 font-medium mt-0.5 leading-snug">{p.spec}</p>
                      <p className="text-[9px] text-organic-brown font-semibold mt-1">Source: {p.source}</p>
                    </div>
                    
                    <div className="border-t border-slate-100 pt-2.5 mt-3 flex items-center justify-between text-[10px]">
                      <span className="font-bold text-slate-400 uppercase">Estimated Price</span>
                      <span className="font-black text-organic-green">{p.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </AICard>

          {/* Sync proceed triggers */}
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
              label="Sync &amp; Proceed to Stage 10 (Market &amp; Selling)"
            />
          </div>

        </div>
      )}

    </div>
  );
}
