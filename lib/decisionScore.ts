/**
 * Generates an overall farm health/decision score.
 * Keeps logic simple and demo-friendly.
 */

export interface DecisionOutput {
  score: number; // 0 to 100
  riskLevel: "Low Risk" | "Moderate Risk" | "High Risk" | "Critical";
  recommendation: string;
}

/**
 * @param diseaseRisk   0–1 where 0 = healthy, 1 = certain severe disease
 * @param weatherRisk   "Green" | "Yellow" | "Red" from weatherApi
 * @param predictedYield unused by score logic, kept for API compatibility
 */
export function calculateDecisionScore(
  diseaseRisk: number,
  weatherRisk: "Green" | "Yellow" | "Orange" | "Red",
  predictedYield: number
): DecisionOutput {
  let score = 100;

  // Disease impact: the higher the disease risk, the more we deduct (up to 50 pts)
  score -= Math.round(diseaseRisk * 50);

  // Weather impact (up to 30 pts)
  switch (weatherRisk) {
    case "Yellow": score -= 10; break;
    case "Orange": score -= 20; break;
    case "Red":    score -= 30; break;
    default: break; // Green = 0 deduction
  }

  // Clamp
  score = Math.max(0, Math.min(100, score));

  let riskLevel: DecisionOutput["riskLevel"];
  let recommendation: string;

  if (score >= 80) {
    riskLevel = "Low Risk";
    recommendation =
      "Optimal conditions. Continue standard farming practices and monitor market prices for the best selling window.";
  } else if (score >= 60) {
    riskLevel = "Moderate Risk";
    recommendation =
      "Minor risks detected. Consider preemptive measures like light spraying or irrigation adjustments before conditions worsen.";
  } else if (score >= 40) {
    riskLevel = "High Risk";
    recommendation =
      "Significant crop threat. Immediate treatment is recommended. Prepare contingency plans for potential yield reduction.";
  } else {
    riskLevel = "Critical";
    recommendation =
      "Critical condition. Execute emergency crop protection protocols immediately. Focus on salvaging unaffected portions.";
  }

  return { score, riskLevel, recommendation };
}
