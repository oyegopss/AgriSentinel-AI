export type DiseaseSignal = {
  /** e.g. "Leaf Spot", "Rust Disease" */
  name: string;
  /** 0–1 model confidence (already normalised). */
  confidence: number;
  /** Optional textual severity like "Low" | "Moderate" | "High". */
  severity?: string;
};

export type RiskSignal = {
  /** "Low" | "Medium" | "High" (from risk model). */
  level: string;
  /** 0–1 probability from risk model. */
  probability: number;
};

export type MandiPriceSignal = {
  /** best available mandi price per quintal (₹). */
  bestPrice: number | null;
  /** farmer's typical / breakeven price per quintal (₹). */
  breakevenPrice: number | null;
};

export type YieldSignal = {
  /** expected yield before disease impact, tons/ha. */
  baseYield: number | null;
  /** expected yield after disease impact, tons/ha. */
  adjustedYield: number | null;
};

export type DecisionOutput = {
  final_decision: "Sell Now" | "Wait" | "Treat";
  reason: string;
  profit_impact: string;
};

function normaliseSeverity(sev?: string): "low" | "medium" | "high" {
  if (!sev) return "medium";
  const s = sev.toLowerCase();
  if (s.includes("high")) return "high";
  if (s.includes("low")) return "low";
  return "medium";
}

function isHighDisease(d: DiseaseSignal | null | undefined): boolean {
  if (!d) return false;
  const sev = normaliseSeverity(d.severity);
  return sev === "high" || d.confidence >= 0.8;
}

function isModerateDisease(d: DiseaseSignal | null | undefined): boolean {
  if (!d) return false;
  const sev = normaliseSeverity(d.severity);
  return sev === "medium" || d.confidence >= 0.6;
}

function isHighRisk(r: RiskSignal | null | undefined): boolean {
  if (!r) return false;
  return r.level.toLowerCase().includes("high") || r.probability >= 0.7;
}

function isLowRisk(r: RiskSignal | null | undefined): boolean {
  if (!r) return false;
  return r.level.toLowerCase().includes("low") || r.probability <= 0.3;
}

function priceAttractive(m: MandiPriceSignal | null | undefined): boolean {
  if (!m || m.bestPrice == null || m.breakevenPrice == null) return false;
  return m.bestPrice >= m.breakevenPrice * 1.15; // ≥15% above breakeven
}

function priceWeak(m: MandiPriceSignal | null | undefined): boolean {
  if (!m || m.bestPrice == null || m.breakevenPrice == null) return false;
  return m.bestPrice <= m.breakevenPrice * 1.03; // ≤3% above breakeven
}

export function decideAction(
  disease: DiseaseSignal | null,
  risk: RiskSignal | null,
  mandi: MandiPriceSignal | null,
  yieldSignal: YieldSignal | null,
): DecisionOutput {
  const highDisease = isHighDisease(disease);
  const moderateDisease = isModerateDisease(disease);
  const highRisk = isHighRisk(risk);
  const lowRisk = isLowRisk(risk);
  const goodPrice = priceAttractive(mandi);
  const weakPrice = priceWeak(mandi);

  const baseYield = yieldSignal?.baseYield ?? null;
  const adjustedYield = yieldSignal?.adjustedYield ?? null;

  const lossPct =
    baseYield && adjustedYield != null && baseYield > 0
      ? Math.round((1 - adjustedYield / baseYield) * 100)
      : null;

  const parts: string[] = [];

  // 1) Treat: strong disease + risky weather
  if (highDisease && highRisk) {
    parts.push(
      "Disease severity and weather risk are both high. Without treatment the crop can deteriorate quickly in the next 3–7 days.",
    );
    if (lossPct != null && lossPct > 0) {
      parts.push(`Yield is already estimated to drop by about ${lossPct}% if untreated.`);
    }
    return {
      final_decision: "Treat",
      reason: parts.join(" "),
      profit_impact:
        weakPrice
          ? "Current mandi prices are not very attractive, so protecting the crop and stabilising yield is more valuable than selling immediately."
          : "Treat now to protect remaining yield, then reassess mandi prices after disease is under control.",
    };
  }

  // 2) Sell Now: price very good and risk at least moderate
  if (goodPrice && (highRisk || moderateDisease)) {
    parts.push(
      "Mandi price is significantly above your breakeven level (≈15% or more), and conditions favour further disease or quality loss.",
    );
    if (lossPct != null && lossPct > 0) {
      parts.push(`Harvesting now helps lock in value before an estimated ${lossPct}% yield/quality loss.`);
    }
    return {
      final_decision: "Sell Now",
      reason: parts.join(" "),
      profit_impact:
        "Selling now captures a strong market price while avoiding additional input costs and disease-related losses.",
    };
  }

  // 3) Wait: low risk & price not exceptional
  if (lowRisk && !goodPrice) {
    parts.push(
      "Weather-based disease risk is low and market prices are not significantly higher than your breakeven.",
    );
    if (lossPct != null && lossPct <= 5) {
      parts.push("Estimated disease impact on yield is small, so the crop can safely stay in the field a bit longer.");
    }
    return {
      final_decision: "Wait",
      reason: parts.join(" "),
      profit_impact:
        "Waiting 1–2 weeks may allow prices to improve without taking major disease risk. Continue monitoring the field closely.",
    };
  }

  // 4) Default branch: moderate everything → mild treatment and flexible sell timing
  parts.push(
    "Risk and price signals are mixed: disease pressure is not extreme and market prices are around normal levels.",
  );
  if (moderateDisease) {
    parts.push("A single protective spray and sanitation pass is recommended while you watch the market for a better selling window.");
  } else {
    parts.push("Focus on field scouting and basic sanitation while tracking mandi prices for a favourable spike.");
  }

  const decision: DecisionOutput = {
    final_decision: moderateDisease ? "Treat" : "Wait",
    reason: parts.join(" "),
    profit_impact:
      goodPrice
        ? "You could sell a part of the crop now to lock in profit and keep the rest in the field as prices evolve."
        : "Balanced approach: protect the crop modestly and be ready to sell quickly if prices move up or risk increases.",
  };

  return decision;
}

export default decideAction;
