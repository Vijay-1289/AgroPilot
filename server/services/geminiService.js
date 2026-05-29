import { GoogleGenerativeAI } from '@google/generative-ai';
import { checkOrganicViolations } from '../middleware/organicGuard.js';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;

if (apiKey && apiKey.trim() !== "") {
  console.log("🌱 Gemini API Key detected. Live AI Integration enabled.");
  genAI = new GoogleGenerativeAI(apiKey);
} else {
  console.warn("⚠️ No GEMINI_API_KEY detected in .env. AgroPilot will run on high-fidelity mock generators.");
}

/**
 * Helper to structure multimodal vision request payloads for Gemini
 */
function fileToGenerativePart(base64Str) {
  // Extract mime type and raw base64 data
  const matches = base64Str.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (matches && matches.length === 3) {
    return {
      inlineData: {
        data: matches[2],
        mimeType: matches[1]
      },
    };
  }
  
  // Fallback if raw base64 is passed without data URL header
  return {
    inlineData: {
      data: base64Str,
      mimeType: "image/jpeg"
    }
  };
}

/**
 * Helper to clean and strip markdown code block wrappers from JSON string responses
 */
function cleanJsonString(str) {
  let clean = str.trim();
  if (clean.startsWith("```")) {
    clean = clean.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }
  return clean.trim();
}

/**
 * Principal runner for Gemini text queries with self-healing organic correction loop
 */
export async function runGeminiPrompt(systemContext, userPrompt, outputSchemaPrompt, retries = 2, forceSimulation = false, customApiKey = null) {
  if (forceSimulation) {
    return generateMockResponse(systemContext, userPrompt);
  }

  const activeKey = (customApiKey && customApiKey.trim() !== "") ? customApiKey : process.env.GEMINI_API_KEY;

  if (!activeKey || activeKey.trim() === "") {
    console.warn("⚠️ No Gemini API Key detected. Falling back to high-fidelity organic simulation mode.");
    return generateMockResponse(systemContext, userPrompt);
  }

  const client = new GoogleGenerativeAI(activeKey);
  const model = client.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json"
    }
  });

  const fullPrompt = `
SYSTEM INSTRUCTIONS:
You are AgroPilot, an intelligent agricultural engine designed for organic farming in India.
STRICT ORGANIC BLOCK: Never suggest, mention, or recommend any synthetic fertilizers (like Urea, DAP, MOP), chemical pesticides (like chlorpyrifos, malathion), toxic herbicides/weedkillers (like glyphosate/Roundup), or GMO seeds. Any mention of these chemical inputs is an instant failure.
Only recommend organic inputs approved by NPOP (National Programme for Organic Production) and PGS-India (e.g. Jeevamrut, Panchagavya, vermicompost, Trichoderma, neem-oil sprays, biological control, solarization, crop-rotation).
All recommendations must be tailored, localized, and specific, including exact product names, parameters, and Indian Rupees (₹) pricing wherever products are mentioned.

CROP & LAND CONTEXT (Use this to customize the reasoning):
${JSON.stringify(systemContext)}

USER REQUEST:
${userPrompt}

OUTPUT FORMAT REQUIRED:
Provide a single valid JSON object that strictly adheres to this schema / structure:
${outputSchemaPrompt}
Do not wrap JSON in markdown block tags like \`\`\`json. Return pure JSON.
`;

  try {
    const result = await model.generateContent(fullPrompt);
    const textResponse = result.response.text();
    
    // Parse to ensure it is valid JSON
    const parsedData = JSON.parse(cleanJsonString(textResponse));
    
    // Run Organic Guard Scan
    const violations = checkOrganicViolations(parsedData);
    if (violations.length > 0) {
      console.warn(`⚠️ Organic violation caught on AI suggestion: ${violations.join(', ')}. Triggering self-correction loop.`);
      if (retries > 0) {
        const correctivePrompt = `Your previous response suggested: ${violations.join(', ')}. This is STRICTLY FORBIDDEN under organic NPOP guidelines. Correct this immediately. Re-synthesis this request with 100% organic-compliant alternatives (e.g. Jeevamrut instead of chemical nitrogen, neem formulations instead of synthetic pesticides, certified organic local varieties). Return the output in the same exact JSON schema.`;
        return await runGeminiPrompt(systemContext, correctivePrompt + "\n" + userPrompt, outputSchemaPrompt, retries - 1, forceSimulation, customApiKey);
      } else {
        console.warn("⚠️ Retries exhausted. Falling back to high-fidelity organic simulation mode.");
        return generateMockResponse(systemContext, userPrompt);
      }
    }
    
    return parsedData;
  } catch (error) {
    console.error("💥 Gemini API error:", error);
    if (retries > 0) {
      console.log("Retrying API call...");
      return await runGeminiPrompt(systemContext, userPrompt, outputSchemaPrompt, retries - 1, forceSimulation, customApiKey);
    }
    // Throw the actual error so the user can debug their key or GC project restrictions
    throw error;
  }
}

/**
 * Multimodal vision prompt runner for Gemini Vision
 */
export async function runGeminiVisionPrompt(systemContext, userPrompt, base64Image, outputSchemaPrompt, forceSimulation = false, customApiKey = null) {
  if (forceSimulation) {
    return generateMockResponse(systemContext, "vision_disease_harvest_check");
  }

  const activeKey = (customApiKey && customApiKey.trim() !== "") ? customApiKey : process.env.GEMINI_API_KEY;

  if (!activeKey || activeKey.trim() === "") {
    console.warn("⚠️ No Gemini API Key detected for Vision. Falling back to high-fidelity crop doctor simulation.");
    return generateMockResponse(systemContext, "vision_disease_harvest_check");
  }

  const client = new GoogleGenerativeAI(activeKey);
  const model = client.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json"
    }
  });

  const imagePart = fileToGenerativePart(base64Image);
  
  const textPrompt = `
SYSTEM INSTRUCTIONS:
You are the AgroPilot computer-vision crop diagnostic engine.
Perform organic-only agricultural diagnosis from the uploaded image.
STRICT BLOCK: Never recommend synthetic chemical fertilizers, pesticides, or herbicides. All treatments must be organic, herbal, botanical, biological, or cultural in accordance with NPOP guidelines.
Always include detailed, specific products, dosage ratios (e.g. mL per Litre), application processes, and price brackets in Indian Rupees (₹).

CROP CONTEXT:
${JSON.stringify(systemContext)}

USER REQUEST:
${userPrompt}

OUTPUT FORMAT REQUIRED:
Provide a single valid JSON object that strictly adheres to this schema / structure:
${outputSchemaPrompt}
`;

  try {
    const result = await model.generateContent([textPrompt, imagePart]);
    const responseText = result.response.text();
    const parsedData = JSON.parse(cleanJsonString(responseText));
    
    // Check organic safety
    const violations = checkOrganicViolations(parsedData);
    if (violations.length > 0) {
      console.warn(`⚠️ Organic violation in Vision response: ${violations.join(', ')}. Falling back to high-fidelity crop doctor simulation.`);
      return generateMockResponse(systemContext, "vision_disease_harvest_check");
    }
    
    return parsedData;
  } catch (error) {
    console.error("💥 Gemini Vision API error:", error);
    // Throw the actual error so the user can debug their key or GC project restrictions
    throw error;
  }
}

/**
 * HIGH-FIDELITY AGRICULTURAL MOCK GENERATOR
 * Returns rich, crop-specific, hyper-localized data for all stages in India context.
 */
function generateMockResponse(context, queryType) {
  const crop = context?.selectedCrop || context?.stage1?.selectedCrop || "Paddy";
  const soil = context?.soilType || context?.stage1?.soilType || "Alluvial Soil";
  const area = context?.area || context?.stage2?.totalArea || 1.2;
  const areaUnit = context?.areaUnit || context?.stage2?.areaUnit || "acres";
  
  // Normalize area to acres
  let acres = parseFloat(area) || 1.0;
  if (areaUnit === 'hectares') acres = acres * 2.471;
  if (areaUnit === 'sqm') acres = acres / 4047.0;
  acres = Math.round(acres * 100) / 100;

  console.log(`📋 Generating High-Fidelity Organic Mock for [${crop}] on [${soil}] for [${acres} Acres]`);

  // STAGE 1 Soil & Crop Lookup Mock
  if (queryType.includes("Latitude:") || queryType.includes("coordinates") || queryType.includes("soilPH")) {
    const latVal = parseFloat(context?.lat) || 17.3850;
    const lngVal = parseFloat(context?.lng) || 78.4867;
    
    // Deterministic selection seed based on coordinates to guarantee a unique, stable experience per location click
    const coordinateHash = Math.abs(Math.sin(latVal * 12.9898) * Math.cos(lngVal * 78.233)) * 43758.5453;
    const profileIndex = Math.floor(coordinateHash) % 6;

    // Define 6 highly curated, hyper-localized premium organic soil profiles
    const profiles = [
      {
        soilType: "Black Cotton Soil (Regur)",
        soilPH: "7.3 - 8.1 (Slightly Alkaline)",
        suggestedCrops: [
          { name: "Organic Cotton", season: "Kharif", suitability: "94%", expectedYield: "8-10 quintals/acre" },
          { name: "Sorghum (Jowar)", season: "Rabi", suitability: "90%", expectedYield: "12-14 quintals/acre" },
          { name: "Chickpea (Bengal Gram)", season: "Rabi", suitability: "88%", expectedYield: "6-8 quintals/acre" },
          { name: "Soybean", season: "Kharif", suitability: "84%", expectedYield: "9-11 quintals/acre" },
          { name: "Pigeon Pea (Tur)", season: "Year-Round", suitability: "80%", expectedYield: "7-9 quintals/acre" }
        ]
      },
      {
        soilType: "Red Laterite Soil",
        soilPH: "5.8 - 6.5 (Slightly Acidic)",
        suggestedCrops: [
          { name: "Groundnut", season: "Rabi", suitability: "92%", expectedYield: "8-10 quintals/acre" },
          { name: "Ragi (Finger Millet)", season: "Kharif", suitability: "88%", expectedYield: "14-16 quintals/acre" },
          { name: "Turmeric", season: "Kharif", suitability: "85%", expectedYield: "18-22 quintals/acre" },
          { name: "Cashewnut", season: "Year-Round", suitability: "81%", expectedYield: "10-12 quintals/acre" },
          { name: "Tomato", season: "Year-Round", suitability: "78%", expectedYield: "120-150 quintals/acre" }
        ]
      },
      {
        soilType: "Rich Alluvial Loam",
        soilPH: "6.5 - 7.2 (Neutral)",
        suggestedCrops: [
          { name: "Paddy (Rice)", season: "Kharif", suitability: "96%", expectedYield: "22-26 quintals/acre" },
          { name: "Organic Wheat", season: "Rabi", suitability: "92%", expectedYield: "18-22 quintals/acre" },
          { name: "Mustard Seeds", season: "Rabi", suitability: "88%", expectedYield: "7-9 quintals/acre" },
          { name: "Sugarcane", season: "Year-Round", suitability: "85%", expectedYield: "320-360 quintals/acre" },
          { name: "Mung Bean (Green Gram)", season: "Zaid", suitability: "81%", expectedYield: "4-6 quintals/acre" }
        ]
      },
      {
        soilType: "Acidic Forest Loam",
        soilPH: "5.2 - 6.0 (Acidic)",
        suggestedCrops: [
          { name: "Ginger", season: "Kharif", suitability: "93%", expectedYield: "15-18 quintals/acre" },
          { name: "Cardamom", season: "Year-Round", suitability: "88%", expectedYield: "250-300 kg/acre" },
          { name: "Black Pepper", season: "Year-Round", suitability: "85%", expectedYield: "400-500 kg/acre" },
          { name: "Organic Tea", season: "Year-Round", suitability: "81%", expectedYield: "800-1000 kg/acre" },
          { name: "Pineapple", season: "Year-Round", suitability: "78%", expectedYield: "150-180 quintals/acre" }
        ]
      },
      {
        soilType: "Sandy Loam Soil (Dryland)",
        soilPH: "7.0 - 7.8 (Neutral to Slightly Alkaline)",
        suggestedCrops: [
          { name: "Pearl Millet (Bajra)", season: "Kharif", suitability: "95%", expectedYield: "10-12 quintals/acre" },
          { name: "Cluster Bean (Guar)", season: "Kharif", suitability: "90%", expectedYield: "6-8 quintals/acre" },
          { name: "Sesame (Til)", season: "Kharif", suitability: "86%", expectedYield: "3-5 quintals/acre" },
          { name: "Barley", season: "Rabi", suitability: "82%", expectedYield: "14-16 quintals/acre" },
          { name: "Tomato", season: "Year-Round", suitability: "79%", expectedYield: "90-110 quintals/acre" }
        ]
      },
      {
        soilType: "Coastal Sandy Alluvial",
        soilPH: "6.7 - 7.4 (Neutral)",
        suggestedCrops: [
          { name: "Coconut", season: "Year-Round", suitability: "97%", expectedYield: "6000-7000 nuts/acre" },
          { name: "Groundnut", season: "Rabi", suitability: "89%", expectedYield: "9-11 quintals/acre" },
          { name: "Black Gram", season: "Rabi", suitability: "86%", expectedYield: "5-7 quintals/acre" },
          { name: "Banana", season: "Year-Round", suitability: "83%", expectedYield: "140-160 quintals/acre" },
          { name: "Cowpea (Lobia)", season: "Zaid", suitability: "80%", expectedYield: "4-6 quintals/acre" }
        ]
      }
    ];

    // Select deterministic profile based on coords
    let selectedProfile = profiles[profileIndex];

    // Determine descriptive Location Name dynamically
    let locationName = context?.realAddress || `Agricultural Zone at Lat ${latVal.toFixed(4)}, Lng ${lngVal.toFixed(4)}`;
    
    // Address-specific overrides for a custom experience if specific state keywords are found
    if (context?.realAddress) {
      const lowerAddr = context.realAddress.toLowerCase();
      if (lowerAddr.includes("andhra pradesh") || lowerAddr.includes("ap")) {
        selectedProfile = profiles[2]; // Rich Alluvial Loam for AP
      } else if (lowerAddr.includes("karnataka")) {
        selectedProfile = profiles[0]; // Black Cotton Soil for Karnataka
      } else if (lowerAddr.includes("tamil nadu") || lowerAddr.includes("tamilnadu")) {
        selectedProfile = profiles[5]; // Coastal Sandy Alluvial for TN
      } else if (lowerAddr.includes("telangana")) {
        selectedProfile = profiles[1]; // Red Laterite for Telangana
      } else if (lowerAddr.includes("rajasthan") || lowerAddr.includes("gujarat")) {
        selectedProfile = profiles[4]; // Sandy Loam for Arid West
      } else if (lowerAddr.includes("assam") || lowerAddr.includes("himachal") || lowerAddr.includes("kerala")) {
        selectedProfile = profiles[3]; // Forest / Acidic Soil for Hill / Spice regions
      }
    }

    return {
      locationName,
      soilType: selectedProfile.soilType,
      soilPH: selectedProfile.soilPH,
      suggestedCrops: selectedProfile.suggestedCrops
    };
  }

  // STAGE 3 Sowing & Planting Plan Mock
  if (queryType.includes("organic sowing and layout") || queryType.includes("seedType") || queryType.includes("plantingRationale")) {
    const totalPlants = Math.round(acres * 22000);
    return {
      seedType: {
        variety: `Naveen Organic (Certified ${crop} Selection)`,
        source: "Telangana State Seed Development Corp (Organic Cell)",
        daysToMaturity: "115 - 125 days",
        yieldPotential: "22 quintals per acre"
      },
      plantingMethod: "System of Crop Intensification (SRI) Transplanting",
      plantingRationale: `Recommended for ${crop} in ${soil} to reduce water requirements by 35% while increasing root development and tillering potential.`,
      layout: {
        rows: Math.round(Math.sqrt(totalPlants)),
        cols: Math.round(Math.sqrt(totalPlants)),
        totalPlants: totalPlants
      },
      spacing: {
        rowToRow: "25 cm",
        plantToPlant: "25 cm",
        depth: "2.5 cm"
      },
      sowingMethod: {
        name: "Mat Nursery preparation followed by single seedling transplanting",
        pros: "Minimal seed rate (2kg/acre vs 20kg traditional), healthy root setup, stronger tillers",
        cons: "Labour intensive during day 12-15 transplanting window"
      },
      tools: [
        { name: "Marking frame (wooden/iron grid)", spec: "25x25 cm grid spacing marker", priceRange: "₹450 - ₹650" },
        { name: "Manual Cono Weeder", spec: "Twin-rotor weed cultivator for wet fields", priceRange: "₹1,200 - ₹1,800" },
        { name: "Seedling tray transplanter", spec: "Handheld single row seedling inserter", priceRange: "₹950 - ₹1,300" }
      ]
    };
  }

  // STAGE 4 Irrigation Mock
  if (queryType.includes("irrigation design") || queryType.includes("waterNeeds") || queryType.includes("transpiration")) {
    const dailyWater = Math.round(acres * 15000);
    const seasonWater = Math.round(dailyWater * 120);
    
    return {
      method: "Alternate Wetting and Drying (AWD) Drip Irrigation System",
      rationale: `Optimal for organic ${crop} cultivation in Red Laterite soil. Conserves 30% water, mitigates methane emissions, and maintains soil aerobic activity crucial for organic bio-fertilizer absorption.`,
      components: [
        { name: "Inline Drip Lateral Pipe", spec: "16mm, Class 2, 30cm emitter spacing, 1.6 LPH flow rate", qty: `${Math.round(acres * 400)} meters`, priceRange: "₹2,400 - ₹3,200" },
        { name: "Screen Filter Unit", spec: "120 mesh screen, 2-inch inlet-outlet, 25 m³/hr flow rate", qty: "1 unit", priceRange: "₹1,200 - ₹1,850" },
        { name: "Solar Water Pump System", spec: "2 HP DC Submersible pump + 1800W Solar PV panel arrays", qty: "1 set", priceRange: "₹24,000 - ₹35,000" },
        { name: "Pressure Regulator Valves", spec: "1.0 bar pressure preset, 1-inch threaded", qty: "2 units", priceRange: "₹400 - ₹600" },
        { name: "PVC Main Header Pipes", spec: "63mm outer diameter, 4 kg/cm² pressure rating", qty: `${Math.round(acres * 30)} meters`, priceRange: "₹1,500 - ₹2,200" }
      ],
      waterNeeds: {
        litresPerDay: dailyWater,
        litresPerSeason: seasonWater,
        frequency: "Once every alternate day (Maintain AWD field gauge)"
      },
      energyReq: {
        powerNeeded: "1.5 kW",
        solarSizing: "6 panels of 335W each (TADA certified)"
      }
    };
  }

  // STAGE 5 Seeding preparation Mock
  if (queryType.includes("seed treatment formulation") || queryType.includes("germination watch schedule") || queryType.includes("germinationPlan")) {
    return {
      seedTreatment: {
        name: "Beejamrut Organic Microbial Seed Coating",
        ingredients: "2.5kg Seeds + 100g Trichoderma viride + 500mL Cow Urine + 500g Cow Dung + 20g Slaked Lime + 5L Water",
        process: "Mix ingredients thoroughly. Dip seeds or coat them by rubbing gently. Shade dry for 30-40 minutes before sowing. Do not dry in direct sunlight.",
        frequency: "One-time pre-sowing treatment",
        dryingInstructions: "Shade dry on a clean gunny bag until seed moisture content stabilizes at ~12% before planting."
      },
      sowingTools: [
        { name: "SRI Marker Frame", spec: "Adjustable wooden roller grid for perfect spacing markers", priceRange: "₹500 - ₹750" },
        { name: "Handheld seed planter gun", spec: "Spring-loaded single seed planter with depth nozzle", priceRange: "₹450 - ₹650" }
      ],
      germinationPlan: [
        { day: "Day 0", action: "Nursery bed sowing under light straw mulch cover", target: "Uniform seed soil contact" },
        { day: "Day 2", action: "Sprinkle liquid Jeevamrut dilute solution (1:10 ratio)", target: "Activate seed microbes" },
        { day: "Day 4", action: "Remove straw cover carefully as early coleoptiles emerge", target: "50% early emergence target" },
        { day: "Day 7", action: "Perform visual count for seed viability test", target: "Maintain >85% germination rate" },
        { day: "Day 10", action: "Light weed handpicking and watering", target: "Nursery weed suppression" },
        { day: "Day 14", action: "Assess seedling height (~15cm) and tiller thickness", target: "Ready for SRI transplanting" }
      ]
    };
  }

  // STAGE 6 & 7 Crop Growth Monitoring & Disease diagnosis Mock
  if (queryType.includes("checkup") || queryType.includes("diagnose") || queryType.includes("vision") || queryType.includes("symptom") || queryType.includes("spreadRisk") || queryType.includes("organicFix")) {
    return {
      pest: `Organic Nutrient Deficiencies & ${crop} Blast Disease (Magnaporthe oryzae)`,
      confidence: 88,
      affectedPart: "Leaves and upper node collars",
      spreadRisk: "Medium-High (Weather dependent: high humidity accelerates)",
      diagnosis: `Identified initial signs of leaf blast spots alongside mild leaf-yellowing indicating low organic nitrogen levels in ${soil}.`,
      treatments: [
        {
          type: "Botanical Spray",
          name: "Neem Oil 10,000 PPM Formulation",
          dose: "5 mL per Litre of water",
          preparation: "Emulsify 50mL Neem oil with 10mL liquid soap/Karanj soap in 10L water. Shake vigorously. Spray early morning.",
          costEstimate: "₹250 - ₹400 per Acre"
        },
        {
          type: "Biocontrol Solution",
          name: "Pseudomonas fluorescens Bio-fungicide",
          dose: "10 grams per Litre of water",
          preparation: "Mix 100g Pseudomonas powder with 10L warm water. Let stand for 30 minutes to activate bacteria. Spray on leaves.",
          costEstimate: "₹180 - ₹300 per Acre"
        },
        {
          type: "Cultural Remedy",
          name: "Jeevamrut Foliar Nourishment & Infected Pruning",
          dose: "200 Litres Jeevamrut liquid per Acre",
          preparation: "Filter fermented Jeevamrut through double cotton cloth. Mix 20L filtrate in 180L water. Apply as liquid foliar spray.",
          costEstimate: "₹50 - ₹100 per Acre (Self-made)"
        }
      ],
      schedule: [
        { day: "Day 1", treatment: "Neem Oil 10,000 PPM foliar spray", dose: "5ml/L", method: "Foliar mist spray during cool morning hours", interval: "Immediate" },
        { day: "Day 7", treatment: "Pseudomonas fluorescens Bio-fungicide spray", dose: "10g/L", method: "Targeted under-leaf spray", interval: "6 days after botanical" },
        { day: "Day 14", treatment: "Filtered Jeevamrut nourishing foliar spray", dose: "10% solution", method: "General crop canopy wash", interval: "7 days after biocontrol" }
      ],
      products: [
        { name: "EPL Certified Neem Oil 10k PPM", spec: "Pure cold-pressed azadirachtin formulation", price: "₹240 per 250ml", source: "IFFCO Farmer Center / Local Dealer" },
        { name: "BioShield Pseudomonas Powder", spec: "Highly active spore concentration (2x10^9 CFU/g)", price: "₹150 per 500g", source: "KRIBHCO Cooperative Store" }
      ],
      organicFix: "Spray 5% Neem Seed Kernel Extract (NSKE) + apply 200L/acre Jeevamrut to soil immediately.",
      alertLevel: "Yellow"
    };
  }

  // STAGE 8 Harvest Mock
  if (queryType.includes("harvest readiness") || queryType.includes("maturity checklist") || queryType.includes("yieldEstimate")) {
    return {
      readiness: "Almost Ready",
      rationale: `The crop is at ${context.das || 110} Days After Sowing. Maturity indices show 85% grains have turned golden brown, and moisture levels are nearing the safe harvesting bracket of 14-16%.`,
      checklist: [
        { criterion: "Husk Colouration", status: "Pass", value: "85% golden yellow husk observed" },
        { criterion: "Grain Hardness Test", status: "Pass", value: "Grains are firm and break with a clean snap under tooth pressure" },
        { criterion: "Straw Dryness", status: "Warning", value: "Lower stem nodes still hold 30% green moisture (Wait 4 more days)" },
        { criterion: "Leaf Senescence", status: "Pass", value: "Flag leaves are completely dry and yellowed" }
      ],
      preHarvestSpray: {
        product: "None Required (100% Organic Pure Sowing)",
        dose: "N/A",
        phi: 0
      },
      yieldEstimate: {
        expectedYield: `${Math.round(acres * 21)} Quintals (Total expected)`,
        typicalYield: `${Math.round(acres * 19)} Quintals (Regional average)`,
        gapAnalysis: "Positive gap (+2 quintals/acre above average). Attributed to healthy tiller activation through SRI spacing and timely bio-spray application."
      },
      products: [
        { name: "Manual Organic Rice Reaper / Cutter", spec: "Handheld petrol operated crop cutter, 1.5HP", price: "₹12,000 - ₹16,500", source: "AgriKart India" },
        { name: "Tractor-mounted Multi-crop Thresher", spec: "High purity threshing, 35HP requirement", price: "₹1,80,000 - ₹2,40,000", source: "Mahindra Tractor Dealers" }
      ]
    };
  }

  // STAGE 9 Storage Mock
  if (queryType.includes("post-harvest storage") || queryType.includes("seedProtocol") || queryType.includes("ventilation")) {
    return {
      conditions: {
        tempMin: 15,
        tempMax: 25,
        humidityMin: 50,
        humidityMax: 60,
        ventilation: "Keep doors closed during high-humidity morning hours. Run exhaust fans between 12 PM - 3 PM to evacuate internal hot air."
      },
      treatments: [
        { treatment: "Neem Leaf Organic Preservation Layering", application: "Spread 2-inch layer of dried, shade-cured neem leaves at the bottom of the bin and in alternate 1-foot grain layers.", duration: "Up to 6 months", costPerQuintal: "₹15 - ₹25" },
        { treatment: "PICS Hermetic Bag Storage", application: "Pack dried grain (moisture <13%) in PICS triple-layer hermetic bags. Seal each layer independently to create oxygen-deprived storage.", duration: "Up to 18 months", costPerQuintal: "₹75 - ₹90 (Reusable bag)" },
        { treatment: "Organic Sweet Flag (Vacha) Powder Mix", application: "Mix 100g of dry sweet flag rhizome powder per quintal of grain before bag packing. Protects against weevils.", duration: "Up to 12 months", costPerQuintal: "₹40 - ₹60" }
      ],
      grading: [
        { grade: "Grade A (Premium)", criteria: "Moisture <13.5%, Zero insect damage, uniform size, fully polished/dehusked, >98% purity", action: "Target for organic premium APMC or direct WhatsApp/ONDC consumer delivery." },
        { grade: "Grade B (Standard)", criteria: "Moisture 13.5-15%, <2% broken grains, zero living weevils, 95% purity", action: "Sell at state level APMC to organic cooperative distributors." },
        { grade: "Grade C (Utility)", criteria: "Moisture >15%, >2% broken, mild discoloration, <90% purity", action: "Damp-dry further. Redirect for home consumption or organic poultry/livestock feed mill feed." }
      ],
      packaging: [
        { channel: "ONDC / Direct Retail", material: "Biodegradable Kraft Paper bags with clear window, 5kg size", priceRange: "₹8 - ₹12 per bag" },
        { channel: "State APMC / Wholesaler", material: "Food-grade high density jute sacks, 50kg capacity", priceRange: "₹35 - ₹48 per bag" }
      ],
      seedProtocol: {
        selection: "Select grains from the healthiest crop rows center. Avoid border plants.",
        drying: "Sun dry on clean tarpaulin until grain moisture drops below 11.5% (crumbles on bite, does not paste).",
        container: "Pack in airtight clay pots sealed with cow-dung-lime paste or hermetic PICS bags.",
        labelling: "Crop variety, harvest date, germination rate (tested: >88%), storage date, bag number."
      },
      products: [
        { name: "Digital Pin-type Grain Moisture Meter", spec: "LCD calibration for Paddy, Maize, Wheat, range 8-30%", price: "₹2,200 - ₹3,500", source: "Amazon Business" },
        { name: "PICS Hermetic Bags (50kg)", spec: "3-layer HDPE gas-impermeable bags, FDA approved", price: "₹85 per bag", source: "Local cooperative stores" }
      ]
    };
  }

  // STAGE 10 Market Mock
  if (queryType.includes("sales optimization") || queryType.includes("conventionalEarnings") || queryType.includes("PGS-India Group")) {
    return {
      prices: [
        { marketName: "Nalgonda District APMC", distance: "6 km", conventionalPrice: 1950, organicPremium: 2350, bestFor: "Bulk volumes, immediate cash payment" },
        { marketName: "Hyderabad Central Grains APMC", distance: "78 km", conventionalPrice: 2100, organicPremium: 2850, bestFor: "High-grade premium organic batches" },
        { marketName: "ONDC Agri-Portal Direct", distance: "N/A", conventionalPrice: 2200, organicPremium: 3400, bestFor: "Retail-packed Grade A batches in 5kg bags" },
        { marketName: "Local Organic Cooperative Group", distance: "12 km", conventionalPrice: 1900, organicPremium: 2500, bestFor: "Rabi season contracts and seeds" }
      ],
      bestMarket: {
        name: "ONDC Agri-Portal + Hyderabad Central APMC split",
        rationale: `Sell 30% of your premium Grade A yield packed in 5kg eco-kraft bags on ONDC to realize the highest margin (₹3,400/quintal). Dispatch the remaining 70% bulk volume to Hyderabad Central APMC to fetch ₹2,850/quintal with instant digital cooperative clearing.`
      },
      earnings: {
        conventionalEarnings: Math.round(acres * 21 * 2000),
        organicEarnings: Math.round(acres * 21 * 2900),
        netPremiumGained: Math.round(acres * 21 * 900)
      },
      channels: [
        { channelName: "Local APMC Mandi", pros: "Immediate cash settlement, zero packing requirements", cons: "Minimal organic premium appreciation (~10-15%)" },
        { channelName: "ONDC e-Commerce", pros: "Maximized profit margins (+50-70% over conventional), brand ownership", cons: "Requires consumer packing, logistics delay, mandatory organic grading certificate" },
        { channelName: "Organic Cooperative Federation", pros: "Guaranteed buyback contract, subsidized logistics", cons: "Slightly lower pricing than direct ONDC retail" }
      ],
      packaging: [
        { channel: "Mandi Selling", requirement: "Standard 50kg double-stitched jute bags, plain blue ink stenciled labels." },
        { channel: "Retail Selling", requirement: "5kg handle bags, standup zipper pouch with organic PGS logo, batch number, and farmer details." }
      ],
      certSteps: [
        { step: "1. Join Local PGS Group", authority: "District Agricultural Extension Office", duration: "1 week", cost: "Free", details: "Form a group of minimum 5 regional organic farmers. Elect a group leader and register under the PGS-India portal." },
        { step: "2. Peer Appraisal Verification", authority: "Local PGS Peer Committee", duration: "1 day", cost: "Free", details: "A neighboring peer farmer visits your plot to inspect zero-chemical logs, weed management compost bins, and border cropping." },
        { step: "3. Scope Certificate Issuance", authority: "PGS Regional Council", duration: "3-4 weeks", cost: "Free", details: "PGS portal issues a 'PGS-Green' conversion certificate, validating your produce as 'In-conversion to Organic'." },
        { step: "4. Full Organic Status PGS Logo", authority: "Ministry of Agriculture, India", duration: "36 months", cost: "Free", details: "Upon completing three successful years of peer appraisals and continuous organic logs, your farm is certified 100% Organic, unlocking direct PGS-Organic green logo stamping." }
      ]
    };
  }

  // Fallback default
  return {
    success: true,
    message: "High-fidelity default organic details compiled for " + crop
  };
}
