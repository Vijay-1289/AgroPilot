import React, { useState, useEffect, useRef } from 'react';
import { useStageStore } from '../store/stageStore';
import StageHeader from '../components/common/StageHeader';
import AICard from '../components/common/AICard';
import SyncButton from '../components/common/SyncButton';
import { MapPin, Navigation, Compass, Layers, CheckCircle2, ChevronRight, AlertCircle, Info } from 'lucide-react';
import L from 'leaflet';

export default function Stage1Page() {
  const { stageOutputs, saveStageOutput, syncToNextStage, loading, setLoading, setError, error } = useStageStore();

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [customCrop, setCustomCrop] = useState('');
  const [locating, setLocating] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  // Default coordinate center
  const centerLat = lat ? parseFloat(lat) : 17.3850;
  const centerLng = lng ? parseFloat(lng) : 78.4867;

  // Initialize Map in Stage 1
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([centerLat, centerLng], 14);

      // High-resolution Esri World Imagery satellite view
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 19
      }).addTo(mapRef.current);

      // Create leaf-green div icon for marker
      const pinIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="w-8 h-8 rounded-full bg-organic-green border-2 border-white flex items-center justify-center text-white shadow-xl animate-pulse">🌾</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      // Draggable pin
      markerRef.current = L.marker([centerLat, centerLng], {
        icon: pinIcon,
        draggable: true
      }).addTo(mapRef.current);

      // Sync coordinate values when marker dragged
      markerRef.current.on('dragend', (e) => {
        const position = e.target.getLatLng();
        setLat(position.lat.toFixed(6));
        setLng(position.lng.toFixed(6));
      });

      // Update pin position and coordinates when map clicked
      mapRef.current.on('click', (e) => {
        const { lat, lng } = e.latlng;
        setLat(lat.toFixed(6));
        setLng(lng.toFixed(6));
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        }
      });
    }

    return () => {
      // Clean up map instance when unmounting
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Handle manual/GPS input coordinate changes to pan the map pin
  useEffect(() => {
    if (mapRef.current && markerRef.current && lat && lng) {
      const newLat = parseFloat(lat);
      const newLng = parseFloat(lng);
      if (!isNaN(newLat) && !isNaN(newLng)) {
        const currentMarkerLatLng = markerRef.current.getLatLng();
        // Only update if marker position is actually different (avoids loops during drag)
        if (Math.abs(currentMarkerLatLng.lat - newLat) > 0.0001 || Math.abs(currentMarkerLatLng.lng - newLng) > 0.0001) {
          markerRef.current.setLatLng([newLat, newLng]);
          mapRef.current.panTo([newLat, newLng]);
        }
      }
    }
  }, [lat, lng]);

  // Load existing stage1 outputs if user returns
  useEffect(() => {
    const existing = stageOutputs.stage1;
    if (existing) {
      setLat(existing.location?.lat || '');
      setLng(existing.location?.lng || '');
      setSelectedCrop(existing.selectedCrop || '');
      setAnalysisResult({
        locationName: existing.locationName,
        soilType: existing.soilType,
        soilPH: existing.soilPH,
        suggestedCrops: existing.suggestedCrops
      });
    }
  }, [stageOutputs.stage1]);

  const detectGPS = () => {
    setLocating(true);
    setError(null);
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLocating(false);
      // Set default coordinates as fallback
      setLat('17.3850');
      setLng('78.4867');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude.toFixed(6));
        setLng(position.coords.longitude.toFixed(6));
        setLocating(false);
      },
      (err) => {
        console.warn("GPS lock failed, utilizing defaults:", err.message);
        setError("Could not secure a precise GPS lock. Loaded standard default coordinates (Hyderabad, India).");
        setLat('17.3850');
        setLng('78.4867');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const runAnalysis = async () => {
    if (!lat || !lng) return;
    setLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const response = await fetch('/api/stage1/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: parseFloat(lat), lng: parseFloat(lng) })
      });

      if (!response.ok) {
        throw new Error("Failed to analyze geographical details.");
      }

      const data = await response.json();
      setAnalysisResult(data);
      
      // Auto-populate selected crop if previously selected is valid, or empty
      if (data.suggestedCrops?.length > 0 && !selectedCrop) {
        setSelectedCrop(data.suggestedCrops[0].name);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => {
    const finalCrop = customCrop.trim() !== '' ? customCrop : selectedCrop;
    if (!finalCrop || !analysisResult) return;

    const stage1Data = {
      location: { lat: parseFloat(lat), lng: parseFloat(lng) },
      locationName: analysisResult.locationName,
      soilType: analysisResult.soilType,
      soilPH: analysisResult.soilPH,
      suggestedCrops: analysisResult.suggestedCrops,
      selectedCrop: finalCrop
    };

    // Save and sync to Stage 2
    syncToNextStage('stage1', stage1Data, 2);
  };

  const canProceed = (selectedCrop || customCrop.trim() !== '') && analysisResult;

  return (
    <div className="space-y-8 animate-fade-in">
      <StageHeader 
        number={1} 
        title="Land & Geolocation Profiling" 
        description="Pinpoint your farming coordinates using active browser GPS or manual overrides. We utilize this to pull regional soils data, local agricultural characteristics, and recommend compliant organic cash crops."
      />

      {/* Inputs panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* GPS Coordinate Card */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between border border-slate-100 hover-glow md:col-span-2">
          <div className="space-y-4">
            
            {/* Header info */}
            <div>
              <h3 className="font-extrabold text-base text-slate-800 tracking-tight flex items-center gap-2">
                <Compass className="w-5 h-5 text-organic-green" />
                Capture Farm Geolocation
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Drag the wheat pin 🌾 directly onto your field on the satellite map, click anywhere, use your browser's GPS, or key in coordinates manually. All variables synchronize in real-time to prevent LLM regional hallucinations.
              </p>
            </div>

            {/* Split layout: Map left, Inputs right */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start border-t border-slate-100/60 pt-4">
              
              {/* Left Column: Interactive Satellite Map */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  1. Interactive Satellite Pin Dropper
                </span>
                
                <div className="w-full h-[250px] border border-slate-100 rounded-xl overflow-hidden shadow-inner relative">
                  <div ref={mapContainerRef} className="w-full h-full z-10" />
                  
                  {/* Floating Coordinates display over map */}
                  {lat && lng && (
                    <div className="absolute bottom-3 left-3 z-[400] bg-slate-900/80 text-white font-mono text-[9px] font-bold px-2.5 py-1.5 rounded-lg border border-white/10 shadow-lg backdrop-blur-sm">
                      📍 Lat: {lat} | Lng: {lng}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Coordinate inputs & triggers */}
              <div className="space-y-4">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  2. Manual Overrides &amp; GPS Captures
                </span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-400 mb-1 uppercase">Latitude</label>
                    <input
                      type="number"
                      placeholder="e.g. 17.3850"
                      step="0.0001"
                      value={lat}
                      onChange={(e) => setLat(e.target.value)}
                      className="organic-input font-mono text-xs py-2 px-3"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-400 mb-1 uppercase">Longitude</label>
                    <input
                      type="number"
                      placeholder="e.g. 78.4867"
                      step="0.0001"
                      value={lng}
                      onChange={(e) => setLng(e.target.value)}
                      className="organic-input font-mono text-xs py-2 px-3"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-alert-amber/5 border border-alert-amber/25 text-alert-amber text-[10px] font-bold rounded-xl flex items-start gap-1.5 leading-snug">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2.5 pt-2">
                  <button
                    onClick={detectGPS}
                    disabled={locating}
                    className="btn-organic-secondary w-full py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Navigation className={`w-3.5 h-3.5 text-organic-green ${locating ? 'animate-bounce' : ''}`} />
                    {locating ? "Locking GPS..." : "Auto-Detect Location (GPS)"}
                  </button>

                  <button
                    onClick={runAnalysis}
                    disabled={loading || !lat || !lng}
                    className="btn-organic-primary w-full py-3 px-4 text-xs font-black tracking-wide"
                  >
                    <Layers className="w-4 h-4" />
                    Analyze Soil &amp; Region at Coordinate Spot
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Soil/Crop Context display if crop already selected */}
        <div className="bg-organic-green text-white p-6 rounded-2xl flex flex-col justify-between shadow-lg shadow-organic-green/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
          
          <div className="space-y-4 relative z-10">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <MapPin className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-organic-lightGreen">Active Sowing Target</h4>
              <p className="font-extrabold text-2xl mt-1 tracking-tight">
                {customCrop.trim() !== '' ? customCrop : (selectedCrop || 'Not Selected')}
              </p>
            </div>
            {analysisResult && (
              <div className="border-t border-white/10 pt-3 mt-3 text-xs text-organic-lightGreen space-y-1.5 font-medium">
                <p>📍 {analysisResult.locationName}</p>
                <p>🌍 {analysisResult.soilType}</p>
              </div>
            )}
          </div>
          
          <p className="text-[10px] text-organic-lightGreen/85 font-medium leading-normal mt-4 relative z-10">
            This selection is preserved and synced into the sowing spacing, irrigation pipelines, and market calculations.
          </p>
        </div>
      </div>

      {/* Analysis Results Display */}
      {analysisResult && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
          
          {/* Soil & Location Cards */}
          <div className="space-y-6 md:col-span-1">
            <div className="glass-card p-6 rounded-2xl border border-slate-100 flex flex-col gap-4">
              <div className="w-10 h-10 rounded-xl bg-organic-cream flex items-center justify-center text-organic-brown">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Regional Location</h4>
                <p className="font-bold text-slate-800 text-lg leading-tight mt-1">{analysisResult.locationName}</p>
                <p className="font-mono text-xs text-slate-400 mt-2">Lat: {lat} | Lng: {lng}</p>
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-slate-100 flex flex-col gap-4">
              <div className="w-10 h-10 rounded-xl bg-organic-cream flex items-center justify-center text-organic-brown">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Inferred Soil Profile</h4>
                <p className="font-extrabold text-slate-800 text-lg leading-snug mt-1">{analysisResult.soilType}</p>
                <div className="flex items-center gap-4 mt-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Soil pH</span>
                    <p className="font-bold text-organic-green text-sm">{analysisResult.soilPH}</p>
                  </div>
                  <div className="border-l border-slate-100 h-8" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Organic Matter</span>
                    <p className="font-bold text-organic-green text-sm">1.8% - 2.5%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Recommended Crops */}
          <div className="md:col-span-2">
            <AICard title="Soil-Specific Organic Crop Recommendations" severity="success">
              <p className="text-slate-600 text-xs mb-4 leading-normal">
                Gemini evaluated local regional seasonal patterns and inferred soil indexes. Below are the top 5 organic crops suitable for commercial production on Red Laterite soil in this sector:
              </p>

              {/* Crop Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {analysisResult.suggestedCrops.map((crop, idx) => {
                  const isSelected = selectedCrop === crop.name && customCrop.trim() === '';
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedCrop(crop.name);
                        setCustomCrop('');
                      }}
                      className={`p-4 rounded-xl border text-left flex items-start justify-between transition-all duration-200 ${
                        isSelected 
                          ? 'bg-organic-green/5 border-organic-green ring-2 ring-organic-green/20' 
                          : 'bg-white hover:bg-slate-50 border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className="space-y-1 pr-3">
                        <div className="flex items-center gap-1.5">
                          <p className="font-extrabold text-sm text-slate-800 leading-tight">{crop.name}</p>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-organic-green shrink-0" />}
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">{crop.season} crop</p>
                        <p className="text-xs text-slate-500 font-medium pt-1">Potential: <span className="font-semibold text-organic-brown">{crop.expectedYield}</span></p>
                      </div>
                      <div className="px-2 py-1 bg-organic-cream text-organic-brown rounded-md text-[10px] font-bold shrink-0">
                        {crop.suitability} Fit
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Crop Input */}
              <div className="border-t border-slate-100/60 pt-4 mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="max-w-md">
                  <h5 className="font-bold text-xs text-slate-700">Prefer a different crop?</h5>
                  <p className="text-[10px] text-slate-400">Type a custom crop below. Our planning AI will build custom protocols around it.</p>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Mustard, Turmeric"
                  value={customCrop}
                  onChange={(e) => {
                    setCustomCrop(e.target.value);
                    setSelectedCrop('');
                  }}
                  className="organic-input py-2.5 text-xs w-full sm:w-60"
                />
              </div>
            </AICard>
          </div>

        </div>
      )}

      {/* Next Sync trigger */}
      {analysisResult && (
        <div className="flex justify-end border-t border-slate-100/60 pt-6 mt-6">
          <SyncButton
            onClick={handleProceed}
            disabled={!canProceed}
            loading={loading}
            label="Sync & Proceed to Stage 2 (Measurement)"
          />
        </div>
      )}

    </div>
  );
}
