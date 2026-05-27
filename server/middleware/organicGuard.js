// AgroPilot Organic Guard (NPOP Compliance Checker)

export const BLOCKED_KEYWORDS = [
  // Synthetic Fertilizers
  'urea', 
  'dap', 
  'diammonium phosphate', 
  'mop', 
  'muriate of potash', 
  'npk chemical', 
  'synthetic fertilizer', 
  'ammonium sulfate', 
  'superphosphate',
  'chemical fertilizer',
  'chemical NPK',
  
  // Chemical Pesticides
  'chlorpyrifos', 
  'endosulfan', 
  'malathion', 
  'carbofuran', 
  'monocrotophos', 
  'cypermethrin', 
  'imidacloprid',
  'chemical pesticide',
  'synthetic pesticide',
  'ddt',
  
  // Chemical Herbicides / Weedkillers
  'glyphosate', 
  'paraquat', 
  'atrazine', 
  '2,4-d', 
  'weedkiller', 
  'roundup', 
  'round-up',
  'chemical herbicide',
  
  // Other Non-Organic Inputs
  'gmo', 
  'genetically modified', 
  'hybrid seed (chemical)',
  'gmo seed'
];

/**
 * Checks a string or object structure for any NPOP organic violations.
 * Returns an array of violating keywords found.
 */
export function checkOrganicViolations(content) {
  const textToScan = typeof content === 'string' 
    ? content 
    : JSON.stringify(content);
  
  const lowerText = textToScan.toLowerCase();
  
  // Clean punctuation to avoid keyword dodging like "u-r-e-a" or "urea."
  const cleanText = lowerText.replace(/[^a-z0-9\s-]/g, ' ');
  
  const violations = [];
  
  for (const keyword of BLOCKED_KEYWORDS) {
    // Check with word boundaries to avoid false positives (e.g. "European" containing "urea" is avoided)
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(cleanText) || lowerText.includes(keyword)) {
      violations.push(keyword);
    }
  }
  
  return violations;
}

/**
 * Express middleware that intercepts responses (if needed for global validation)
 */
export function organicGuardMiddleware(req, res, next) {
  const originalSend = res.send;
  
  res.send = function(body) {
    try {
      const parsed = JSON.parse(body);
      const violations = checkOrganicViolations(parsed);
      
      if (violations.length > 0) {
        return originalSend.call(this, JSON.stringify({
          error: "OrganicViolation",
          message: `NPOP compliance violation: AI suggested prohibited input(s): ${violations.join(', ')}.`,
          violations
        }));
      }
    } catch (e) {
      // Body is not JSON, scan as raw text
      const violations = checkOrganicViolations(body);
      if (violations.length > 0) {
        return originalSend.call(this, JSON.stringify({
          error: "OrganicViolation",
          message: `NPOP compliance violation: AI suggested prohibited input(s): ${violations.join(', ')}.`,
          violations
        }));
      }
    }
    
    return originalSend.call(this, body);
  };
  
  next();
}
