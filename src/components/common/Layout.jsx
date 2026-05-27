import React, { useState, useEffect } from 'react';
import { useStageStore } from '../../store/stageStore';
import { 
  Sprout, 
  Ruler, 
  Calendar, 
  Droplet, 
  Bean, 
  TrendingUp, 
  Bug, 
  Scissors, 
  Warehouse, 
  Store, 
  RefreshCw, 
  Copy, 
  Check, 
  Lock, 
  AlertCircle,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Settings,
  Key
} from 'lucide-react';
import Stage7Page from '../../pages/Stage7Page';

const STAGE_METADATA = [
  { id: 1, title: 'Land Details', icon: Sprout, key: 'stage1' },
  { id: 2, title: 'Land Measurement', icon: Ruler, key: 'stage2' },
  { id: 3, title: 'Farming Plan', icon: Calendar, key: 'stage3' },
  { id: 4, title: 'Irrigation Setup', icon: Droplet, key: 'stage4' },
  { id: 5, title: 'Seeding', icon: Bean, key: 'stage5' },
  { id: 6, title: 'Growth Monitoring', icon: TrendingUp, key: 'stage6' },
  { id: 7, title: 'Disease Diagnosis', icon: Bug, key: 'stage7' },
  { id: 8, title: 'Harvest', icon: Scissors, key: 'stage8' },
  { id: 9, title: 'Storage', icon: Warehouse, key: 'stage9' },
  { id: 10, title: 'Market & Selling', icon: Store, key: 'stage10' },
];

export default function Layout({ children }) {
  const { 
    sessionId, 
    currentStage, 
    maxReachedStage, 
    setCurrentStage, 
    resetSession,
    stageOutputs,
    loading,
    tokenBalance,
    error,
    grantTokens,
    setSimulationMode,
    customApiKey,
    saveCustomApiKey,
    removeCustomApiKey
  } = useStageStore();

  const getLoadingMessage = (stageNum) => {
    switch(stageNum) {
      case 1: return "Analyzing organic regional soils and crop adaptability...";
      case 2: return "Calculating high-accuracy acreage layout and bounds...";
      case 3: return "Optimizing row spacing and certified seed sourcing...";
      case 4: return "Formulating energy-smart micro-irrigation pipeline plans...";
      case 5: return "Structuring biological seed protection schedules...";
      case 6: return "Auditing crop growth phases and biological health...";
      case 7: return "Diagnosing plant pathogens and botanical remediations...";
      case 8: return "Evaluating maturity features and expected yield potentials...";
      case 9: return "Sizing safe storage ventilation margins and preservation...";
      case 10: return "Hydrating Mandi rates and PGS organic certificates...";
      default: return "Navigating your organic agricultural setup...";
    }
  };

  const [copied, setCopied] = useState(false);
  const [showEmergencyDiag, setShowEmergencyDiag] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // BYOK Settings States & Handlers
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsKeyInput, setSettingsKeyInput] = useState(customApiKey || '');
  const [keyChecking, setKeyChecking] = useState(false);
  const [keyCheckError, setKeyCheckError] = useState(null);
  const [keyCheckSuccess, setKeyCheckSuccess] = useState(false);

  useEffect(() => {
    setSettingsKeyInput(customApiKey || '');
  }, [customApiKey]);

  const handleCheckKey = async () => {
    if (!settingsKeyInput || settingsKeyInput.trim() === '') {
      setKeyCheckError("Please paste a valid Gemini API Key first.");
      return;
    }

    setKeyChecking(true);
    setKeyCheckError(null);
    setKeyCheckSuccess(false);

    try {
      const res = await fetch('/api/check-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: settingsKeyInput })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setKeyCheckSuccess(true);
      } else {
        throw new Error(data.error || "Key validation failed.");
      }
    } catch (err) {
      setKeyCheckError(err.message);
    } finally {
      setKeyChecking(false);
    }
  };

  const handleSaveKeySetup = () => {
    if (!keyCheckSuccess) {
      alert("Please successfully check and validate your key before saving.");
      return;
    }
    saveCustomApiKey(settingsKeyInput);
    setShowSettingsModal(false);
    alert("Gemini Custom API Key successfully connected! BYOK Unlimited seasonal capacity unlocked.");
  };

  const handleDisconnectKey = () => {
    removeCustomApiKey();
    setSettingsKeyInput('');
    setKeyCheckSuccess(false);
    setKeyCheckError(null);
    setShowSettingsModal(false);
    alert("Custom API Key disconnected. Returned to standard organic trial tier.");
  };

  const selectedCrop = stageOutputs.stage1?.selectedCrop;
  const soilType = stageOutputs.stage1?.soilType;

  const copySessionId = () => {
    navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStageStatus = (stage) => {
    // Stage 7 can be diagnostic or general
    if (stage.id === 7) {
      return stageOutputs.stage7 ? 'Synced' : 'Independent';
    }
    
    const output = stageOutputs[stage.key];
    if (output) {
      return 'Synced';
    }
    
    // If it's the active stage
    if (currentStage === stage.id) {
      return 'In Progress';
    }
    
    return 'Not Started';
  };

  const handleStageClick = (stageId) => {
    // Stage 7 is always accessible
    if (stageId === 7) {
      setCurrentStage(stageId);
      return;
    }
    
    if (stageId <= maxReachedStage + 1) {
      setCurrentStage(stageId);
    }
  };

  return (
    <div className="flex h-full min-h-screen bg-organic-cream/40 overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-80'} bg-white border-r border-slate-100 shrink-0 hidden md:flex md:flex-col md:justify-between transition-all duration-300 ease-in-out`}>
        
        {/* Sidebar Header */}
        <div className={`border-b border-slate-50 flex items-center justify-between gap-2.5 transition-all duration-300 ${isSidebarCollapsed ? 'flex-col p-4' : 'p-6'}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-organic-green flex items-center justify-center text-white shadow-md shadow-organic-green/20 shrink-0">
              <svg viewBox="0 0 100 100" className="w-6 h-6 stroke-white fill-white">
                <path d="M 50 18 C 65 32, 70 50, 70 64 C 70 78, 58 82, 50 82 C 42 82, 30 78, 30 64 C 30 50, 35 32, 50 18 Z" />
              </svg>
            </div>
            {!isSidebarCollapsed && (
              <div className="animate-fade-in">
                <h1 className="font-extrabold text-xl tracking-tight text-slate-800 flex items-center gap-1.5 whitespace-nowrap">
                  Agro<span className="text-organic-green">Pilot</span>
                </h1>
                <p className="text-[10px] uppercase font-bold tracking-widest text-organic-brown/80 whitespace-nowrap">Organic Advisor</p>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 rounded-lg border border-slate-100 hover:border-slate-200 text-slate-400 hover:text-organic-green hover:bg-slate-50 transition-colors flex items-center justify-center shrink-0"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Sidebar Roadmap (Stages) */}
        <nav className={`flex-1 overflow-y-auto py-6 space-y-1.5 ${isSidebarCollapsed ? 'px-2' : 'px-4'}`}>
          {STAGE_METADATA.map((stage) => {
            const status = getStageStatus(stage);
            const isActive = currentStage === stage.id;
            const isAccessible = stage.id === 7 || stage.id <= maxReachedStage + 1;
            
            return (
              <button
                key={stage.id}
                onClick={() => isAccessible && handleStageClick(stage.id)}
                disabled={!isAccessible}
                className={`w-full flex items-center rounded-xl transition-all duration-200 text-left border relative ${
                  isSidebarCollapsed ? 'justify-center p-2.5' : 'gap-3.5 px-4 py-3'
                } ${
                  isActive 
                    ? 'bg-organic-green text-white border-organic-green shadow-lg shadow-organic-green/15 scale-[1.02]' 
                    : isAccessible 
                      ? 'bg-white hover:bg-organic-cream/50 text-slate-700 border-slate-100 hover:border-slate-200' 
                      : 'bg-slate-50/50 text-slate-400 border-slate-50 cursor-not-allowed'
                }`}
                title={isSidebarCollapsed ? `Stage ${stage.id}: ${stage.title} (${status})` : ''}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-r" />
                )}

                {/* Icon Wrapper */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isActive 
                    ? 'bg-white/20 text-white' 
                    : isAccessible 
                      ? 'bg-organic-lightGreen/50 text-organic-green' 
                      : 'bg-slate-200/50 text-slate-400'
                }`}>
                  {isAccessible ? <stage.icon className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
                </div>

                {/* Stage Info */}
                {!isSidebarCollapsed && (
                  <div className="flex-1 min-w-0 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-organic-lightGreen' : 'text-organic-brown'}`}>
                        Stage {stage.id}
                      </span>
                      
                      {/* Status Pill */}
                      {status === 'Synced' && (
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-organic-lightGreen text-organic-green'}`}>
                          Synced
                        </span>
                      )}
                      {status === 'In Progress' && (
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white animate-pulse' : 'bg-alert-amber/10 text-alert-amber border border-alert-amber/20'}`}>
                          Active
                        </span>
                      )}
                      {status === 'Independent' && (
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500`}>
                          On-Demand
                        </span>
                      )}
                    </div>
                    
                    <p className="font-semibold text-sm truncate leading-snug mt-0.5">
                      {stage.title}
                    </p>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className={`border-t border-slate-50 bg-slate-50/50 transition-all duration-300 ${isSidebarCollapsed ? 'p-2 flex justify-center' : 'p-4 space-y-3'}`}>
          {isSidebarCollapsed ? (
            <div className="w-8 h-8 rounded-full bg-organic-lightGreen/30 flex items-center justify-center text-organic-green" title="NPOP & PGS-India Organic Compliant">
              <Check className="w-4 h-4 font-black" />
            </div>
          ) : (
            <div className="space-y-4 w-full">
              {/* Token Capacity Bar inside sidebar */}
              {customApiKey ? (
                <div className="space-y-2 animate-fade-in border-b border-slate-100 pb-3">
                  <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    <span>⚡ BYOK Sizing</span>
                    <span className="text-purple-600 font-black flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
                      ∞ Unlimited
                    </span>
                  </div>
                  <div className="w-full h-2 bg-purple-100/30 rounded-full overflow-hidden border border-purple-200/40 relative">
                    <div className="h-full rounded-full bg-gradient-to-r from-purple-50 to-indigo-50 w-full animate-pulse" />
                  </div>
                </div>
              ) : (
                <div className="space-y-2 animate-fade-in border-b border-slate-100 pb-3">
                  <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    <span>⚡ Token Budget</span>
                    <span className={tokenBalance > 30000 ? 'text-organic-green' : tokenBalance > 10000 ? 'text-amber-500' : 'text-red-500 animate-pulse font-black'}>
                      {tokenBalance.toLocaleString()} / 100,000
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden relative border border-slate-200/50">
                    <div className={`h-full rounded-full transition-all duration-300 ${
                      tokenBalance > 30000 
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
                        : tokenBalance > 10000 
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 animate-pulse' 
                          : 'bg-gradient-to-r from-red-500 to-rose-500 animate-pulse'
                    }`} style={{ width: `${(tokenBalance / 100000) * 100}%` }} />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 animate-fade-in">
                <AlertCircle className="w-3.5 h-3.5 text-organic-brown shrink-0" />
                <p className="text-[10px] text-slate-500 leading-normal">
                  100% compliant with NPOP &amp; PGS-India organic regulations.
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* GLASS HEADER */}
        <header className="h-16 px-4 md:px-6 bg-white/80 border-b border-slate-100 backdrop-blur-md flex items-center justify-between shrink-0 sticky top-0 z-40">
          
          {/* Mobile Menu indicator & Hamburger */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl border border-slate-100 hover:border-slate-200 text-slate-600 hover:text-organic-green hover:bg-slate-50 transition-all flex items-center justify-center shrink-0"
              title="Open Stage Roadmap"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden xs:flex md:hidden w-8 h-8 rounded-lg bg-organic-green items-center justify-center text-white font-extrabold text-sm shrink-0">
              AP
            </div>
            
            {/* Organic crop focus summary chip */}
            {selectedCrop ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-organic-lightGreen text-organic-green rounded-full text-xs font-bold border border-organic-green/10 shadow-sm animate-fade-in truncate max-w-[150px] sm:max-w-xs">
                <span>🌾</span>
                <span className="font-extrabold truncate">{selectedCrop}</span>
                {soilType && (
                  <span className="hidden sm:inline-flex items-center gap-1.5">
                    <span className="text-organic-green/30">|</span>
                    <span className="font-normal text-[11px] text-slate-600 truncate">{soilType}</span>
                  </span>
                )}
              </div>
            ) : (
              <div className="text-slate-500 text-[10px] sm:text-xs font-medium italic truncate max-w-[130px] sm:max-w-none">
                Stage 1 setup pending plan sync
              </div>
            )}
          </div>

          {/* Session controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Token Capacity Bar (glowing, responsive capsule) */}
            {customApiKey ? (
              <div className="hidden sm:flex items-center bg-purple-50/50 border border-purple-100 rounded-xl px-3 py-1.5 text-xs text-purple-700 gap-2 font-mono shadow-inner animate-fade-in">
                <span className="text-purple-400 font-bold uppercase text-[9px] tracking-wide flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
                  ⚡ BYOK Active:
                </span>
                <span className="font-extrabold text-[10px] text-purple-700 flex items-center gap-1">
                  ∞ Unlimited
                </span>
                <span className="text-purple-300">|</span>
                <span className="text-[9px] text-purple-500 font-bold uppercase">Live key</span>
              </div>
            ) : (
              <div className="hidden sm:flex items-center bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 text-xs text-slate-600 gap-2 font-mono animate-fade-in">
                <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wide">⚡ Tokens:</span>
                <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden relative" title={`${tokenBalance.toLocaleString()} / 100,000`}>
                  <div className={`h-full rounded-full transition-all duration-300 ${
                    tokenBalance > 30000 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-sm shadow-emerald-500/10' 
                      : tokenBalance > 10000 
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
                        : 'bg-gradient-to-r from-red-500 to-rose-500 animate-pulse'
                  }`} style={{ width: `${(tokenBalance / 100000) * 100}%` }} />
                </div>
                <span className={`font-bold text-[10px] ${
                  tokenBalance > 30000 ? 'text-slate-700' : tokenBalance > 10000 ? 'text-amber-600 font-black' : 'text-red-600 font-black animate-pulse'
                }`}>
                  {Math.round((tokenBalance / 100000) * 100)}%
                </span>
              </div>
            )}

            {/* Session ID display chip (hidden on mobile, shown in drawer/sidebar) */}
            <div className="hidden sm:flex items-center bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 text-xs text-slate-600 gap-1.5">
              <span className="font-mono text-slate-400">ID:</span>
              <span className="font-mono font-semibold">{sessionId}</span>
              <button 
                onClick={copySessionId} 
                className="text-slate-400 hover:text-organic-green p-0.5 rounded hover:bg-slate-200 transition-colors"
                title="Copy Session ID"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-organic-green" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Reset Button */}
            <button 
              onClick={() => {
                if (window.confirm("Are you sure you want to reset the current AgroPilot session? This will clear all 10 stages.")) {
                  resetSession();
                }
              }}
              className="p-2 sm:px-3 sm:py-2 border border-slate-100 hover:border-alert-red/20 text-slate-400 hover:text-alert-red hover:bg-alert-red/5 rounded-xl transition-all duration-200 flex items-center gap-1.5 text-xs font-medium"
              title="Reset Session"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            {/* Settings Gear Button */}
            <button 
              onClick={() => setShowSettingsModal(true)}
              className={`p-2 sm:px-3 sm:py-2 border rounded-xl transition-all duration-200 flex items-center gap-1.5 text-xs font-medium ${
                customApiKey 
                  ? 'border-purple-200 text-purple-600 hover:bg-purple-50/50 hover:border-purple-300 bg-purple-50/20' 
                  : 'border-slate-100 text-slate-500 hover:text-organic-green hover:bg-slate-50'
              }`}
              title="Configure API Key (BYOK)"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>
        </header>

        {/* WORKSPACE AREA */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 relative">
          <div className="max-w-5xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>

      {/* FLOATING ACTION EMERGENCY CROP DOCTOR (STAGE 7) */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setShowEmergencyDiag(true)}
          className="w-14 h-14 rounded-full bg-alert-red hover:bg-red-700 text-white flex items-center justify-center shadow-lg shadow-alert-red/30 transition-transform duration-300 hover:scale-110 active:scale-95 group relative"
          title="Emergency Pest &amp; Disease Diagnosis"
        >
          <Bug className="w-6 h-6 animate-pulse" />
          <span className="absolute right-16 scale-0 group-hover:scale-100 transition-all duration-200 bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md whitespace-nowrap">
            🚨 Emergency Diagnostician (Stage 7)
          </span>
        </button>
      </div>

      {/* STAGE 7 Slide-over Modal Overlay */}
      {showEmergencyDiag && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setShowEmergencyDiag(false)}
          />
          
          {/* Drawer content */}
          <div className="relative w-full max-w-2xl bg-organic-cream h-full shadow-2xl flex flex-col animate-fade-in overflow-y-auto">
            {/* Drawer Header */}
            <div className="bg-alert-red text-white p-6 sticky top-0 z-10 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <Bug className="w-6 h-6" />
                <div>
                  <h2 className="text-lg font-bold">Stage 7 — Emergency Crop Doctor</h2>
                  <p className="text-xs text-red-100">On-demand biological pest &amp; disease diagnosis</p>
                </div>
              </div>
              <button 
                onClick={() => setShowEmergencyDiag(false)}
                className="bg-white/20 hover:bg-white/30 text-white rounded-lg px-3 py-1.5 text-xs font-bold transition-all"
              >
                Close Panel
              </button>
            </div>
            
            {/* Tool Area */}
            <div className="p-6 md:p-8 flex-1">
              <Stage7Page isModalView={true} onCloseModal={() => setShowEmergencyDiag(false)} />
            </div>
          </div>
        </div>
      )}

      {/* MOBILE DRAWER */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Drawer Panel */}
          <div className="relative w-80 max-w-full bg-white h-full shadow-2xl flex flex-col justify-between z-10 animate-slide-in">
            
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-organic-green flex items-center justify-center text-white shadow-md">
                  <svg viewBox="0 0 100 100" className="w-5 h-5 stroke-white fill-white">
                    <path d="M 50 18 C 65 32, 70 50, 70 64 C 70 78, 58 82, 50 82 C 42 82, 30 78, 30 64 C 30 50, 35 32, 50 18 Z" />
                  </svg>
                </div>
                <div>
                  <h1 className="font-extrabold text-lg tracking-tight text-slate-800">
                    Agro<span className="text-organic-green">Pilot</span>
                  </h1>
                </div>
              </div>
              
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Roadmap Navigation (Stages) */}
            <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
              {STAGE_METADATA.map((stage) => {
                const status = getStageStatus(stage);
                const isActive = currentStage === stage.id;
                const isAccessible = stage.id === 7 || stage.id <= maxReachedStage + 1;
                
                return (
                  <button
                    key={stage.id}
                    onClick={() => {
                      if (isAccessible) {
                        handleStageClick(stage.id);
                        setIsMobileMenuOpen(false);
                      }
                    }}
                    disabled={!isAccessible}
                    className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 text-left border relative ${
                      isActive 
                        ? 'bg-organic-green text-white border-organic-green shadow-lg shadow-organic-green/15 scale-[1.02]' 
                        : isAccessible 
                          ? 'bg-white hover:bg-organic-cream/50 text-slate-700 border-slate-100 hover:border-slate-200' 
                          : 'bg-slate-50/50 text-slate-400 border-slate-50 cursor-not-allowed'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-r" />
                    )}

                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : isAccessible 
                          ? 'bg-organic-lightGreen/50 text-organic-green' 
                          : 'bg-slate-200/50 text-slate-400'
                    }`}>
                      {isAccessible ? <stage.icon className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-organic-lightGreen' : 'text-organic-brown'}`}>
                          Stage {stage.id}
                        </span>
                        
                        {status === 'Synced' && (
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-organic-lightGreen text-organic-green'}`}>
                            Synced
                          </span>
                        )}
                        {status === 'In Progress' && (
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white animate-pulse' : 'bg-alert-amber/10 text-alert-amber'}`}>
                            Active
                          </span>
                        )}
                      </div>
                      
                      <p className="font-semibold text-sm truncate leading-snug mt-0.5">
                        {stage.title}
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* Drawer Footer (Integrated Session ID + compliance message) */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/60 space-y-4">
              <div className="flex items-center justify-between bg-white border border-slate-100 rounded-xl px-3 py-2 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-slate-400">ID:</span>
                  <span className="font-mono font-bold text-slate-800">{sessionId}</span>
                </div>
                <button 
                  onClick={copySessionId} 
                  className="text-slate-400 hover:text-organic-green p-1 rounded hover:bg-slate-100 transition-colors"
                  title="Copy Session ID"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-organic-green" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              {/* Token Capacity Bar inside mobile drawer */}
              {customApiKey ? (
                <div className="space-y-1.5 animate-fade-in border-b border-slate-100 pb-3">
                  <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    <span>⚡ BYOK Sizing</span>
                    <span className="text-purple-600 font-extrabold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
                      ∞ Unlimited
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-purple-100/30 rounded-full overflow-hidden border border-purple-200/40 relative">
                    <div className="h-full rounded-full bg-gradient-to-r from-purple-50 to-indigo-50 w-full animate-pulse" />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 animate-fade-in border-b border-slate-100 pb-3">
                  <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    <span>⚡ Tokens remaining</span>
                    <span className={tokenBalance > 30000 ? 'text-organic-green' : tokenBalance > 10000 ? 'text-amber-500 font-bold' : 'text-red-500 animate-pulse font-black'}>
                      {Math.round((tokenBalance / 100000) * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden relative border border-slate-200/50">
                    <div className={`h-full rounded-full transition-all duration-300 ${
                      tokenBalance > 30000 
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
                        : tokenBalance > 10000 
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
                          : 'bg-gradient-to-r from-red-500 to-rose-500 animate-pulse'
                    }`} style={{ width: `${(tokenBalance / 100000) * 100}%` }} />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-organic-brown shrink-0" />
                <p className="text-[10px] text-slate-500 leading-normal">
                  NPOP &amp; PGS-India Organic Compliant.
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* GLOBAL CAPACITY EXCEEDED CYBER OVERLAY */}
      {(tokenBalance <= 0 || error === "AI_CAPACITY_LIMIT_EXCEEDED") && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[9999] flex flex-col items-center justify-center p-6 text-center select-none animate-fade-in font-sans">
          
          {/* Glowing auroras */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
          
          <div className="max-w-md w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-8 space-y-6 relative overflow-hidden shadow-2xl backdrop-blur-md">
            
            {/* Pulsing empty battery segments or flashing warning badge */}
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-red-500/10 border border-red-500/20 animate-ping duration-1000" />
              <div className="w-20 h-20 bg-slate-950 border-2 border-red-500/40 rounded-full flex items-center justify-center text-red-500 shadow-xl shadow-red-500/15 relative">
                
                {/* Drained Battery Icon */}
                <div className="w-10 h-6 border-2 border-red-500/60 rounded-md relative flex items-center p-0.5 justify-start">
                  <div className="absolute -right-[4px] top-1/2 -translate-y-1/2 w-[3px] h-3 bg-red-500/60 rounded-r" />
                  <div className="h-full w-0.5 bg-red-500 animate-pulse rounded-sm" />
                </div>
                
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[9px] font-black text-white items-center justify-center font-sans">!</span>
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-white tracking-wider uppercase font-sans flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                AI Capacity Exhausted
              </h2>
              <p className="text-xs font-bold text-organic-brown tracking-widest uppercase">Seasonal Organic Budget Over</p>
              <p className="text-slate-400 text-xs leading-relaxed max-w-sm mx-auto pt-2">
                Your seasonal AgroPilot AI token budget has been fully drained. Real-time NPOP certified soil and spacing crop diagnostics are currently suspended.
              </p>
            </div>

            {/* Simulated token balance */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-xs flex items-center justify-between text-left">
              <div>
                <span className="text-slate-500 font-bold uppercase text-[9px] block">Drained Allocation</span>
                <span className="font-mono font-black text-red-500 text-sm mt-0.5">0 / 100,000 Tokens</span>
              </div>
              <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded bg-red-950/50 text-red-400 border border-red-900/30">
                Rate Blocked
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                
                {/* Grant tokens action */}
                <button
                  onClick={() => grantTokens(50000)}
                  className="py-3 px-5 text-xs font-extrabold flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg transition-all flex-1 transform active:scale-95"
                >
                  🎁 Grant +50k Free Tokens
                </button>

                {/* Simulation Mode bypass */}
                <button
                  onClick={() => {
                    setSimulationMode(true);
                    grantTokens(100000); // Recharge to clear overlay
                  }}
                  className="py-3 px-5 text-xs font-bold flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-all flex-1 transform active:scale-95"
                >
                  🔌 Local Simulation Bypass
                </button>
              </div>

              {/* Pro upgrade button */}
              <button
                onClick={() => alert("Thank you for choosing AgroPilot! Upgrade path will be unlocked in seasonal release.")}
                className="btn-organic-primary py-3.5 text-xs font-black bg-organic-green hover:bg-emerald-700 text-white shadow-xl flex items-center justify-center gap-2 tracking-wider uppercase border border-organic-green/20"
              >
                ⚡ Upgrade to Pilot-Pro (Unlimited)
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* GLOBAL PREMIUM AI LOADER OVERLAY */}
      {loading && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[999] flex flex-col items-center justify-center p-6 text-center select-none animate-fade-in">
          
          {/* Glowing Aura backdrop */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-organic-green/20 rounded-full blur-[80px] pointer-events-none animate-pulse" />
          
          {/* Spinner Sprout Container */}
          <div className="relative w-24 h-24 flex items-center justify-center">
            {/* Pulsing ring */}
            <div className="absolute inset-0 rounded-full border border-organic-lightGreen/20 scale-110 animate-ping duration-1000" />
            {/* Spinning gradient ring */}
            <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-organic-green border-r-organic-green/30 animate-spin duration-[800ms]" />
            {/* Center leaf badge */}
            <div className="w-14 h-14 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-organic-green/20">
              <svg viewBox="0 0 100 100" className="w-8 h-8 stroke-organic-lightGreen fill-organic-lightGreen animate-bounce duration-[2000ms]">
                <path d="M 50 18 C 65 32, 70 50, 70 64 C 70 78, 58 82, 50 82 C 42 82, 30 78, 30 64 C 30 50, 35 32, 50 18 Z" />
              </svg>
            </div>
          </div>

          {/* Texts */}
          <div className="space-y-3.5 max-w-sm mt-8 z-10">
            <h3 className="font-extrabold text-white text-base tracking-wider uppercase font-sans flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-organic-lightGreen animate-pulse" />
              AgroPilot AI Synthesizing
            </h3>
            <p className="text-slate-200 text-xs font-semibold leading-relaxed min-h-[32px] px-4">
              {getLoadingMessage(currentStage)}
            </p>
          </div>

          {/* Micro Progress Bar */}
          <div className="w-48 h-[3px] bg-white/10 rounded-full overflow-hidden mt-6 z-10 relative">
            <div className="bg-gradient-to-r from-organic-green to-organic-lightGreen h-full rounded-full animate-progress absolute left-0 top-0" style={{ width: '40%' }} />
          </div>
          
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-4">
            NPOP Standard Calibrating
          </span>
        </div>
      )}

      {/* SETTINGS GEAR BYOK MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 animate-fade-in">
          
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl relative border border-slate-100 animate-slide-in">
            
            {/* Header */}
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto shadow-sm">
                <Settings className="w-6 h-6 animate-spin-slow" />
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">BYOK Key Sizing Menu</h3>
              <p className="text-slate-400 text-xs leading-normal max-w-xs mx-auto">
                Paste your custom Google Gemini API Key below. AgroPilot will encrypt it locally and bypass standard trial token limits.
              </p>
            </div>

            {/* Input field */}
            <div className="space-y-3 text-left">
              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-400 mb-1.5 uppercase flex items-center justify-between">
                  <span>Gemini API Key</span>
                  {customApiKey && (
                    <span className="text-[10px] text-purple-600 font-extrabold flex items-center gap-1 uppercase bg-purple-50 px-2 py-0.5 rounded">
                      Connected
                    </span>
                  )}
                </label>
                <div className="relative flex items-center">
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={settingsKeyInput}
                    onChange={(e) => {
                      setSettingsKeyInput(e.target.value);
                      setKeyCheckSuccess(false);
                      setKeyCheckError(null);
                    }}
                    className="organic-input text-xs font-mono font-bold w-full pr-10 border border-slate-200"
                  />
                  <div className="absolute right-3.5 text-slate-300">
                    <Key className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Status messages */}
              {keyChecking && (
                <div className="text-[10px] text-slate-500 font-extrabold flex items-center gap-1.5 uppercase animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-ping" />
                  Pinging Gemini servers...
                </div>
              )}
              
              {keyCheckSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs rounded-xl flex items-start gap-2.5 font-medium leading-relaxed">
                  <Check className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
                  <div>
                    <span className="font-extrabold block text-[10px] uppercase text-emerald-600">Verification Success!</span>
                    Your custom API key is active. All future plans will be generated using this key.
                  </div>
                </div>
              )}

              {keyCheckError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl flex items-start gap-2.5 font-medium leading-relaxed flex-col">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                    <span className="font-extrabold block text-[10px] uppercase text-red-600">Verification Failed</span>
                  </div>
                  <span className="text-slate-600 pl-6">{keyCheckError}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex gap-3">
                <button
                  onClick={handleCheckKey}
                  disabled={keyChecking || !settingsKeyInput}
                  className="py-3 px-5 text-xs font-extrabold flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg transition-all flex-1 transform active:scale-95 disabled:opacity-50"
                >
                  {keyChecking ? "Testing..." : "Verify key"}
                </button>

                <button
                  onClick={handleSaveKeySetup}
                  disabled={!keyCheckSuccess}
                  className="py-3 px-5 text-xs font-extrabold flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all flex-1 transform active:scale-95 disabled:opacity-50"
                >
                  Save &amp; Setup
                </button>
              </div>

              <div className="flex gap-3">
                {customApiKey && (
                  <button
                    onClick={handleDisconnectKey}
                    className="py-2.5 px-4 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/50 rounded-xl transition-all flex-1 transform active:scale-95"
                  >
                    Disconnect Key
                  </button>
                )}
                
                <button
                  onClick={() => {
                    setShowSettingsModal(false);
                    setKeyCheckError(null);
                    setKeyCheckSuccess(false);
                  }}
                  className="py-2.5 px-4 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all flex-1"
                >
                  Close panel
                </button>
              </div>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}
