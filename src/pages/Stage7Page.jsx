import React, { useState, useEffect } from 'react';
import { useStageStore } from '../store/stageStore';
import AICard from '../components/common/AICard';
import StageHeader from '../components/common/StageHeader';
import { 
  Camera, 
  Bug, 
  Trash2, 
  ListCollapse, 
  ShieldAlert, 
  Table, 
  Wrench,
  AlertCircle,
  Download
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { downloadMarkdownReport } from '../utils/reportGenerator';

export default function Stage7Page({ isModalView = false, onCloseModal }) {
  const { sessionId, stageOutputs, saveStageOutput, loading, setLoading, setError, error } = useStageStore();

  const [symptomText, setSymptomText] = useState('');
  
  // Photo states
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);

  const [diagnosticResult, setDiagnosticResult] = useState(null);

  // Restore existing independent Stage 7 diagnostic outputs if available
  useEffect(() => {
    const existing = stageOutputs.stage7;
    if (existing) {
      setSymptomText(existing.symptomText || '');
      setDiagnosticResult({
        pest: existing.pest,
        confidence: existing.confidence,
        affectedPart: existing.affectedPart,
        spreadRisk: existing.spreadRisk,
        diagnosis: existing.diagnosis,
        treatments: existing.treatments,
        schedule: existing.schedule,
        products: existing.products
      });
    }
  }, [stageOutputs.stage7]);

  // Dropzone for upload
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

  const runDiagnosis = async () => {
    setLoading(true);
    setError(null);
    setDiagnosticResult(null);

    const formData = new FormData();
    formData.append('symptomText', symptomText);
    formData.append('sessionContext', JSON.stringify(stageOutputs));
    
    if (photoFile) {
      formData.append('photo', photoFile);
    }

    try {
      const response = await fetch('/api/stage7/diagnose', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error("Failed to process disease diagnostic vision audit.");
      }

      const data = await response.json();
      setDiagnosticResult(data);

      // Save output to global independent Stage 7 key
      saveStageOutput('stage7', {
        symptomText,
        ...data
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSpreadRiskColor = (risk) => {
    if (risk === 'High') return 'bg-alert-red text-white border-alert-red';
    if (risk === 'Medium') return 'bg-alert-amber text-white border-alert-amber';
    return 'bg-alert-green text-white border-alert-green';
  };

  return (
    <div className={`space-y-8 animate-fade-in ${isModalView ? 'p-1' : ''}`}>
      
      {/* Header (Only show if not in Slide-out modal view) */}
      {!isModalView && (
        <StageHeader
          number={7}
          title="On-Demand Pest &amp; Disease Diagnosis"
          description="Independent crop emergency doctor. If you spot lesions, whitefly, or leaf curling on your farm plot, upload a photo or type symptoms below for instant, NPOP-compliant botanical sprays and foliar schedules."
        />
      )}

      {/* Main Diagnostic Sheet */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Forms (Left) */}
        <div className="md:col-span-1 space-y-5 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-extrabold text-base text-slate-800 tracking-tight flex items-center gap-2">
            <Bug className="w-5 h-5 text-alert-red" />
            Pathology Diagnosis Sheet
          </h3>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-400 mb-1.5 uppercase">Describe Plant Symptoms</label>
            <textarea
              placeholder="e.g. Leaf spot circles with brown nodes, leaf edges turning rusty yellow, white cobwebbing under the leaf..."
              rows="4"
              value={symptomText}
              onChange={(e) => setSymptomText(e.target.value)}
              className="organic-input text-xs leading-normal resize-none"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-400 mb-1.5 uppercase">Upload Leaf/Stem Photo (Required for Vision)</label>
            {!photoPreview ? (
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors duration-200 ${
                  isDragActive ? 'border-alert-red bg-alert-red/5' : 'border-slate-200 hover:border-alert-red bg-slate-50/50'
                }`}
              >
                <input {...getInputProps()} />
                <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2 animate-bounce" />
                <p className="text-xs font-bold text-slate-600">Drag &amp; drop leaf picture here</p>
                <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, WEBP (Max 10MB)</p>
              </div>
            ) : (
              <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-900 h-40 flex items-center justify-center">
                <img src={photoPreview} alt="Pathology preview" className="h-full object-contain" />
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
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={runDiagnosis}
            disabled={loading || (!symptomText && !photoFile)}
            className="btn-organic-primary w-full text-xs font-bold py-3.5 bg-alert-red hover:bg-red-700 hover:shadow-alert-red/20 shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Bug className="w-4 h-4" />
            {loading ? "Diagnosing Infection..." : "Run Organic Diagnosis"}
          </button>
        </div>

        {/* Diagnosis Results (Right) */}
        <div className="md:col-span-2">
          {diagnosticResult ? (
            <div className="space-y-6 animate-fade-in">
              <AICard title="Diagnostic Assessment &amp; Remedies" severity="danger">
                
                {/* Patholoy metrics */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400">Pathology Diagnosed</span>
                    <h4 className="font-black text-slate-800 text-base leading-tight mt-0.5">{diagnosticResult.pest}</h4>
                  </div>
                  
                  <div className="flex gap-4 shrink-0">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">AI Confidence</span>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="bg-alert-red h-full" style={{ width: `${diagnosticResult.confidence}%` }} />
                        </div>
                        <span className="font-extrabold text-xs text-slate-700">{diagnosticResult.confidence}%</span>
                      </div>
                    </div>
                    
                    <div className="border-l border-slate-100 h-8" />
                    
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Spread Hazard</span>
                      <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border ${getSpreadRiskColor(diagnosticResult.spreadRisk)}`}>
                        {diagnosticResult.spreadRisk}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Narrative */}
                <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50 p-4 rounded-xl border border-slate-100 mt-4">
                  {diagnosticResult.diagnosis}
                </p>

                {/* Three Ranked Treatments */}
                <div className="space-y-4 mt-6">
                  <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2 uppercase">
                    <ListCollapse className="w-4.5 h-4.5 text-alert-red" />
                    Ranked Bio-Remedies &amp; Preparation Formulas
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {diagnosticResult.treatments.map((t, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-organic-cream/10 flex flex-col justify-between hover-glow text-xs leading-normal">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-extrabold text-organic-brown uppercase bg-organic-cream px-1.5 py-0.5 rounded">
                              {t.type}
                            </span>
                          </div>
                          
                          <h5 className="font-black text-slate-800 text-xs leading-tight">{t.name}</h5>
                          <p className="font-semibold text-organic-green uppercase text-[9px] font-mono">Dose: {t.dose}</p>
                          <p className="text-slate-500 font-medium text-[10px] line-clamp-4 hover:line-clamp-none transition-all">{t.preparation}</p>
                        </div>
                        
                        <div className="border-t border-slate-100 pt-2.5 mt-3 flex items-center justify-between text-[10px]">
                          <span className="font-bold text-slate-400 uppercase">Cost/Acre</span>
                          <span className="font-black text-slate-800">{t.costEstimate}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 14-day spray schedule */}
                <div className="space-y-4 mt-6">
                  <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2 uppercase">
                    <Table className="w-4.5 h-4.5 text-alert-red" />
                    14-Day Chronological Spray Schedule
                  </h4>

                  <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500 uppercase text-[9px] tracking-wide">
                          <th className="px-4 py-2.5">Timeline</th>
                          <th className="px-4 py-2.5">Organic Spray</th>
                          <th className="px-4 py-2.5">Foliar Dose</th>
                          <th className="px-4 py-2.5">Spraying Method</th>
                          <th className="px-4 py-2.5 text-right">Interval</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-medium text-slate-600">
                        {diagnosticResult.schedule.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-extrabold text-slate-800">{item.day}</td>
                            <td className="px-4 py-3 font-bold text-organic-brown">{item.treatment}</td>
                            <td className="px-4 py-3 font-mono font-bold text-organic-green">{item.dose}</td>
                            <td className="px-4 py-3 text-slate-400 font-semibold">{item.method}</td>
                            <td className="px-4 py-3 text-right font-bold text-slate-700">{item.interval}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Spraying Equipment Product Cards */}
                <div className="space-y-4 mt-6">
                  <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2 uppercase">
                    <Wrench className="w-4.5 h-4.5 text-alert-red" />
                    Approved Spraying Technology
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {diagnosticResult.products.map((p, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm flex flex-col justify-between hover-glow">
                        <div>
                          <h5 className="font-extrabold text-slate-800 text-xs leading-snug">{p.name}</h5>
                          <p className="text-[9px] text-slate-400 font-medium mt-0.5 leading-snug">{p.spec}</p>
                          <p className="text-[10px] text-organic-brown font-semibold mt-1">Source: {p.source}</p>
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
              <div className="w-16 h-16 rounded-full bg-alert-red/5 text-alert-red flex items-center justify-center animate-pulse">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div className="max-w-md">
                <h4 className="font-extrabold text-slate-800 text-base">Awaiting Diagnostic Inputs</h4>
                <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                  Key in observed symptoms or upload a clear photo of leaf lesions on the left panel. Our computer-vision models will diagnose the exact pathogen and formulate biological remediations.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
      
      {/* Action triggers */}
      {!isModalView && (
        <div className="flex justify-start border-t border-slate-100/60 pt-6 mt-6">
          <button
            onClick={() => downloadMarkdownReport(stageOutputs, sessionId)}
            className="btn-organic-secondary py-3 px-6 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-200 text-slate-700 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Download Draft Report (.MD)
          </button>
        </div>
      )}

    </div>
  );
}
