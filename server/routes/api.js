import express from 'express';
import multer from 'multer';
import { AsyncLocalStorage } from 'async_hooks';
import { runGeminiPrompt as baseRunGeminiPrompt, runGeminiVisionPrompt as baseRunGeminiVisionPrompt } from '../services/geminiService.js';

const router = express.Router();
const asyncLocalStorage = new AsyncLocalStorage();

// Middleware to capture simulation header and custom API key in request context
router.use((req, res, next) => {
  const isSim = req.headers['x-simulation-mode'] === 'true';
  const customKey = req.headers['x-gemini-api-key'] || null;
  asyncLocalStorage.run({ isSim, customKey }, () => {
    next();
  });
});

const runGeminiPrompt = async (systemContext, userPrompt, schema) => {
  const store = asyncLocalStorage.getStore();
  const isSim = store ? store.isSim : false;
  const customKey = store ? store.customKey : null;
  return await baseRunGeminiPrompt(systemContext, userPrompt, schema, 2, isSim, customKey);
};

const runGeminiVisionPrompt = async (systemContext, userPrompt, base64Image, schema) => {
  const store = asyncLocalStorage.getStore();
  const isSim = store ? store.isSim : false;
  const customKey = store ? store.customKey : null;
  return await baseRunGeminiVisionPrompt(systemContext, userPrompt, base64Image, schema, isSim, customKey);
};

/**
 * BYOK API Key Verification Endpoint
 * Body: { key }
 */
router.post('/check-key', async (req, res) => {
  const { key } = req.body;
  if (!key || key.trim() === "") {
    return res.status(400).json({ success: false, error: "Empty API key provided." });
  }

  try {
    const result = await baseRunGeminiPrompt(
      { test: "ping" },
      "Generate exactly one word: 'Success'.",
      '"Success"',
      0,
      false,
      key
    );

    if (result) {
      return res.json({ success: true });
    } else {
      throw new Error("Invalid response");
    }
  } catch (err) {
    console.error("🔑 Custom key validation failed: ", err.message);
    return res.status(400).json({ success: false, error: "Your Gemini API Key is invalid or quota has been fully exhausted." });
  }
});

// Multer upload config using memory storage to easily feed base64 images to Gemini Vision
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * Stage 1: Land Details Geolocation Analyze
 * Body: { lat, lng }
 */
router.post('/stage1/analyze', async (req, res) => {
  const { lat, lng } = req.body;
  
  if (!lat || !lng) {
    return res.status(400).json({ error: "Missing coordinates lat/lng" });
  }

  // 1. Reverse-geocode using Geoapify with an OpenStreetMap Nominatim fallback
  let realAddress = "";
  const geoapifyKey = process.env.GEOAPIFY_API_KEY;

  if (geoapifyKey) {
    try {
      const geoUrl = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=${geoapifyKey}`;
      const geoRes = await fetch(geoUrl);
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData.features && geoData.features.length > 0) {
          const properties = geoData.features[0].properties;
          realAddress = properties.formatted || properties.address_line2 || "";
        }
      }
    } catch (err) {
      console.warn("⚠️ Geoapify reverse-geocoding failed: ", err.message);
    }
  }

  // Fallback to OSM Nominatim if Geoapify is not configured or fails
  if (!realAddress) {
    try {
      const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
      const osmRes = await fetch(osmUrl, {
        headers: { 'User-Agent': 'AgroPilot/1.0.0' }
      });
      if (osmRes.ok) {
        const osmData = await osmRes.json();
        realAddress = osmData.display_name || "";
      }
    } catch (err) {
      console.warn("⚠️ Nominatim fallback reverse-geocoding failed: ", err.message);
    }
  }

  // Fallback to BigDataCloud reverse geocode client if Nominatim and Geoapify fail or return empty
  if (!realAddress) {
    try {
      const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
      const bdcRes = await fetch(bdcUrl);
      if (bdcRes.ok) {
        const bdcData = await bdcRes.json();
        const cityOrLocality = bdcData.city || bdcData.locality || "";
        const state = bdcData.principalSubdivision || "";
        const country = bdcData.countryName || "India";
        if (cityOrLocality && state) {
          realAddress = `${cityOrLocality}, ${state}, ${country}`;
        } else if (state) {
          realAddress = `${state}, ${country}`;
        } else if (bdcData.locality) {
          realAddress = `${bdcData.locality}, ${country}`;
        }
      }
    } catch (err) {
      console.warn("⚠️ BigDataCloud fallback reverse-geocoding failed: ", err.message);
    }
  }

  const systemContext = { lat, lng, realAddress };
  const userPrompt = `A farmer is starting a farm session at coordinates Latitude: ${lat}, Longitude: ${lng}. 
  We have reverse-geocoded this location and the exact physical real-world address is: "${realAddress || 'India'}". 
  Based on this exact geographical region, infer the local soil profile (pH range, organic matter percentage, classification). Recommend the top 5 organic crops suitable for this region and current season.`;
  
  const schema = `{
    "locationName": "string representing village, district, state in India",
    "soilType": "string representing soil classification like Alluvial, Red Sandy, Black Cotton",
    "soilPH": "string showing pH range like 6.5 - 7.2",
    "suggestedCrops": [
      {
        "name": "crop name",
        "season": "Kharif, Rabi, Zaid, or Year-Round",
        "suitability": "percentage like 90%",
        "expectedYield": "range like 15-18 quintals/acre"
      }
    ]
  }`;

  try {
    const data = await runGeminiPrompt(systemContext, userPrompt, schema);
    
    // Override the inferred locationName with the actual high-accuracy address returned from the APIs
    if (realAddress) {
      data.locationName = realAddress;
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Stage 3: Farming Plan Generation
 * Body: { season, goal, budget, sessionContext }
 */
router.post('/stage3/plan', async (req, res) => {
  const { season, goal, budget, sessionContext } = req.body;
  
  const userPrompt = `Based on the crop selection "${sessionContext?.stage1?.selectedCrop || 'Paddy'}", soil type "${sessionContext?.stage1?.soilType || 'Red Laterite'}", location "${sessionContext?.stage1?.locationName || 'India'}", and total land area of "${sessionContext?.stage2?.totalArea || 1} acres", generate a comprehensive organic sowing and layout plan for:
  - Season: ${season}
  - Farming Goal: ${goal}
  - Budget: ${budget || 'Not specified'} (INR)
  Provide precise row-to-row and plant-to-plant spacing in centimeters, plant population totals, direct transplanting details, and recommended smart organic tools with realistic Indian pricing. Keep visual maps text-based, detailed, and procedural.`;

  const schema = `{
    "seedType": {
      "variety": "specific variety name suitable for organic planting",
      "source": "where to source like local organic cooperative or state board",
      "daysToMaturity": "maturity days range",
      "yieldPotential": "expected yield per acre"
    },
    "plantingMethod": "string detailing SRI, transplanting, direct sowing, etc.",
    "plantingRationale": "why this planting method is selected based on soil type and crop",
    "layout": {
      "rows": 100,
      "cols": 100,
      "totalPlants": 10000
    },
    "spacing": {
      "rowToRow": "row to row spacing in cm/meters",
      "plantToPlant": "plant to plant spacing in cm",
      "depth": "planting depth in cm"
    },
    "sowingMethod": {
      "name": "sowing technique name",
      "pros": "pros for organic growth",
      "cons": "operational challenges"
    },
    "tools": [
      { "name": "agri tool product name", "spec": "specific specification", "priceRange": "price bracket like ₹1,200 - ₹1,800" }
    ]
  }`;

  try {
    const data = await runGeminiPrompt(sessionContext, userPrompt, schema);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Stage 4: Irrigation Setup Recommendations
 * Body: { waterSource, availability, powerSource, budget, sessionContext }
 */
router.post('/stage4/irrigate', async (req, res) => {
  const { waterSource, availability, powerSource, budget, sessionContext } = req.body;
  const userPrompt = `Formulate a comprehensive organic-compatible irrigation design and scheduling setup for the crop "${sessionContext?.stage1?.selectedCrop || 'Paddy'}" on a land area of "${sessionContext?.stage2?.totalArea || 1} acres". 
  
  Please evaluate the following environmental constraints and inputs:
  - Water Source: ${waterSource}
  - Water Availability / Reliability: ${availability}
  - Power Source / Constraint: ${powerSource}
  - Budget Limit: ${budget || 'Flexible'}
  - Planting Method & Layout context: ${sessionContext?.stage3?.plantingMethod || 'Standard'} with row-to-row spacing: ${sessionContext?.stage3?.spacing?.rowToRow || 'Not specified'}.

  Perform the following engineering and agronomic steps:
  1. Reason the daily crop water demand in "mm/day" based on the crop type, local soil type ("${sessionContext?.stage1?.soilType || 'Alluvial'}"), and cultivation season ("${sessionContext?.stage3?.season || 'Kharif'}"). State this mm/day demand clearly in the rationale.
  2. Compute precise Daily Water Volume required in Litres (incorporating the total land area of ${sessionContext?.stage2?.totalArea || 1} acres: 1 acre = 4047 sq.m, and crop water requirement depth in mm) and the corresponding Seasonal Water Volume in Litres assuming a standard 120-day cropping season.
  3. Formulate a complete Bill of Materials (BOM) for the irrigation setup. List components like main header pipes, lateral inline drip pipes (specifying diameter, emitter spacing like 30cm or 40cm, flow rate), filtration unit (mesh/screen filters to handle well/canal debris), pressure regulators, and appropriate pump size. Quantities must scale realistically to the acreage (e.g. 1 acre requires ~4000 meters of drip lines if spacing is 1m). Provide price ranges in Indian Rupees (INR).
  4. Specify Energy Sizing requirements: active pump power required in kW/HP. If the power source is "Solar", compute a specific PV panel array recommendation (number of panels, wattage, pump capacity). If "Grid", specify standard grid requirements. If "None", specify gravity-fed or siphon pressure specifications.`;

  const schema = `{
    "method": "recommended irrigation method like Drip, Surface, Sprinkler, Subsurface Drip, or Drone-spray",
    "rationale": "why this method fits the soil and water constraints. Must explicitly state the reasoned crop water demand in mm/day and why it matches the season",
    "components": [
      { "name": "component name (pumps, lateral drip lines, disc/screen filters, pressure regulators, control valves)", "spec": "pipe dimension, flow rating, pump HP, mesh size", "qty": "quantity with units like 400m, 1 unit, 4 pieces", "priceRange": "₹X - ₹Y" }
    ],
    "waterNeeds": {
      "litresPerDay": 15000,
      "litresPerSeason": 1800000,
      "frequency": "watering frequency like Daily, Alternate Days, or Twice Weekly"
    },
    "energyReq": {
      "powerNeeded": "kW or HP required for pump",
      "solarSizing": "solar panel counts, capacity like 2HP pump requires 6 panels of 330W, or gravity head/siphon details if power is None"
    }
  }`;

  try {
    const data = await runGeminiPrompt(sessionContext, userPrompt, schema);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Stage 5: Seeding & Seed Treatment Protocols
 * Body: { sessionContext }
 */
router.post('/stage5/seeding', async (req, res) => {
  const { sessionContext } = req.body;

  const userPrompt = `Provide a detailed organic seed treatment formulation and 14-day germination watch schedule for "${sessionContext?.stage1?.selectedCrop || 'Paddy'}" using organic ingredients (e.g. Trichoderma coating, cow urine/dung dip, Beejamrut prep) based on sowing method: "${sessionContext?.stage3?.sowingMethod?.name || 'SRI Nursery'}". Provide specialized local tool recommendations (drum drills, manual dibblers) with price ranges.`;

  const schema = `{
    "seedTreatment": {
      "name": "treatment recipe name like Beejamrut coating",
      "ingredients": "ingredients list with organic ratios",
      "process": "step-by-step preparation and application steps",
      "frequency": "when to treat",
      "dryingInstructions": "shade dry times and specs"
    },
    "sowingTools": [
      { "name": "tool product name", "spec": "weight, size, speed", "priceRange": "₹X - ₹Y" }
    ],
    "germinationPlan": [
      { "day": "Day X", "action": "specific check or application to make", "target": "desired target metric like 70% emergence" }
    ]
  }`;

  try {
    const data = await runGeminiPrompt(sessionContext, userPrompt, schema);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Stage 6: Crop Growth Breakpoint Checkup (Multimodal Supported)
 * Body: { breakpointId, answers, photo, sessionContext } (Answers is object of checked questions)
 */
router.post('/stage6/checkup', upload.single('photo'), async (req, res) => {
  const { breakpointId, answers, sessionContext } = req.body;
  const parsedAnswers = typeof answers === 'string' ? JSON.parse(answers) : answers;
  const parsedContext = typeof sessionContext === 'string' ? JSON.parse(sessionContext) : sessionContext;
  
  const userPrompt = `A farmer is submitting a growth checkup log at phase/breakpoint: ${breakpointId}. 
  User responses to health checkup:
  - Leaf appearance: ${parsedAnswers?.leafAppearance || 'Normal'}
  - Stem/Growth: ${parsedAnswers?.stemGrowth || 'Normal'}
  - Observed Pests: ${parsedAnswers?.pestsObserved || 'None'}
  
  Analyze the parameters, diagnose potential deficiencies or hazards organically, and formulate organic corrections (Jeevamrut ratios, mechanical control, pest barriers) complying with NPOP.`;

  const schema = `{
    "diagnosis": "AI assessment of the health and development phase of the crop",
    "organicFix": "detailed organic correction recipe to restore nutrients or suppress pests",
    "alertLevel": "Green, Yellow, or Red"
  }`;

  try {
    let data;
    if (req.file) {
      const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      data = await runGeminiVisionPrompt(parsedContext, userPrompt + "\nAnalyze the leaf/plant details shown in this image.", base64Image, schema);
    } else {
      data = await runGeminiPrompt(parsedContext, userPrompt, schema);
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Stage 7: Pest & Disease Independent Diagnosis (Multimodal Supported)
 * Body: { symptomText, photo, sessionContext }
 */
router.post('/stage7/diagnose', upload.single('photo'), async (req, res) => {
  const { symptomText, sessionContext } = req.body;
  const parsedContext = typeof sessionContext === 'string' ? JSON.parse(sessionContext) : sessionContext;

  const cropName = parsedContext?.stage1?.selectedCrop || "Paddy";
  const userPrompt = `The farmer is cultivating "${cropName}" and has requested an urgent organic diagnosis for symptoms: "${symptomText || 'unspecified spots/wilting'}".
  Provide a detailed diagnosis of the disease or pest affecting "${cropName}", specifying a confidence percentage. List three ranked organic treatments: Botanical, Biocontrol, and Cultural. Generate a structured 14-day spray schedule table and list local organic-friendly tools/sprayers.`;

  const schema = `{
    "pest": "name of pest or disease diagnosed",
    "confidence": 85,
    "affectedPart": "leaf, node, roots, collar, etc.",
    "spreadRisk": "Low, Medium, or High",
    "diagnosis": "brief explanation of what causes this and environmental triggers",
    "treatments": [
      {
        "type": "Botanical, Biocontrol, or Cultural",
        "name": "treatment name like Neem Oil 10,000 PPM",
        "dose": "dose per litre of water like 5ml/L",
        "preparation": "detailed preparation and spraying steps",
        "costEstimate": "₹X - ₹Y per acre"
      }
    ],
    "schedule": [
      { "day": "Day X", "treatment": "treatment name", "dose": "5ml/L", "method": "mist foliar spray, soil drench, etc.", "interval": "spray frequency" }
    ],
    "products": [
      { "name": "product commercial name", "spec": "active spores, purity %", "price": "₹X per pack", "source": "where to buy like IFFCO, KRIBHCO" }
    ]
  }`;

  try {
    let data;
    if (req.file) {
      const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      data = await runGeminiVisionPrompt(parsedContext, userPrompt + "\nInspect the leaf and crop lesions in this image.", base64Image, schema);
    } else {
      data = await runGeminiPrompt(parsedContext, userPrompt, schema);
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Stage 8: Harvest Readiness Assessment (Multimodal Supported)
 * Body: { das, intendedUse, photo, sessionContext }
 */
router.post('/stage8/harvest', upload.single('photo'), async (req, res) => {
  const { das, intendedUse, sessionContext } = req.body;
  const parsedContext = typeof sessionContext === 'string' ? JSON.parse(sessionContext) : sessionContext;

  const userPrompt = `Evaluate the harvest readiness of "${parsedContext?.stage1?.selectedCrop || 'Paddy'}" at ${das} Days After Sowing (DAS) for the primary target: "${intendedUse}". 
  Provide a readiness color badge, a 4-point maturity checklist with pass/warning flags, a mandatory Pre-Harvest Spray interval alert (recommending only organic/none), a yield estimate based on area "${parsedContext?.stage2?.totalArea || 1} acres", and harvesting products (cutters, threshers).`;

  const schema = `{
    "readiness": "Ready, Almost Ready, or Not Ready",
    "rationale": "AI reasoning detailing grain moisture, straw condition, and DAS metrics",
    "checklist": [
      { "criterion": "maturity feature like grain hardness, husk color", "status": "Pass or Warning", "value": "measured parameter detail" }
    ],
    "preHarvestSpray": {
      "product": "organic spray like sour buttermilk or None",
      "dose": "ml/L",
      "phi": 0
    },
    "yieldEstimate": {
      "expectedYield": "X quintals/kgs",
      "typicalYield": "Y quintals/kgs",
      "gapAnalysis": "why it exceeds or drops from regional standards based on previous stages"
    },
    "products": [
      { "name": "harvest cutter/thresher product", "spec": "HP, capacity", "price": "₹X", "source": "dealer or co-op" }
    ]
  }`;

  try {
    let data;
    if (req.file) {
      const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      data = await runGeminiVisionPrompt(parsedContext, userPrompt + "\nVerify husk color, node dryness, and panicle bends in this image.", base64Image, schema);
    } else {
      data = await runGeminiPrompt(parsedContext, userPrompt, schema);
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Stage 9: Post-Harvest Storage Protocol
 * Body: { storageType, duration, targetUse, sessionContext }
 */
router.post('/stage9/storage', async (req, res) => {
  const { storageType, duration, targetUse, sessionContext } = req.body;

  const userPrompt = `Formulate organic post-harvest storage specifications for "${sessionContext?.stage1?.selectedCrop || 'Paddy'}" crop harvest:
  - Storage Type: ${storageType}
  - Intended Duration: ${duration}
  - Target Audience: ${targetUse}
  Include exact temperature and moisture boundary safety margins, ranked organic-preservation layering techniques (dried neem layering, PICS hermetic bags, sweet flag powders), three-tier quality grading criteria, packing bags based on sales channel, and a detailed collapsible seed saving protocol. Provide storage product specs.`;

  const schema = `{
    "conditions": {
      "tempMin": 15,
      "tempMax": 25,
      "humidityMin": 50,
      "humidityMax": 60,
      "ventilation": "ventilation rules and timing"
    },
    "treatments": [
      { "treatment": "layering name", "application": "detailed mixing ratio and layering instructions", "duration": "protective duration", "costPerQuintal": "₹X" }
    ],
    "grading": [
      { "grade": "Grade A, B, or C", "criteria": "moisture %, broken seeds %, cleanliness", "action": "selling target recommended" }
    ],
    "packaging": [
      { "channel": "Retail, Mandi, or Export", "material": "Kraft paper zipper pouch, HDPE bag, jute sack", "priceRange": "₹X - ₹Y" }
    ],
    "seedProtocol": {
      "selection": "seed crop plant selection rules",
      "drying": "moisture and sun-drying specifications",
      "container": "optimal air-tight storage seed bins",
      "labelling": "label format fields"
    },
    "products": [
      { "name": "storage tech meter, hermetic bag", "spec": "pin count, size, sensor type", "price": "₹X", "source": "where to buy" }
    ]
  }`;

  try {
    const data = await runGeminiPrompt(sessionContext, userPrompt, schema);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Stage 10: Market Price Comparison & Sales Channel Optimization
 * Body: { quantity, grade, sessionContext }
 */
router.post('/stage10/market', async (req, res) => {
  const { quantity, grade, sessionContext } = req.body;

  const userPrompt = `Formulate the sales optimization analysis for "${sessionContext?.stage1?.selectedCrop || 'Paddy'}" crop harvested at "${sessionContext?.stage1?.locationName || 'Nalgonda, India'}":
  - Total Quantity: ${quantity || 20} Quintals
  - Selected Batch Grade: ${grade || 'Grade A (Premium)'}
  Compile a sortable APMC Mandi price comparison table displaying local regional mandis vs organic central hubs, an Organic Premium Calculator estimating net earnings, channel pros/cons (Kirana vs Direct WhatsApp vs ONDC digital), and a detailed PGS-India Group Certification pathway to enable farmers to stamp their bags with the official PGS Organic green logo.`;

  const schema = `{
    "prices": [
      { "marketName": "name of local Mandi or cooperative", "distance": "distance in km", "conventionalPrice": 2000, "organicPremium": 2600, "bestFor": "pros for this mandi" }
    ],
    "bestMarket": {
      "name": "recommended sales split or mandi",
      "rationale": "AI reasoning based on grade and distance"
    },
    "earnings": {
      "conventionalEarnings": 40000,
      "organicEarnings": 52000,
      "netPremiumGained": 12000
    },
    "channels": [
      { "channelName": "ONDC, Retail, Mandi", "pros": "logistics/profit benefits", "cons": "packing/commissions limits" }
    ],
    "packaging": [
      { "channel": "selling channel name", "requirement": "packaging bag and stamping rule" }
    ],
    "certSteps": [
      { "step": "step name", "authority": "approving authority", "duration": "completion times", "cost": "fees in ₹ or Free", "details": "NPOP/PGS execution details" }
    ]
  }`;

  try {
    const data = await runGeminiPrompt(sessionContext, userPrompt, schema);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
