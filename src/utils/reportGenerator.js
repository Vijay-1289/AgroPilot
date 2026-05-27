export const generateMarkdownReport = (stageOutputs, sessionId) => {
  const crop = stageOutputs.stage1?.selectedCrop || 'Paddy';
  const location = stageOutputs.stage1?.locationName || 'India';
  const soil = stageOutputs.stage1?.soilType || 'Red Laterite';
  const ph = stageOutputs.stage1?.soilPH || '6.5';
  
  let report = `# AgroPilot - Complete Organic Farm Plan Report\n`;
  report += `Session ID: ${sessionId}\n`;
  report += `Date Compiled: ${new Date().toLocaleDateString()}\n\n`;
  report += `=====================================================\n\n`;
  
  report += `## STAGE 1 & 2: Land, Geolocation & Measurement\n`;
  report += `- Crop Target: ${crop}\n`;
  report += `- Physical Location: ${location}\n`;
  report += `- Inferred Soil Classification: ${soil} (pH: ${ph})\n`;
  report += `- Total Measured Area: ${stageOutputs.stage2?.totalArea || 1.0} ${stageOutputs.stage2?.areaUnit || 'acres'}\n`;
  report += `- Plot Perimeter: ${stageOutputs.stage2?.perimeter || 0} meters\n\n`;
  
  if (stageOutputs.stage3) {
    report += `## STAGE 3: Organic Sowing & Layout Design\n`;
    report += `- Seed Variety: ${stageOutputs.stage3.seedType?.variety}\n`;
    report += `- Seed Sourcing: ${stageOutputs.stage3.seedType?.source}\n`;
    report += `- Spacing Spans: Row-to-Row: ${stageOutputs.stage3.spacing?.rowToRow} | Plant-to-Plant: ${stageOutputs.stage3.spacing?.plantToPlant}\n`;
    report += `- Total Plant Population: ${stageOutputs.stage3.layout?.totalPlants} plants\n`;
    report += `- Layout Method: ${stageOutputs.stage3.plantingMethod}\n\n`;
  }
  
  if (stageOutputs.stage4) {
    report += `## STAGE 4: Compliant Irrigation Pipelines\n`;
    report += `- System Method: ${stageOutputs.stage4.method}\n`;
    report += `- Daily Water Needs: ${stageOutputs.stage4.waterNeeds?.litresPerDay} Litres/day\n`;
    report += `- Seasonal Water Volume: ${stageOutputs.stage4.waterNeeds?.litresPerSeason} Litres/season\n`;
    report += `- Pump Sizing Energy: ${stageOutputs.stage4.energyReq?.powerNeeded} (${stageOutputs.stage4.energyReq?.solarSizing || 'Standard'})\n\n`;
  }
  
  if (stageOutputs.stage5) {
    report += `## STAGE 5: Organic Seed Treatment & Seeding\n`;
    report += `- Formulation Recipe: ${stageOutputs.stage5.seedTreatment?.name}\n`;
    report += `- Ingredients Ratio: ${stageOutputs.stage5.seedTreatment?.ingredients}\n`;
    report += `- Preparation: ${stageOutputs.stage5.seedTreatment?.process}\n\n`;
  }
  
  const logs = stageOutputs.stage6?.checkupLog || [];
  if (logs.length > 0) {
    report += `## STAGE 6: Chronological Growth Audit Logs\n`;
    logs.forEach(log => {
      report += `- [${new Date(log.timestamp).toLocaleDateString()}] ${log.breakpointLabel} (Alert: ${log.alertLevel})\n`;
      report += `  * Diagnosis: ${log.diagnosis}\n`;
      report += `  * Corrective Action: ${log.organicFix}\n`;
    });
    report += `\n`;
  }
  
  if (stageOutputs.stage7) {
    report += `## STAGE 7: Emergency Disease Diagnosis\n`;
    report += `- Pathology Identified: ${stageOutputs.stage7.pest} (Confidence: ${stageOutputs.stage7.confidence}%)\n`;
    report += `- Diagnosis Narrative: ${stageOutputs.stage7.diagnosis}\n`;
    report += `- Organic Remedy: ${stageOutputs.stage7.organicFix || 'Use Neem Oil or biological antagonists'}\n\n`;
  }
  
  if (stageOutputs.stage8) {
    report += `## STAGE 8: Harvest Assessment & Yield Audit\n`;
    report += `- Status: ${stageOutputs.stage8.readiness}\n`;
    report += `- Rationale: ${stageOutputs.stage8.rationale}\n`;
    report += `- Estimated Yield: ${stageOutputs.stage8.yieldEstimate?.expectedYield}\n`;
    report += `- Pre-Harvest Interval (PHI): ${stageOutputs.stage8.preHarvestSpray?.product} (${stageOutputs.stage8.preHarvestSpray?.phi} Days safety delay)\n\n`;
  }
  
  if (stageOutputs.stage9) {
    report += `## STAGE 9: Non-Chemical Post-Harvest Storage\n`;
    report += `- Infrastructure Type: ${stageOutputs.stage9.storageType}\n`;
    report += `- Target Storage Duration: ${stageOutputs.stage9.duration}\n`;
    report += `- Safe Storage microclimate: Temperature: ${stageOutputs.stage9.conditions?.tempMin}°C - ${stageOutputs.stage9.conditions?.tempMax}°C | Humidity: ${stageOutputs.stage9.conditions?.humidityMin}% - ${stageOutputs.stage9.conditions?.humidityMax}%\n\n`;
  }
  
  if (stageOutputs.stage10) {
    report += `## STAGE 10: APMC Markets & Sales Optimization\n`;
    report += `- Recommended Market strategy: ${stageOutputs.stage10.bestMarket?.name}\n`;
    report += `- Expected Net Premium Earnings: ₹${Math.round(stageOutputs.stage10.earnings?.organicEarnings).toLocaleString()}\n`;
    report += `- Net Organic Premium Gained: + ₹${Math.round(stageOutputs.stage10.earnings?.netPremiumGained).toLocaleString()}\n\n`;
  }
  
  report += `=====================================================\n`;
  report += `Thank you for flying with AgroPilot, your ultimate organic agricultural navigator in India!\n`;

  return report;
};

export const downloadMarkdownReport = (stageOutputs, sessionId) => {
  const report = generateMarkdownReport(stageOutputs, sessionId);
  const blob = new Blob([report], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `AgroPilot_Farm_Report_${sessionId}.md`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
