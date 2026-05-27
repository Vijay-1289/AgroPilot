import React, { useState, useEffect, useRef } from 'react';
import { useStageStore } from '../store/stageStore';
import StageHeader from '../components/common/StageHeader';
import SyncButton from '../components/common/SyncButton';
import { 
  Map as MapIcon, 
  Trash2, 
  RotateCcw, 
  Info, 
  Sliders, 
  PlusCircle, 
  Activity,
  Maximize2
} from 'lucide-react';
import L from 'leaflet';
import * as turf from '@turf/turf';

export default function Stage2Page() {
  const { stageOutputs, saveStageOutput, syncToNextStage, loading, setError, error } = useStageStore();

  const [activeTab, setActiveTab] = useState('map'); // 'map' or 'manual'
  const [vertices, setVertices] = useState([]);
  
  // Turf-Calculated Outputs
  const [totalArea, setTotalArea] = useState(0); // in square meters
  const [perimeter, setPerimeter] = useState(0); // in meters
  const [centroid, setCentroid] = useState(null);
  const [sideLengths, setSideLengths] = useState([]); // array of side meters

  // Manual Form States
  const [manualArea, setManualArea] = useState('');
  const [manualUnit, setManualUnit] = useState('acres');
  const [manualSidesCount, setManualSidesCount] = useState(4);
  const [manualSideLengths, setManualSideLengths] = useState(['', '', '', '']);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const polygonLayerRef = useRef(null);
  const markersRef = useRef([]);

  // Fetch coordinates from Stage 1 as default center
  const centerLat = stageOutputs.stage1?.location?.lat || parseFloat(import.meta.env.VITE_DEFAULT_LAT || 17.3850);
  const centerLng = stageOutputs.stage1?.location?.lng || parseFloat(import.meta.env.VITE_DEFAULT_LNG || 78.4867);

  // Initialize Map
  useEffect(() => {
    if (activeTab !== 'map' || !mapContainerRef.current) return;

    // Check if map is already initialized
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([centerLat, centerLng], 16);
      
      // High-resolution Esri World Imagery satellite view mapping tile layer
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 19
      }).addTo(mapRef.current);

      // Handle map clicks to drop vertices
      mapRef.current.on('click', (e) => {
        const { lat, lng } = e.latlng;
        setVertices(prev => [...prev, { lat, lng }]);
      });
    }

    return () => {
      // Don't destroy immediately to preserve map instance in state
    };
  }, [activeTab]);

  // Handle vertex updates: draw polygon & calculate Turf.js metrics
  useEffect(() => {
    if (activeTab !== 'map' || !mapRef.current) return;

    const map = mapRef.current;

    // Remove existing polygon layer if drawn
    if (polygonLayerRef.current) {
      map.removeLayer(polygonLayerRef.current);
      polygonLayerRef.current = null;
    }

    // Clear existing markers
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    if (vertices.length === 0) {
      setTotalArea(0);
      setPerimeter(0);
      setCentroid(null);
      setSideLengths([]);
      return;
    }

    // Render Markers for vertices
    vertices.forEach((vertex, idx) => {
      // Create a green numbered icon
      const numberedIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="w-6 h-6 rounded-full bg-organic-green border-2 border-white flex items-center justify-center text-white text-[10px] font-black shadow-md">${idx + 1}</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([vertex.lat, vertex.lng], {
        icon: numberedIcon,
        draggable: true
      }).addTo(map);

      // Handle vertex dragging
      marker.on('drag', (e) => {
        const newLatLng = e.target.getLatLng();
        setVertices(prev => {
          const updated = [...prev];
          updated[idx] = { lat: newLatLng.lat, lng: newLatLng.lng };
          return updated;
        });
      });

      markersRef.current.push(marker);
    });

    // Draw connecting lines / polygon
    if (vertices.length >= 3) {
      const latLngs = vertices.map(v => [v.lat, v.lng]);
      polygonLayerRef.current = L.polygon(latLngs, {
        color: '#4AD66D',
        fillColor: '#D8F3DC',
        fillOpacity: 0.4,
        weight: 3.5
      }).addTo(map);

      // TURF CALCULATIONS
      try {
        // Close the polygon ring for Turf
        const coordinates = [...vertices.map(v => [v.lng, v.lat]), [vertices[0].lng, vertices[0].lat]];
        const polyGeoJSON = turf.polygon([coordinates]);

        // 1. Calculate Area (m2)
        const areaVal = turf.area(polyGeoJSON);
        setTotalArea(areaVal);

        // 2. Centroid
        const center = turf.centroid(polyGeoJSON);
        setCentroid({
          lat: center.geometry.coordinates[1],
          lng: center.geometry.coordinates[0]
        });

        // 3. Side Lengths & Perimeter
        let totalLen = 0;
        const sides = [];
        
        for (let i = 0; i < vertices.length; i++) {
          const start = turf.point([vertices[i].lng, vertices[i].lat]);
          const nextIdx = (i + 1) % vertices.length;
          const end = turf.point([vertices[nextIdx].lng, vertices[nextIdx].lat]);
          
          // distance in meters
          const dist = turf.distance(start, end, { units: 'meters' });
          sides.push(Math.round(dist * 10) / 10);
          totalLen += dist;
        }

        setSideLengths(sides);
        setPerimeter(totalLen);
      } catch (err) {
        console.error("Turf computation error:", err);
      }
    } else if (vertices.length > 0) {
      // Just draw polyline if only 2 points
      const latLngs = vertices.map(v => [v.lat, v.lng]);
      polygonLayerRef.current = L.polyline(latLngs, {
        color: '#F59E0B',
        weight: 3,
        dashArray: '6, 8'
      }).addTo(map);

      setTotalArea(0);
      setCentroid(null);
      setSideLengths([]);
      setPerimeter(0);
    }
  }, [vertices, activeTab]);

  // Hydrate from existing data on load
  useEffect(() => {
    const existing = stageOutputs.stage2;
    if (existing) {
      if (existing.polygon && existing.polygon.coordinates) {
        // Extract vertices from GeoJSON (omit the closed coordinate)
        const coords = existing.polygon.coordinates[0];
        const loadedVertices = coords.slice(0, -1).map(c => ({ lat: c[1], lng: c[0] }));
        setVertices(loadedVertices);
      } else {
        // It was a manual entry
        setActiveTab('manual');
        setManualArea(existing.totalArea || '');
        setManualUnit(existing.areaUnit || 'acres');
        setManualSidesCount(existing.sideLengths?.length || 4);
        setManualSideLengths(existing.sideLengths || ['', '', '', '']);
      }
    }
  }, [stageOutputs.stage2]);

  // Watch manual side counts and resize lengths array
  const handleSidesCountChange = (count) => {
    const nextCount = parseInt(count) || 3;
    setManualSidesCount(nextCount);
    setManualSideLengths(prev => {
      const next = [...prev];
      while (next.length < nextCount) next.push('');
      return next.slice(0, nextCount);
    });
  };

  const handleManualSideLengthChange = (idx, val) => {
    setManualSideLengths(prev => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  const clearVertices = () => {
    setVertices([]);
  };

  const undoVertex = () => {
    setVertices(prev => prev.slice(0, -1));
  };

  const handleProceed = () => {
    let stage2Data = {};

    if (activeTab === 'map') {
      if (vertices.length < 3) return;

      const coordinates = [...vertices.map(v => [v.lng, v.lat]), [vertices[0].lng, vertices[0].lat]];
      
      // Calculate final values in acres/hectares
      const acresVal = parseFloat((totalArea * 0.000247105).toFixed(2));
      
      stage2Data = {
        totalArea: acresVal,
        areaUnit: 'acres',
        perimeter: Math.round(perimeter * 10) / 10,
        sideLengths,
        centroid,
        polygon: {
          type: "Polygon",
          coordinates: [coordinates]
        }
      };
    } else {
      // Manual Proceed
      if (!manualArea) return;
      
      let finalAcres = parseFloat(manualArea);
      if (manualUnit === 'hectares') finalAcres = finalAcres * 2.471;
      if (manualUnit === 'sqm') finalAcres = finalAcres / 4047.0;

      stage2Data = {
        totalArea: Math.round(finalAcres * 100) / 100,
        areaUnit: 'acres',
        perimeter: manualSideLengths.reduce((a, b) => (parseFloat(a) || 0) + (parseFloat(b) || 0), 0),
        sideLengths: manualSideLengths.map(l => parseFloat(l) || 0),
        centroid: { lat: centerLat, lng: centerLng },
        polygon: null
      };
    }

    // Save and sync to Stage 3
    syncToNextStage('stage2', stage2Data, 3);
  };

  // Validation
  const canProceed = activeTab === 'map' ? vertices.length >= 3 : manualArea !== '';

  const m2ToAcres = (m2) => (m2 * 0.000247105).toFixed(2);
  const m2ToHectares = (m2) => (m2 * 0.0001).toFixed(2);

  return (
    <div className="space-y-8 animate-fade-in">
      <StageHeader
        number={2}
        title="Land Geometry &amp; Boundary Plotter"
        description="Establish the physical dimensions of your farm. Click on the map directly to drop corner markers and form the polygon shape of your plot, or key in details manually. Downstream row configurations are sized around this layout."
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('map')}
          className={`px-6 py-3 font-bold text-sm border-b-2 flex items-center gap-2 ${
            activeTab === 'map' 
              ? 'border-organic-green text-organic-green' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <MapIcon className="w-4 h-4" />
          Interactive Map Drawer (Primary)
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`px-6 py-3 font-bold text-sm border-b-2 flex items-center gap-2 ${
            activeTab === 'manual' 
              ? 'border-organic-green text-organic-green' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Manual Numeric Form
        </button>
      </div>

      {activeTab === 'map' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Map canvas */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-3 bg-white/70 border border-slate-100 rounded-xl flex items-start gap-2.5 text-xs text-slate-600">
              <Info className="w-4.5 h-4.5 text-organic-green shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800">Drawing Instructions:</span> Click the map to drop plot corner pins. Dropping 3 or more pins forms a shaded boundary. You can drag existing pins to refine dimensions.
              </div>
            </div>

            {/* Map wrapper */}
            <div className="w-full h-[400px] border border-slate-100 rounded-2xl overflow-hidden shadow-sm relative">
              <div ref={mapContainerRef} className="w-full h-full z-10" />
              
              {/* Map Floating HUD */}
              <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
                <button
                  onClick={clearVertices}
                  disabled={vertices.length === 0}
                  className="bg-white hover:bg-slate-50 text-alert-red px-3.5 py-2.5 rounded-xl border border-slate-100 shadow-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Map
                </button>
                <button
                  onClick={undoVertex}
                  disabled={vertices.length === 0}
                  className="bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2.5 rounded-xl border border-slate-100 shadow-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Undo Pin
                </button>
              </div>
            </div>
          </div>

          {/* Spatial metrics HUD */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Live Metrics card */}
            <div className="glass-card p-6 rounded-2xl border border-slate-100 space-y-6">
              <h3 className="font-extrabold text-base text-slate-800 tracking-tight flex items-center gap-2">
                <Activity className="w-5 h-5 text-organic-green" />
                Live Boundary Metrics
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-organic-cream/40 p-4 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Area</span>
                  <p className="font-black text-slate-800 text-xl mt-1">{m2ToAcres(totalArea)} <span className="text-xs font-bold text-slate-500">Acres</span></p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">({m2ToHectares(totalArea)} Ha)</p>
                </div>
                <div className="bg-organic-cream/40 p-4 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Perimeter</span>
                  <p className="font-black text-slate-800 text-xl mt-1">{Math.round(perimeter)} <span className="text-xs font-bold text-slate-500">m</span></p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">({vertices.length} corner pins)</p>
                </div>
              </div>

              {centroid && (
                <div className="border-t border-slate-100 pt-4 text-xs font-medium space-y-1.5 text-slate-500">
                  <p className="flex items-center gap-1.5">
                    <span className="text-slate-400 font-bold uppercase text-[9px] font-mono">Centroid:</span> 
                    <span className="font-mono text-slate-600">[{centroid.lat.toFixed(5)}, {centroid.lng.toFixed(5)}]</span>
                  </p>
                </div>
              )}

              {/* Individual side lengths */}
              {sideLengths.length > 0 && (
                <div className="border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-extrabold text-slate-700 mb-3 flex items-center justify-between">
                    <span>Side Dimensions</span>
                    <span className="text-[9px] font-bold text-organic-brown uppercase">Meters</span>
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {sideLengths.map((len, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-1.5 px-3 bg-slate-50 rounded-lg border border-slate-100 font-mono">
                        <span className="font-semibold text-slate-500">Side {idx+1} &rarr; {idx === sideLengths.length - 1 ? 1 : idx+2}</span>
                        <span className="font-black text-organic-green">{len} m</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Instruction Panel if vertices are empty */}
            {vertices.length < 3 && (
              <div className="p-5 bg-organic-lightGreen/10 border border-organic-lightGreen/20 text-organic-green text-xs rounded-2xl leading-relaxed flex items-start gap-2.5">
                <Maximize2 className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-1">Interactive Poly-Mapping Active:</span>
                  Please click at least three corner points on the map to calculate polygon area, grand boundaries, and centroid calculations.
                </div>
              </div>
            )}
          </div>

        </div>
      ) : (
        /* MANUAL INPUT FALLBACK */
        <div className="glass-card p-8 rounded-2xl border border-slate-100 space-y-6 max-w-2xl mx-auto">
          <h3 className="font-extrabold text-base text-slate-800 tracking-tight flex items-center gap-2">
            <Sliders className="w-5 h-5 text-organic-green" />
            Manual Land Form Input
          </h3>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 flex flex-col">
              <label className="text-xs font-bold text-slate-400 mb-1.5 uppercase">Total Land Area</label>
              <input
                type="number"
                placeholder="e.g. 2.5"
                value={manualArea}
                onChange={(e) => setManualArea(e.target.value)}
                className="organic-input text-sm"
              />
            </div>
            
            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-400 mb-1.5 uppercase">Area Unit</label>
              <select
                value={manualUnit}
                onChange={(e) => setManualUnit(e.target.value)}
                className="organic-input text-sm"
              >
                <option value="acres">Acres</option>
                <option value="hectares">Hectares</option>
                <option value="sqm">Square Meters</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-400 mb-1.5 uppercase">Number of Plot Sides</label>
            <input
              type="number"
              min="3"
              max="10"
              value={manualSidesCount}
              onChange={(e) => handleSidesCountChange(e.target.value)}
              className="organic-input text-sm"
            />
          </div>

          <div className="border-t border-slate-100 pt-4">
            <h4 className="text-xs font-extrabold text-slate-700 mb-3 uppercase">Enter Side Lengths (meters)</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {manualSideLengths.map((len, idx) => (
                <div key={idx} className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold mb-1">Side {idx+1} length</span>
                  <input
                    type="number"
                    placeholder="e.g. 50"
                    value={len}
                    onChange={(e) => handleManualSideLengthChange(idx, e.target.value)}
                    className="organic-input py-2 text-xs font-mono"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sync triggers */}
      <div className="flex justify-end border-t border-slate-100/60 pt-6 mt-6">
        <SyncButton
          onClick={handleProceed}
          disabled={!canProceed}
          loading={loading}
          label="Sync &amp; Proceed to Stage 3 (Farming Plan)"
        />
      </div>

    </div>
  );
}
