import React, { useState } from 'react';
import { useStageStore } from '../store/stageStore';
import StageHeader from '../components/common/StageHeader';
import AICard from '../components/common/AICard';
import SyncButton from '../components/common/SyncButton';
import { downloadMarkdownReport } from '../utils/reportGenerator';
import { 
  Activity, 
  CheckCircle2, 
  FileText, 
  History, 
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Download
} from 'lucide-react';

const BREAKPOINTS = [
  { id: 'veg_early', label: 'Early Vegetative Phase (Days 15-30)' },
  { id: 'veg_mid', label: 'Mid-Vegetative Tilling (Days 30-50)' },
  { id: 'flowering', label: 'Flowering & Panicle Initiation (Days 50-75)' },
  { id: 'grain_fill', label: 'Fruiting & Grain Fill (Days 75-100)' },
  { id: 'pre_harvest', label: 'Pre-Harvest Audit (Days 100+)' }
];

export default function Stage6Page() {
  const { sessionId, stageOutputs, addCheckupLog, saveStageOutput, syncToNextStage, loading, setLoading, setError, error } = useStageStore();

  const [breakpointId, setBreakpointId] = useState('veg_early');
  const [activeCheckupResult, setActiveCheckupResult] = useState(null);

  const checkupLog = stageOutputs.stage6?.checkupLog || [];
  const selectedCrop = stageOutputs.stage1?.selectedCrop || 'Paddy';

  const executeCheckup = async () => {
    setLoading(true);
    setError(null);
    setActiveCheckupResult(null);

    const formData = new FormData();
    formData.append('breakpointId', breakpointId);
    
    // Default answers submitted for the selected checkpoint
    const answers = {
      leafAppearance: 'Green',
      stemGrowth: 'Normal',
      pestsObserved: 'None'
    };
    
    formData.append('answers', JSON.stringify(answers));
    formData.append('sessionContext', JSON.stringify(stageOutputs));
    
    try {
      const response = await fetch('/api/stage6/checkup', {
        method: 'POST',
        body: formData // Send as multipart form to handle endpoints consistency
      });

      if (!response.ok) {
        throw new Error("Failed to process growth diagnostic checkup.");
      }

      const data = await response.json();
      setActiveCheckupResult(data);

      // Save to global chronological store log
      addCheckupLog({
        breakpointId,
        breakpointLabel: BREAKPOINTS.find(b => b.id === breakpointId)?.label,
        answers,
        diagnosis: data.diagnosis,
        organicFix: data.organicFix,
        alertLevel: data.alertLevel
      });
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const executeBulkScout = async () => {
    setLoading(true);
    setError(null);
    setActiveCheckupResult(null);

    try {
      const promises = BREAKPOINTS.map(async (b) => {
        const formData = new FormData();
        formData.append('breakpointId', b.id);
        
        // Define representative symptoms for each growth phase
        let leafVal = 'Green';
        let stemVal = 'Normal';
        let pestVal = 'None';
        
        if (b.id === 'veg_mid') {
          leafVal = 'Pale Yellow';
          stemVal = 'Stunted';
        } else if (b.id === 'grain_fill') {
          leafVal = 'Brown spots';
          pestVal = 'Webbing/Holes';
        }
        
        const answers = {
          leafAppearance: leafVal,
          stemGrowth: stemVal,
          pestsObserved: pestVal
        };
        
        formData.append('answers', JSON.stringify(answers));
        formData.append('sessionContext', JSON.stringify(stageOutputs));
        
        const response = await fetch('/api/stage6/checkup', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) throw new Error(`Failed to scout phase ${b.label}`);
        const data = await response.json();
        
        return {
          breakpointId: b.id,
          breakpointLabel: b.label,
          answers,
          diagnosis: data.diagnosis,
          organicFix: data.organicFix,
          alertLevel: data.alertLevel
        };
      });

      const results = await Promise.all(promises);
      
      // Sequentially add checkup logs to store
      results.forEach(log => {
        addCheckupLog(log);
      });
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => {
    // Stage 6 is complete when at least one tilling/growth check is logged
    if (checkupLog.length === 0) {
      alert("Please execute and log at least one growth checkup before proceeding.");
      return;
    }
    // Proceed to Stage 8 (Harvest)
    syncToNextStage('stage6', {}, 8);
  };

  const getAlertSeverity = (level) => {
    if (level === 'Red') return 'danger';
    if (level === 'Yellow') return 'warning';
    return 'success';
  };

  const getAlertColors = (level) => {
    if (level === 'Red') return 'bg-alert-red text-white border-alert-red';
    if (level === 'Yellow') return 'bg-alert-amber text-white border-alert-amber';
    return 'bg-alert-green text-white border-alert-green';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <StageHeader
        number={6}
        title="Crop Growth &amp; Breakpoint Monitoring"
        description="Scout your farm boundary throughout the growth phases. Select the growth breakpoint from the dropdown to run organic advisor checkups. Gemini will evaluate physiological health trends and recommend certified remediation."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Diagnostic Form (Left) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 rounded-2xl border border-slate-100 space-y-6">
            <h3 className="font-extrabold text-base text-slate-800 tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-organic-green" />
              Growth Phase Log Sheet
            </h3>

            {/* Breakpoint Selector */}
            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-400 mb-1.5 uppercase">Crop Growth Breakpoint</label>
              <select
                value={breakpointId}
                onChange={(e) => setBreakpointId(e.target.value)}
                className="organic-input text-xs"
              >
                {BREAKPOINTS.map((b) => (
                  <option key={b.id} value={b.id}>{b.label}</option>
                ))}
              </select>
            </div>

            {/* Parameters Notice */}
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-organic-green shrink-0 mt-0.5" />
              <div className="text-xs font-semibold text-slate-600 leading-normal">
                <span className="font-black text-slate-700 block mb-0.5">Automated Bio-metric Inspection</span>
                By recording this growth point, AgroPilot will automatically execute a diagnostic audit using baseline plant parameters (healthy green foliage, expected tillering rate, zero pest presence) tailored dynamically to the target phase of your organic <span className="text-organic-green font-bold">{selectedCrop}</span>.
              </div>
            </div>

            {error && (
              <div className="p-3.5 bg-alert-red/10 border border-alert-red/20 text-alert-red text-xs rounded-xl flex items-start gap-2 animate-fade-in">
                <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={executeCheckup}
              disabled={loading}
              className="btn-organic-primary w-full text-xs font-bold py-3.5"
            >
              {loading ? "Running AI Diagnosis..." : "Submit Breakpoint Audit"}
            </button>
          </div>

          {/* AI Result Card */}
          {activeCheckupResult && (
            <AICard 
              title={`Audit Diagnosis: ${BREAKPOINTS.find(b => b.id === breakpointId)?.label}`} 
              severity={getAlertSeverity(activeCheckupResult.alertLevel)}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <span className="text-[10px] font-bold uppercase text-slate-400">Biological Alert Status</span>
                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${getAlertColors(activeCheckupResult.alertLevel)}`}>
                  {activeCheckupResult.alertLevel} Status
                </span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Crop Health Assessment</span>
                  <p className="font-extrabold text-slate-800 text-sm leading-snug">{activeCheckupResult.diagnosis}</p>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">NPOP Certified Remediation</span>
                  <p className="text-slate-600 font-medium leading-relaxed">{activeCheckupResult.organicFix}</p>
                </div>
              </div>
            </AICard>
          )}
        </div>

        {/* Chronological Logs Timeline (Right) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 rounded-2xl border border-slate-100 space-y-5">
            <h3 className="font-extrabold text-base text-slate-800 tracking-tight flex items-center gap-2 border-b border-slate-50 pb-3">
              <History className="w-5 h-5 text-organic-brown" />
              Chronological Audit Log
            </h3>

            {checkupLog.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p>No growth checkpoints logged yet.</p>
                <p className="text-[10px] text-slate-400 font-normal mt-0.5">Submit the form to log first entry.</p>
              </div>
            ) : (
              <div className="relative border-l border-slate-100 pl-4 space-y-5 py-2 max-h-[500px] overflow-y-auto pr-1">
                {checkupLog.map((log, idx) => (
                  <div key={idx} className="relative text-xs leading-normal">
                    
                    {/* Circle Node */}
                    <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white ${
                      log.alertLevel === 'Red' ? 'bg-alert-red' : log.alertLevel === 'Yellow' ? 'bg-alert-amber' : 'bg-organic-green'
                    }`} />
                    
                    <div className="bg-slate-50/50 hover:bg-slate-50 p-3 rounded-xl border border-slate-100/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-slate-700 block truncate max-w-[120px]">{log.breakpointLabel}</span>
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase shrink-0 ${getAlertColors(log.alertLevel)}`}>
                          {log.alertLevel}
                        </span>
                      </div>
                      
                      <div className="text-[10px] space-y-1">
                        <p><span className="text-slate-400 font-bold uppercase text-[8px]">Diagnosis:</span> <span className="font-medium text-slate-600 line-clamp-2">{log.diagnosis}</span></p>
                        <p><span className="text-slate-400 font-bold uppercase text-[8px]">Action:</span> <span className="font-medium text-slate-600 line-clamp-2">{log.organicFix}</span></p>
                      </div>
                      
                      <span className="text-[8px] text-slate-400 font-bold block pt-1 border-t border-slate-100">
                        {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Sync Proceed triggers */}
      <div className="flex flex-col sm:flex-row justify-between items-center border-t border-slate-100/60 pt-6 mt-6 gap-4">
        <button
          onClick={executeBulkScout}
          disabled={loading}
          className="btn-organic-secondary py-3 px-6 text-xs font-bold w-full sm:w-auto hover:bg-slate-50 transition-all border border-slate-200 text-slate-700 flex items-center justify-center gap-1.5 shadow-sm"
        >
          ⚡ Auto-Scout All 5 Phases (AI Bulk)
        </button>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={() => downloadMarkdownReport(stageOutputs, sessionId)}
            className="btn-organic-secondary py-3 px-6 text-xs font-bold w-full sm:w-auto hover:bg-slate-50 transition-all border border-slate-200 text-slate-700 flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Download Draft Report (.MD)
          </button>

          <button
            onClick={() => syncToNextStage('stage6', {}, 8)}
            disabled={loading}
            className="py-3 px-6 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all w-full sm:w-auto"
          >
            Skip Scouting &amp; Proceed
          </button>
          
          <SyncButton
            onClick={handleProceed}
            disabled={checkupLog.length === 0}
            loading={loading}
            label="Sync &amp; Proceed to Stage 8 (Harvest Readiness)"
          />
        </div>
      </div>

    </div>
  );
}
