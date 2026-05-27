import React, { useState, useEffect } from 'react';
import { useStageStore } from '../store/stageStore';
import StageHeader from '../components/common/StageHeader';
import AICard from '../components/common/AICard';
import SyncButton from '../components/common/SyncButton';
import { 
  Camera, 
  Trash2, 
  Scissors, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  HeartHandshake, 
  Compass,
  AlertCircle,
  Download
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { downloadMarkdownReport } from '../utils/reportGenerator';

export default function Stage8Page() {
  const { sessionId, stageOutputs, saveStageOutput, syncToNextStage, loading, setLoading, setError, error } = useStageStore();

  const [das, setDas] = useState('110');
  const [intendedUse, setIntendedUse] = useState('Commercial');
  
  // Photo states
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);

  const [harvestResult, setHarvestResult] = useState(null);

  const selectedCrop = stageOutputs.stage1?.selectedCrop || 'Paddy';
  const totalArea = stageOutputs.stage2?.totalArea || 1.0;

  // Dynamically set default DAS based on crop selection if no stored output exists
  useEffect(() => {
    if (!stageOutputs.stage8) {
      const crop = selectedCrop.toLowerCase();
      if (crop.includes('paddy') || crop.includes('rice')) setDas('120');
      else if (crop.includes('groundnut')) setDas('105');
      else if (crop.includes('maize') || crop.includes('corn')) setDas('90');
      else if (crop.includes('cotton')) setDas('150');
      else if (crop.includes('tomato')) setDas('85');
      else if (crop.includes('turmeric')) setDas('220');
      else if (crop.includes('sugarcane')) setDas('320');
      else if (crop.includes('mango')) setDas('120');
      else if (crop.includes('gram')) setDas('75');
      else if (crop.includes('chilli') || crop.includes('chillies')) setDas('150');
      else setDas('110');
    }
  }, [selectedCrop, stageOutputs.stage8]);

  // Sync stored stage8 details
  useEffect(() => {
    const existing = stageOutputs.stage8;
    if (existing) {
      setDas(existing.das || '110');
      setIntendedUse(existing.intendedUse || 'Commercial');
      setHarvestResult({
        readiness: existing.readiness,
        rationale: existing.rationale,
        checklist: existing.checklist,
        preHarvestSpray: existing.preHarvestSpray,
        yieldEstimate: existing.yieldEstimate,
        products: existing.products
      });
    }
  }, [stageOutputs.stage8]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    multiple: false,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  });

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoBase64(null);
  };

  const evaluateHarvest = async () => {
    setLoading(true);
    setError(null);
    setHarvestResult(null);

    const formData = new FormData();
    formData.append('das', das);
    formData.append('intendedUse', intendedUse);
    formData.append('sessionContext', JSON.stringify(stageOutputs));
    
    if (photoFile) {
      formData.append('photo', photoFile);
    }

    try {
      const response = await fetch('/api/stage8/harvest', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error("Failed to evaluate harvest readiness parameters.");
      }

      const data = await response.json();
      setHarvestResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => {
    if (!harvestResult) return;

    const stage8Data = {
      das,
      intendedUse,
      ...harvestResult
    };

    // Save and sync to Stage 9 (Storage)
    syncToNextStage('stage8', stage8Data, 9);
  };

  const getReadinessColor = (status) => {
    if (status === 'Ready') return 'bg-alert-green text-white border-alert-green';
    if (status === 'Almost Ready') return 'bg-alert-amber text-white border-alert-amber';
    return 'bg-alert-red text-white border-alert-red';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <StageHeader
        number={8}
        title="Harvest Readiness &amp; Yield Audit"
        description="Verify maturity characteristics before mechanical harvest. Our vision models verify husk colorations and panicle moisture thresholds, estimating net crop yields and enforcing Pre-Harvest Interval (PHI) safety delays."
      />

      {/* Input controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* Form panel */}
        <div className="md:col-span-1 space-y-5 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-extrabold text-base text-slate-800 tracking-tight flex items-center gap-2">
            <Scissors className="w-5 h-5 text-organic-green" />
            Maturity Audit Input
          </h3>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-400 mb-1.5 uppercase">Days After Sowing (DAS)</label>
            <input
              type="number"
              placeholder="e.g. 110"
              value={das}
              onChange={(e) => setDas(e.target.value)}
              className="organic-input text-xs font-mono font-bold"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-400 mb-1.5 uppercase">Intended Selling Channel</label>
            <select
              value={intendedUse}
              onChange={(e) => setIntendedUse(e.target.value)}
              className="organic-input text-xs"
            >
              <option value="Commercial">Commercial APMC Mandi</option>
              <option value="Processing">Processing Mill (Grain Dehusking)</option>
              <option value="Seed">High-Spec Seed Saving Selection</option>
              <option value="Export">Direct-to-Consumer / Organic Export</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-400 mb-1.5 uppercase">Maturity Photo Upload (Optional - Gemini Vision)</label>
            {!photoPreview ? (
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors duration-200 ${
                  isDragActive ? 'border-organic-green bg-organic-lightGreen/10' : 'border-slate-200 hover:border-organic-green bg-slate-50/50'
                }`}
              >
                <input {...getInputProps()} />
                <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">Drag &amp; drop crop photo</p>
                <p className="text-[10px] text-slate-400 mt-1">Verify golden husks &amp; panicles</p>
              </div>
            ) : (
              <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-900 h-40 flex items-center justify-center">
                <img src={photoPreview} alt="Maturity preview" className="h-full object-contain" />
                <button
                  onClick={removePhoto}
                  className="absolute top-2.5 right-2.5 bg-alert-red hover:bg-red-700 text-white p-2 rounded-lg text-xs font-bold flex items-center gap-1 shadow-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-alert-red/10 border border-alert-red/20 text-alert-red text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 font-bold" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={evaluateHarvest}
            disabled={loading || !das}
            className="btn-organic-primary w-full text-xs font-bold py-3.5"
          >
            {loading ? "Analyzing Maturity..." : "Evaluate Harvest Readiness"}
          </button>
        </div>

        {/* Diagnostic assessment (Right) */}
        <div className="md:col-span-2">
          {harvestResult ? (
            <div className="space-y-6 animate-fade-in">
              <AICard title="Harvest Readiness Diagnostic Report" severity={getReadinessColor(harvestResult.readiness) === 'bg-alert-green text-white border-alert-green' ? 'success' : 'warning'}>
                
                {/* Readiness Banner */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400">Crop Readiness Status</span>
                    <h4 className="font-extrabold text-slate-800 text-base leading-snug mt-0.5">Maturity window reached</h4>
                  </div>
                  
                  <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-xl border tracking-wide shrink-0 ${getReadinessColor(harvestResult.readiness)}`}>
                    {harvestResult.readiness}
                  </span>
                </div>

                {/* Rationale text */}
                <p className="text-xs text-slate-600 font-medium bg-slate-50 p-4 rounded-xl border border-slate-100/60 leading-relaxed">
                  {harvestResult.rationale}
                </p>

                {/* Yield Estimate & Gap Analysis */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  
                  <div className="p-4 rounded-xl border border-slate-100 bg-organic-cream/10 space-y-2">
                    <span className="text-[9px] uppercase font-bold text-slate-400 mb-0.5 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-organic-green" />
                      Organic Yield Estimate
                    </span>
                    <p className="font-black text-slate-800 text-lg leading-tight">
                      {harvestResult.yieldEstimate.expectedYield}
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">Sized for {totalArea} Acres</p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-2">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Regional Conventional Avg</span>
                    <p className="font-extrabold text-slate-500 text-base leading-tight">
                      {harvestResult.yieldEstimate.typicalYield}
                    </p>
                    <p className="text-[10px] text-organic-green font-bold mt-1">PGS-India Premium Sowing</p>
                  </div>

                  <div className="col-span-2 p-3.5 bg-organic-green/5 border border-organic-green/10 rounded-xl text-xs">
                    <span className="text-[9px] uppercase font-bold text-organic-green block mb-0.5">Pathology / Yield Gap Analysis</span>
                    <p className="text-slate-600 font-medium leading-relaxed mt-0.5">
                      {harvestResult.yieldEstimate.gapAnalysis}
                    </p>
                  </div>
                </div>

                {/* Checklist criteria */}
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <h4 className="font-extrabold text-xs text-slate-800 mb-3 uppercase tracking-wide">
                    Physiological Maturity Criteria Check
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {harvestResult.checklist.map((item, idx) => {
                      const isPass = item.status === 'Pass';
                      return (
                        <div key={idx} className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-between text-xs font-medium">
                          <div className="space-y-0.5">
                            <span className="text-slate-700 font-bold block">{item.criterion}</span>
                            <span className="text-[10px] text-slate-400 font-normal leading-tight">{item.value}</span>
                          </div>
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md border shrink-0 ${
                            isPass ? 'bg-organic-lightGreen text-organic-green border-organic-green/20' : 'bg-alert-amber/10 text-alert-amber border-alert-amber/20'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Pre-Harvest Interval Alert */}
                {harvestResult.preHarvestSpray && (
                  <div className="mt-6 p-4 rounded-xl border border-alert-amber/20 bg-alert-amber/5 flex items-center gap-3.5 text-xs text-slate-700">
                    <HeartHandshake className="w-6 h-6 text-alert-amber shrink-0" />
                    <div>
                      <span className="font-black text-slate-800 uppercase text-[9px] tracking-wide block mb-0.5">NPOP Compliance Pre-Harvest Interval (PHI)</span>
                      Final required spray: <span className="font-extrabold text-organic-brown">{harvestResult.preHarvestSpray.product}</span>. 
                      Enforce <span className="font-black text-alert-amber">{harvestResult.preHarvestSpray.phi} Days safety delay</span> before direct grain harvesting.
                    </div>
                  </div>
                )}

                {/* Equipment products cards */}
                <div className="space-y-4 mt-6 border-t border-slate-100 pt-5">
                  <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wide">
                    Approved Harvesting &amp; Threshing Machinery
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {harvestResult.products.map((p, idx) => (
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
            </div>
          ) : (
            <div className="glass-card p-12 rounded-2xl border border-slate-100 text-center space-y-4 h-full flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-organic-lightGreen/5 text-organic-green flex items-center justify-center animate-pulse">
                <Scissors className="w-8 h-8" />
              </div>
              <div className="max-w-md">
                <h4 className="font-extrabold text-slate-800 text-base">Awaiting Harvest Parameters</h4>
                <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                  Enter crop Days After Sowing (DAS) and upload a picture of the grain heads. Our models will evaluate physical maturity indexes against crop standards.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Sync proceed triggers */}
      {harvestResult && (
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
            label="Sync &amp; Proceed to Stage 9 (Organic Storage)"
          />
        </div>
      )}

    </div>
  );
}
