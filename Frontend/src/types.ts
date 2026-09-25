export type Page =
  | 'home'
  | 'eligibility'
  | 'result'
  | 'shap'
  | 'advisor'
  | 'whatif'
  | 'insights'
  | 'responsible'
  | 'report'
  | 'about';

export interface FormData {
  // Step 1
  dependents: number;
  education: 'Graduate' | 'Not Graduate';
  selfEmployed: boolean;
  // Step 2
  annualIncome: number;
  cibilScore: number;
  residentialAssets: number;
  commercialAssets: number;
  luxuryAssets: number;
  bankAssets: number;
  // Step 3
  loanAmount: number;
  loanTerm: number;
}

export interface PredictionResult {
  prediction: 'Approved' | 'Rejected';
  eligible: boolean;
  probability: number;
  riskScore: number;
  riskCategory: 'Low' | 'Medium' | 'High' | 'Very High';
  shapValues: ShapValue[];
}

export interface WhatIfComparison {
  original: PredictionResult;
  modified: PredictionResult;
  changedFeatures: string[];
}

export interface ShapValue {
  feature: string;
  value: number;
  rawValue: string | number;
  direction: 'positive' | 'negative';
}

export const defaultFormData: FormData = {
  dependents: 2,
  education: 'Graduate',
  selfEmployed: false,
  annualIncome: 900000,
  cibilScore: 720,
  residentialAssets: 2500000,
  commercialAssets: 0,
  luxuryAssets: 500000,
  bankAssets: 800000,
  loanAmount: 1500000,
  loanTerm: 1,
};
