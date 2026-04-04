/**
 * Hackathon Demo (AgriSentinel AI)
 * - Purpose: Explainable rules engine for final “Treat/Sell/Wait” actions
 * - Used by: dashboard decision section and AI decision flow
 */

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

export type SmartDecisionInput = {
  disease_result: DiseaseSignal | null;
  risk_data: RiskSignal | null;
  mandi_prices: MandiPriceSignal | null;
  yield_data: YieldSignal | null;
};

export type SmartDecisionOutput = {
  decision: "Treat Immediately" | "Sell Now" | "Wait & Monitor";
  reason: string;
  expected_profit_impact: string;
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

function profitDeltaPerQuintal(m: MandiPriceSignal | null | undefined): number | null {
  if (!m || m.bestPrice == null || m.breakevenPrice == null) return null;
  return Math.round(m.bestPrice - m.breakevenPrice);
}

function yieldLossPct(y: YieldSignal | null | undefined): number | null {
  const base = y?.baseYield ?? null;
  const adj = y?.adjustedYield ?? null;
  if (base == null || adj == null || base <= 0) return null;
  return Math.max(0, Math.round((1 - adj / base) * 100));
}

/**
 * Smart decision engine (explainable rules).
 *
 * Priority:
 * 1) Treat Immediately: severe disease + high weather risk
 * 2) Sell Now: market price attractive and risk/disease could reduce quality/value
 * 3) Wait & Monitor: low weather risk and price not exceptional
 */
export function smartDecisionEngine(input: SmartDecisionInput): SmartDecisionOutput {
  const disease = input.disease_result;
  const risk = input.risk_data;
  const mandi = input.mandi_prices;
  const y = input.yield_data;

  const highDisease = isHighDisease(disease);
  const moderateDisease = isModerateDisease(disease);
  const highRisk = isHighRisk(risk);
  const lowRisk = isLowRisk(risk);
  const goodPrice = priceAttractive(mandi);
  const weakPrice = priceWeak(mandi);
  const delta = profitDeltaPerQuintal(mandi);
  const loss = yieldLossPct(y);

  // 1) Treat Immediately
  if (highDisease && highRisk) {
    const parts: string[] = [
      "Disease severity is high and the next-weather risk is also high, which can accelerate spread in 3–7 days.",
    ];
    if (loss != null && loss > 0) parts.push(`Current yield impact is estimated around ${loss}%.`);
    if (weakPrice) {
      parts.push("Mandi price is not very attractive right now, so protecting yield is the higher-value move.");
    }
    return {
      decision: "Treat Immediately",
      reason: parts.join(" "),
      expected_profit_impact:
        loss != null && loss > 0
          ? `Preventing further spread can protect ~${loss}% of yield/quality; recheck in 3–5 days after treatment.`
          : "Treatment now reduces near-term downside risk; recheck in 3–5 days.",
    };
  }

  // 2) Sell Now
  if (goodPrice) {
    const parts: string[] = [
      "Market price is significantly above your breakeven, so locking in value is attractive.",
    ];
    if (highRisk || moderateDisease) {
      parts.push("Weather risk and/or disease pressure could reduce quality and marketability if you wait.");
    } else {
      parts.push("Even with moderate risk, the price premium justifies selling a portion now.");
    }

    const deltaText = delta != null ? `~₹${delta}/q above breakeven` : "above breakeven";
    const lossText = loss != null && loss > 0 ? ` and avoid compounding an estimated ${loss}% loss` : "";

    return {
      decision: "Sell Now",
      reason: parts.join(" "),
      expected_profit_impact:
        `Selling now captures ${deltaText}${lossText}. Consider partial harvest if the crop isn't fully ready.`,
    };
  }

  // 3) Wait & Monitor
  if (lowRisk) {
    const parts: string[] = [
      "Weather-based disease risk is low, so immediate aggressive action is not necessary.",
    ];
    if (delta != null && delta <= 0) {
      parts.push("Current mandi price is near or below breakeven, so waiting can improve returns.");
    } else if (delta != null) {
      parts.push("Price is only slightly above breakeven; waiting for a better window can help.");
    }
    if (loss != null && loss <= 5) {
      parts.push("Estimated yield impact is small, so holding the crop briefly is reasonable.");
    }
    return {
      decision: "Wait & Monitor",
      reason: parts.join(" "),
      expected_profit_impact:
        "Monitor twice per week; if risk rises to High or symptoms spread, switch to treatment. If mandi price jumps ≥15% above breakeven, consider selling.",
    };
  }

  // Default: mixed signals → conservative monitor + targeted action
  const parts: string[] = [
    "Signals are mixed (moderate risk/price). Use a balanced approach: protect the crop modestly and stay ready to sell if prices improve.",
  ];
  if (moderateDisease) parts.push("A single protective spray + sanitation pass can stabilise yield while you watch the market.");
  return {
    decision: "Wait & Monitor",
    reason: parts.join(" "),
    expected_profit_impact:
      delta != null
        ? `Maintain yield while watching prices (currently ~₹${delta}/q vs breakeven).`
        : "Maintain yield while watching prices; switch quickly if risk or symptoms rise.",
  };
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
