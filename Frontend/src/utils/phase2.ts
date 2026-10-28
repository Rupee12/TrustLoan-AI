import type { FormData, PredictionResult, WhatIfComparison } from '../types';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'https://trustloan-ai.onrender.com').replace(/\/$/, '');

export interface NlpFields {
  no_of_dependents: number | null;
  education: 'Graduate' | 'Not Graduate' | null;
  self_employed: 'Yes' | 'No' | null;
  income_annum: number | null;
  loan_amount: number | null;
  loan_term: number | null;
  cibil_score: number | null;
  residential_assets_value: number | null;
  commercial_assets_value: number | null;
  luxury_assets_value: number | null;
  bank_asset_value: number | null;
}

export interface NlpResponse extends NlpFields {
  income_monthly: number | null;
  loan_purpose: string | null;
  confidence: Record<string, number>;
  ambiguous_fields: string[];
  validation_errors: string[];
  missing_required_fields: string[];
  requires_confirmation: boolean;
}

export interface LenderCriterion {
  criterion: string;
  status: 'match' | 'mismatch' | 'unknown';
  explanation: string;
  source_url: string | null;
}

export interface LenderMatch {
  lender_id: string;
  lender_name: string;
  category: 'personal_loan';
  status: string;
  criteria: LenderCriterion[];
  unknown_criteria: string[];
  product_url: string;
  application_url: string | null;
  last_verified: string;
  caveat: string;
}

export interface EmiResult {
  monthly_emi: number;
  total_payment: number;
  total_interest: number;
}

export interface KnowledgeResult {
  title: string;
  category: string;
  excerpt: string;
  source_url: string | null;
  verified_at: string;
  relevance: number;
}

export function toLoanPayload(data: FormData): NlpFields {
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

export async function extractNlp(text: string): Promise<NlpResponse> {
  const response = await fetch(`${API_BASE_URL}/api/nlp/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(typeof body?.detail === 'string' ? body.detail : 'Unable to extract application fields.');
  return body as NlpResponse;
}

export async function matchLenders(data: FormData): Promise<LenderMatch[]> {
  const response = await fetch(`${API_BASE_URL}/api/lenders/match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      loan_category: 'personal_loan',
      loan_amount: data.loanAmount,
      loan_term: data.loanTerm,
      self_employed: data.selfEmployed,
    }),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(typeof body?.detail === 'string' ? body.detail : 'Unable to compare published lender criteria.');
  return body.matches as LenderMatch[];
}

export async function calculateEmi(
  principal: number,
  annualInterestRate: number,
  tenureMonths: number,
): Promise<EmiResult> {
  const response = await fetch(`${API_BASE_URL}/api/emi/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      principal,
      annual_interest_rate: annualInterestRate,
      tenure_months: tenureMonths,
    }),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(typeof body?.detail === 'string' ? body.detail : 'Unable to calculate EMI.');
  return body as EmiResult;
}

export async function searchKnowledge(query: string): Promise<{
  answer: string;
  results: KnowledgeResult[];
}> {
  const response = await fetch(`${API_BASE_URL}/api/knowledge/search?query=${encodeURIComponent(query)}`);
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(typeof body?.detail === 'string' ? body.detail : 'Unable to search verified information.');
  return body as { answer: string; results: KnowledgeResult[] };
}

export async function answerKnowledge(query: string): Promise<{
  configured: boolean;
  answer: string | null;
  message: string | null;
  results: KnowledgeResult[];
}> {
  const response = await fetch(`${API_BASE_URL}/api/knowledge/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(typeof body?.detail === 'string' ? body.detail : 'Unable to answer from retrieved sources.');
  return body;
}

export async function requestAssistantChat(data: {
  message: string;
  profile?: Record<string, unknown>;
  prediction?: Record<string, unknown>;
  conversation?: { role: 'user' | 'assistant'; content: string }[];
}): Promise<{
  intent: string;
  response: string;
  follow_up_question: string | null;
  requires_user_input: boolean;
  profile: Record<string, unknown>;
}> {
  const response = await fetch(`${API_BASE_URL}/api/assistant/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(typeof body?.detail === 'string' ? body.detail : 'The assistant is unavailable.');
  return body;
}

export async function requestAdvisor(data: {
  question: string;
  result: PredictionResult;
  formData: FormData;
  whatIf?: WhatIfComparison | null;
}): Promise<{ configured: boolean; explanation?: string; message?: string }> {
  const response = await fetch(`${API_BASE_URL}/api/advisor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: data.question,
      prediction: data.result.prediction,
      probability: data.result.probability,
      risk_score: data.result.riskScore,
      applicant: toLoanPayload(data.formData),
      shap_values: data.result.shapValues,
      what_if: data.whatIf ?? null,
    }),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(typeof body?.detail === 'string' ? body.detail : 'The AI Advisor provider is unavailable.');
  return body;
}

export async function downloadReport(result: PredictionResult, formData: FormData, whatIf?: WhatIfComparison | null): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      applicant: toLoanPayload(formData),
      prediction: result.prediction,
      probability: result.probability,
      risk_score: result.riskScore,
      risk_category: result.riskCategory,
      shap_values: result.shapValues,
      what_if: whatIf ?? null,
      generated_at: new Date().toISOString(),
    }),
  });
  if (!response.ok) throw new Error('Unable to generate the assessment PDF.');
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'trustloan-assessment.pdf';
  link.click();
  URL.revokeObjectURL(url);
}

export function nlpToFormData(fields: NlpFields): FormData {
  return {
    dependents: fields.no_of_dependents as number,
    education: fields.education as FormData['education'],
    selfEmployed: fields.self_employed === 'Yes',
    annualIncome: fields.income_annum as number,
    loanAmount: fields.loan_amount as number,
    loanTerm: fields.loan_term as number,
    cibilScore: fields.cibil_score as number,
    residentialAssets: fields.residential_assets_value as number,
    commercialAssets: fields.commercial_assets_value as number,
    luxuryAssets: fields.luxury_assets_value as number,
    bankAssets: fields.bank_asset_value as number,
  };
}

export const nlpFieldLabels: Record<keyof NlpFields, string> = {
  no_of_dependents: 'Dependents',
  education: 'Education',
  self_employed: 'Employment',
  income_annum: 'Annual income',
  loan_amount: 'Loan amount',
  loan_term: 'Loan term (years)',
  cibil_score: 'CIBIL score',
  residential_assets_value: 'Residential assets',
  commercial_assets_value: 'Commercial assets',
  luxury_assets_value: 'Luxury assets',
  bank_asset_value: 'Bank assets',
};
