/**
 * Calculates the economic impact of crop diseases.
 * Keeps logic simple and demo-friendly.
 */

export interface ProfitComputation {
  treatedProfit: number;
  untreatedProfit: number;
  lossDifference: number;
}

export function calculateProfit(
  predictedYield: number, // in quintals or tons
  mandiPrice: number, // per quintal or ton
  diseaseSeverity: "None" | "Low" | "Medium" | "High" | "Critical"
): ProfitComputation {
  // Base revenue assuming perfect health
  const maxRevenue = predictedYield * mandiPrice;

  // Treatment cost (demo assumption)
  const treatmentCost = maxRevenue * 0.05; // 5% of max revenue goes to treatment

  // Yield loss percentages without treatment based on severity
  let lossPercentageNoTreatment = 0;
  let lossPercentageWithTreatment = 0;

  switch (diseaseSeverity) {
    case "None":
      lossPercentageNoTreatment = 0;
      lossPercentageWithTreatment = 0;
      break;
    case "Low":
      lossPercentageNoTreatment = 0.10; // 10% loss
      lossPercentageWithTreatment = 0.02; // 2% loss
      break;
    case "Medium":
      lossPercentageNoTreatment = 0.25; // 25% loss
      lossPercentageWithTreatment = 0.05; // 5% loss
      break;
    case "High":
      lossPercentageNoTreatment = 0.50; // 50% loss
      lossPercentageWithTreatment = 0.15; // 15% loss
      break;
    case "Critical":
      lossPercentageNoTreatment = 0.90; // 90% loss
      lossPercentageWithTreatment = 0.40; // 40% loss
      break;
    default:
      lossPercentageNoTreatment = 0;
      lossPercentageWithTreatment = 0;
  }

  // If no disease, treatment cost is unnecessary
  const actualTreatmentCost = diseaseSeverity === "None" ? 0 : treatmentCost;

  const untreatedProfit = maxRevenue * (1 - lossPercentageNoTreatment);
  const treatedProfit = (maxRevenue * (1 - lossPercentageWithTreatment)) - actualTreatmentCost;
  
  // The value saved by taking action
  const lossDifference = treatedProfit - untreatedProfit;

  return {
    treatedProfit,
    untreatedProfit,
    lossDifference
  };
}
