import type { FormData, PredictionResult } from '../types';

import { API_BASE_URL } from './phase2';

export function toLoanPayload(data: FormData) {
  return {
    no_of_dependents: data.dependents,
    education: data.education,
    self_employed: data.selfEmployed ? 'Yes' : 'No',
    income_annum: data.annualIncome,
    loan_amount: data.loanAmount,
    loan_term: data.loanTerm,
    cibil_score: data.cibilScore,
    residential_assets_value: data.residentialAssets,
    commercial_assets_value: data.commercialAssets,
    luxury_assets_value: data.luxuryAssets,
    bank_asset_value: data.bankAssets,
  };
}

export async function runPrediction(data: FormData): Promise<PredictionResult> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toLoanPayload(data)),
    });
  } catch {
    throw new Error('The prediction service is unavailable. Start the FastAPI backend and try again.');
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = typeof body === 'object' && body !== null && 'detail' in body ? body.detail : null;
    throw new Error(typeof detail === 'string' ? detail : 'The backend rejected this application.');
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    typeof body.probability !== 'number' ||
    typeof body.eligible !== 'boolean' ||
    typeof body.risk_score !== 'number' ||
    typeof body.risk_category !== 'string'
  ) {
    throw new Error('The backend returned an invalid prediction response.');
  }

  return {
    prediction: body.prediction === 'Approved' ? 'Approved' : 'Rejected',
    eligible: body.eligible,
    probability: body.probability,
    riskScore: body.risk_score,
    riskCategory: body.risk_category as PredictionResult['riskCategory'],
    shapValues: Array.isArray(body.shap_values)
      ? body.shap_values
          .filter((value): value is { feature: string; value: number; raw_value: string | number; direction: 'positive' | 'negative' } =>
            typeof value === 'object' &&
            value !== null &&
            typeof value.feature === 'string' &&
            typeof value.value === 'number' &&
            (value.direction === 'positive' || value.direction === 'negative'),
          )
          .map((value) => ({
            feature: value.feature,
            value: value.value,
            rawValue: value.raw_value,
            direction: value.direction,
          }))
      : [],
  };
}

export function formatCurrency(val: number): string {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
  return `₹${val.toLocaleString('en-IN')}`;
}
