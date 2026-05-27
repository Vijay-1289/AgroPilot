# 🌾 AgroPilot — Premier Organic Agricultural Advisor

AgroPilot is a state-of-the-art client-side organic farming assistant engineered to guide Indian farmers through a high-fidelity, ten-stage seasonal cultivation roadmap. Tailored specifically to Indian agronomic conditions, AgroPilot combines advanced AI reasoning, geographic data, and interactive engineering tools to automate soil diagnostic calculations, irrigation pipeline sizing, bio-pest control, hermetic storage protocols, and market price comparisons.

AgroPilot is built from the ground up to be **100% compliant with NPOP (National Programme for Organic Production) and PGS-India guidelines**. It strictly filters and flags synthetic fertilizers, chemical pesticides, and herbicides, recommending only verified botanical, biocontrol, and organic practices.

---

## 🌟 Premium Features

*   **🔒 Client-Side Bring Your Own Key (BYOK)**
    An elegant, glassmorphic settings modal allows users to paste and verify their custom Google Gemini API keys via a dedicated verification ping endpoint (`/api/check-key`). Stored locally in a persisted Zustand store, the system automatically injects user keys into incoming API requests to unlock unlimited agricultural queries.
*   **⚡ Unlimited Sizing Token Theme**
    Activating a custom key seamlessly transitions the UI's progress bars into a glowing Purple-to-Indigo theme, displaying `⚡ BYOK Active: ∞ Unlimited` seasonal token capacity.
*   **🚨 AI Capacity Exhausted Overlay**
    If the seasonal trial allocation runs out (100,000 baseline tokens), a gorgeous glassmorphic warning overlay intercepts the interface. Users can instantly recharge with +50k free tokens, bypass via local simulation mode, or connect their own custom API key.
*   **💫 Glassmorphic AI Loader**
    A pulsing, glowing full-screen spinner with dynamic, stage-specific synthesis messages is rendered during live Gemini queries to keep the user engaged during intensive agronomic calculations.
*   **📥 Centralized Progressive Exporter**
    Integrated seamlessly across Stages 3 through 10, a dedicated secondary button allows the instant downloading of dynamically generated, NPOP-compliant draft reports formatted in Markdown (.MD).

---

## 🗺️ The 10-Stage Seasonal Roadmap

AgroPilot leads farmers through ten progressive, data-rich phases:

```
[1. Soil Profiling] ➔ [2. Land Boundary] ➔ [3. Sowing Plan] ➔ [4. Irrigation Sizing] ➔ [5. Seed Coating]
                                                                                ↓
[10. Mandi Analytics] 🖚 [9. Hermetic Storage] 🖚 [8. Maturity Check] 🖚 [7. Crop Doctor] 🖚 [6. Growth Audit]
```

### 1. Soil & Crop Adaptability
- Captures physical geographic coordinates (lat/lng).
- Reverse-geocodes high-accuracy locations using dynamic fallbacks (Geoapify, Nominatim, BigDataCloud).
- Infers regional soil profiles (pH, organic matter %, sandy/clay classification) and suggests the top 5 organic crops suitable for the active season.

### 2. High-Accuracy Land Measurement
- Interactive map interface allowing farmers to draw boundary nodes.
- Computes perimeter, centroid, side lengths, and total area scaling automatically in Acres, Hectares, or Square Meters.

### 3. Sowing & Planting Plan
- Formulates row-to-row and plant-to-plant spacing in centimeters based on crop size and SRI methods.
- Sizing of total plant populations and recommended local tools (Cono weeders, drum drills) with real Indian market pricing.

### 4. Engineered Micro-Irrigation Setup
- Dynamically reasons daily water demand (mm/day) against soil classification and seasonal evapotranspiration rates.
- Computes total daily and seasonal water volume in liters.
- Generates a customized Bill of Materials (BOM) detailing pipes, inline lateral drips (spacing, flow rates), filtration units, pressure regulators, and solar PV panel array array configurations.

### 5. Seeding & Seed Treatment Protocols
- Organic treatment formulations (Beejamrut, Trichoderma, cow dung/urine dip) to prevent soil-borne pathogens.
- Compiles a strict 14-day germination watch schedule with daily targets.

### 6. Growth Monitoring & Breakpoints
- Calibrated physiological baseline audits across 5 critical growth phases.
- Dropdown-only interface enabling farmers to audit single checkpoints, skip phases, or run automated parallel auto-scouting across all growth boundaries.

### 7. Emergency Crop Doctor (Independent Diagnostician)
- Accessible on-demand via a slide-over red warning panel from any stage.
- Analyzes crop symptoms (multimodal vision supported) and provides structured organic treatments categorized by Botanical, Biocontrol, and Cultural remedies.
- Outputs a 14-day spray schedule table and connects to commercial bio-product names.

### 8. Harvest Maturity Verification
- Checklist evaluating grain hardness, flag leaf senescence, and node dryness.
- Calculates yield estimates (typical vs expected) and outlines pre-harvest spray intervals.

### 9. Hermetic Post-Harvest Storage
- Enforces strict temperature and moisture boundaries.
- Ranked organic preservation layering techniques (dried neem layering, PICS hermetic bags, sweet flag/Vacha powders) to prevent weevil infestations.
- Collapsible detailed seed-saving protocol.

### 10. APMC Mandi Sales Channel Optimization
- Cross-references real-time regional APMC Mandi prices with organic premiums.
- Interactive Premium Earnings Calculator showing net organic profits.
- Compiles standard PGS-India group certification steps for local cooperatives to stamp official organic logos.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 18, Zustand (persisted state management), Leaflet (geographic drawing), Recharts, Lucide Icons, TailwindCSS.
- **Backend**: Node.js, Express, Multer (memory buffering for image processing), AsyncLocalStorage (thread-safe, concurrent request request key isolation).
- **AI Core**: Google Generative AI (`gemini-3.5-flash` for high-speed dynamic structuring, JSON schema compliance).

---

## 🚀 Installation & Local Setup

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### 1. Clone the repository and install dependencies
```bash
git clone https://github.com/your-username/AgroPilot.git
cd AgroPilot
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root folder of the project:
```env
PORT=5000
GEMINI_API_KEY=your_trial_gemini_api_key_here
GEOAPIFY_API_KEY=optional_geoapify_key_here
```

### 3. Run the Development Server
This utilizes `concurrently` to launch the Node Express API server and the Vite React client simultaneously:
```bash
npm run dev
```
- **Client**: `http://localhost:5173`
- **Server**: `http://localhost:5000`

### 4. Build for Production
To package the entire client application into minified, optimized chunks:
```bash
npm run build
```
Vite will output the static bundle inside the `/dist` directory. The Express server is fully configured to detect production environments and serve this folder statically.

---

## 🛡️ Organic Guard & Compliance

AgroPilot operates an active defensive sanitization scanner (`organicGuard.js`) on the server. If the Gemini API attempts to output synthetic inputs (such as Urea, DAP, chemical pesticides, or herbicides), the system automatically intercepts the payload and routes a corrective self-healing loop back to the API. It forces a complete recalculation using NPOP approved biological and cultural protocols.

---

*AgroPilot — Empowering sustainable, high-yield organic farming for Indian soils.*
