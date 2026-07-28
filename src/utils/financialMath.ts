// Precision Financial Math Engine for Haftora

export interface CompoundPoint {
  year: number;
  age: number;
  totalContributions: number;
  nominalBalance: number;
  realBalance: number;
  interestEarned: number;
}

export function calculateCompoundInterest(
  initialInvestment: number,
  monthlyContribution: number,
  annualReturnRate: number,
  years: number,
  inflationRate: number = 2.5,
  startAge: number = 25
): CompoundPoint[] {
  const points: CompoundPoint[] = [];
  const monthlyRate = annualReturnRate / 100 / 12;
  const monthlyInflation = inflationRate / 100 / 12;

  let currentNominal = initialInvestment;
  let totalContrib = initialInvestment;

  // Add year 0
  points.push({
    year: 0,
    age: startAge,
    totalContributions: totalContrib,
    nominalBalance: currentNominal,
    realBalance: currentNominal,
    interestEarned: 0
  });

  for (let year = 1; year <= years; year++) {
    for (let month = 1; month <= 12; month++) {
      currentNominal = (currentNominal + monthlyContribution) * (1 + monthlyRate);
      totalContrib += monthlyContribution;
    }

    // Real inflation adjusted value: Nominal / (1 + i)^n
    const realFactor = Math.pow(1 + inflationRate / 100, year);
    const realVal = Math.round(currentNominal / realFactor);

    points.push({
      year,
      age: startAge + year,
      totalContributions: Math.round(totalContrib),
      nominalBalance: Math.round(currentNominal),
      realBalance: realVal,
      interestEarned: Math.round(currentNominal - totalContrib)
    });
  }

  return points;
}

export interface FeeImpactPoint {
  year: number;
  noFeeBalance: number;
  withFeeBalance: number;
  lostToFees: number;
}

export function calculateFeeImpact(
  initialAmount: number,
  monthlyContribution: number,
  annualReturnRate: number,
  years: number,
  expenseRatioPercent: number // e.g. 0.03 for 0.03% or 0.75 for 0.75%
): FeeImpactPoint[] {
  const points: FeeImpactPoint[] = [];
  const monthlyGrossRate = annualReturnRate / 100 / 12;
  const monthlyNetRate = (annualReturnRate - expenseRatioPercent) / 100 / 12;

  let noFee = initialAmount;
  let withFee = initialAmount;

  for (let year = 1; year <= years; year++) {
    for (let month = 1; month <= 12; month++) {
      noFee = (noFee + monthlyContribution) * (1 + monthlyGrossRate);
      withFee = (withFee + monthlyContribution) * (1 + monthlyNetRate);
    }

    points.push({
      year,
      noFeeBalance: Math.round(noFee),
      withFeeBalance: Math.round(withFee),
      lostToFees: Math.round(noFee - withFee)
    });
  }

  return points;
}

export interface DcaPoint {
  month: number;
  dcaBalance: number;
  lumpSumBalance: number;
  totalInvested: number;
}

export function calculateDCA(
  totalCash: number,
  monthlyAmount: number,
  durationMonths: number,
  annualReturn: number = 8
): DcaPoint[] {
  const points: DcaPoint[] = [];
  const monthlyRate = annualReturn / 100 / 12;

  let lumpSum = totalCash;
  let dcaBalance = 0;
  let cashRemaining = totalCash;
  let dcaInvested = 0;

  for (let m = 1; m <= durationMonths; m++) {
    // Lump sum grows every month
    lumpSum = lumpSum * (1 + monthlyRate);

    // DCA injects monthly amount as long as cash remaining
    if (cashRemaining > 0) {
      const inject = Math.min(cashRemaining, monthlyAmount);
      cashRemaining -= inject;
      dcaInvested += inject;
      dcaBalance += inject;
    }
    dcaBalance = dcaBalance * (1 + monthlyRate);

    points.push({
      month: m,
      dcaBalance: Math.round(dcaBalance + cashRemaining),
      lumpSumBalance: Math.round(lumpSum),
      totalInvested: totalCash
    });
  }

  return points;
}

export interface DividendPoint {
  year: number;
  portfolioValue: number;
  annualDividendIncome: number;
  yieldOnCostPercent: number;
}

export function calculateDividendGrowth(
  initialInvestment: number,
  monthlyContribution: number,
  initialYieldPercent: number,
  dividendGrowthRatePercent: number,
  priceAppreciationPercent: number,
  years: number
): DividendPoint[] {
  const points: DividendPoint[] = [];
  let portfolioValue = initialInvestment;
  let totalInvested = initialInvestment;
  let currentYield = initialYieldPercent / 100;

  for (let year = 1; year <= years; year++) {
    const annualContrib = monthlyContribution * 12;
    totalInvested += annualContrib;

    // Price appreciation
    portfolioValue = (portfolioValue + annualContrib) * (1 + priceAppreciationPercent / 100);

    // Dividend payout based on yield
    const annualDiv = portfolioValue * currentYield;

    // Reinvest dividends (DRIP)
    portfolioValue += annualDiv;

    // Dividend grows over time
    currentYield = currentYield * (1 + dividendGrowthRatePercent / 100);

    const yieldOnCost = (annualDiv / totalInvested) * 100;

    points.push({
      year,
      portfolioValue: Math.round(portfolioValue),
      annualDividendIncome: Math.round(annualDiv),
      yieldOnCostPercent: Number(yieldOnCost.toFixed(2))
    });
  }

  return points;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}
