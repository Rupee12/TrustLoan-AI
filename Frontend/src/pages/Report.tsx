import { useState } from 'react';
import type { FormData, Page, PredictionResult, WhatIfComparison } from '../types';
import { formatCurrency } from '../utils/predict';
import { downloadReport } from '../utils/phase2';
import Logo from '../components/Logo';

interface ReportProps {
  result: PredictionResult | null;
  formData: FormData;
  whatIf: WhatIfComparison | null;
  onNavigate: (page: Page) => void;
}

export default function Report({ result, formData, whatIf, onNavigate }: ReportProps) {
  const [reportError, setReportError] = useState<string | null>(null);
  const date = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  const totalAssets = formData.residentialAssets + formData.commercialAssets + formData.luxuryAssets + formData.bankAssets;

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center glass rounded-2xl p-12 max-w-md">
          <p className="text-5xl mb-4">📄</p>
          <h2 className="text-white font-bold text-xl mb-2">No Assessment Yet</h2>
          <p className="text-slate-400 text-sm mb-6">Complete an eligibility assessment to generate your report.</p>
          <button
            onClick={() => onNavigate('eligibility')}
            className="bg-gradient-primary text-white px-6 py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
          >
            Start Assessment →
          </button>
        </div>
      </div>
    );
  }

  const { eligible, probability, riskScore, riskCategory, shapValues } = result;
  const pct = Math.round(probability * 100);

  const modelSummary = `The Random Forest classified this application as ${eligible ? 'Approved' : 'Rejected'} with a model-estimated approval probability of ${pct}%. The reported risk category is ${riskCategory}. This result is an educational model assessment, not a bank decision or guarantee.`;

  return (
    <div className="min-h-screen px-4 py-10 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Assessment Report</h1>
          <button
            onClick={() => {
              if (!result) return;
              setReportError(null);
              void downloadReport(result, formData, whatIf).catch((reason: unknown) => setReportError(reason instanceof Error ? reason.message : 'Unable to generate the assessment PDF.'));
            }}
            className="glass border border-white/10 text-slate-300 px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/[0.06] transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Download PDF
          </button>
        </div>
        {reportError && <p className="mb-4 text-sm text-red-300">{reportError}</p>}

        {/* Report document */}
        <div className="glass rounded-3xl overflow-hidden border border-white/10">
          {/* Report header */}
          <div className="bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-violet-600/20 p-8 border-b border-white/[0.06]">
            <div className="flex items-start justify-between">
              <Logo size={40} textSize="text-2xl" />
              <div className="text-right">
                <p className="text-xs text-slate-400">Report Generated</p>
                <p className="text-sm text-white font-mono">{date}</p>
                <p className="text-xs text-slate-500 mt-1">Reference: TL-{Math.random().toString(36).slice(2, 8).toUpperCase()}</p>
              </div>
            </div>
            <div className="mt-6">
              <h2 className="text-white text-2xl font-bold">Loan Eligibility Assessment Report</h2>
              <p className="text-slate-400 text-sm mt-1">Random Forest · SHAP Explainability</p>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Prediction result */}
            <section>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">01 — Prediction Result</h3>
              <div className={`rounded-2xl p-6 border ${
                eligible ? 'border-emerald-500/20 bg-emerald-500/[0.06]' : 'border-red-500/20 bg-red-500/[0.06]'
              }`}>
                <div className="flex flex-wrap items-center gap-6">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Model Classification</p>
                    <p className={`text-2xl font-bold ${eligible ? 'text-emerald-400' : 'text-red-400'}`}>
                      {result.prediction}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Confidence</p>
                    <p className="text-2xl font-bold text-white font-mono">{pct}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Risk Score</p>
                    <p className="text-2xl font-bold text-white font-mono">{riskScore}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Risk Category</p>
                    <p className="text-xl font-bold text-white">{riskCategory} Risk</p>
                  </div>
                </div>
              </div>
            </section>

            {whatIf && <section>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">05 — What-If Analysis</h3>
              <p className="text-sm text-slate-300">Changed fields: {whatIf.changedFeatures.join(', ') || 'None'}. Model probability changed from {Math.round(whatIf.original.probability * 100)}% to {Math.round(whatIf.modified.probability * 100)}%.</p>
            </section>}

            {/* Applicant summary */}
            <section>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">02 — Applicant Summary</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Annual Income', formatCurrency(formData.annualIncome)],
                  ['CIBIL Score', `${formData.cibilScore} (${formData.cibilScore >= 750 ? 'Excellent' : formData.cibilScore >= 700 ? 'Good' : formData.cibilScore >= 650 ? 'Fair' : 'Poor'})`],
                  ['Requested Loan', formatCurrency(formData.loanAmount)],
                  ['Loan Term', `${formData.loanTerm} years`],
                  ['Total Assets', formatCurrency(totalAssets)],
                  ['Dependents', formData.dependents],
                  ['Education', formData.education],
                  ['Employment', formData.selfEmployed ? 'Self Employed' : 'Salaried / Other'],
                ].map(([k, v]) => (
                  <div key={String(k)} className="glass-bright rounded-xl p-3">
                    <p className="text-xs text-slate-500">{k}</p>
                    <p className="text-sm text-white font-medium mt-0.5">{v}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* SHAP explanation */}
            <section>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">03 — Top Influencing Factors (SHAP)</h3>
              <div className="space-y-3">
                {shapValues.slice(0, 6).map((sv, i) => (
                  <div key={sv.feature} className="flex items-center gap-4">
                    <span className="text-xs text-slate-500 font-mono w-4">#{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-300 font-medium">{sv.feature}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-500 font-mono">{sv.rawValue}</span>
                          <span className={`text-xs font-mono ${sv.direction === 'positive' ? 'text-emerald-400' : 'text-red-400'}`}>
                            {sv.direction === 'positive' ? '+' : ''}{sv.value.toFixed(3)}
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(Math.abs(sv.value) / Math.abs(shapValues[0].value)) * 100}%`,
                            background: sv.direction === 'positive' ? '#34d399' : '#f87171',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* AI Summary */}
            <section>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">04 — Model Summary</h3>
              <div className="glass rounded-xl p-5 border border-indigo-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">AI</span>
                  </div>
                  <span className="text-xs text-indigo-300 font-semibold">TrustLoan AI Analysis</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{modelSummary}</p>
              </div>
            </section>

            {/* Disclaimer */}
            <section className="border-t border-white/[0.06] pt-6">
              <p className="text-xs text-slate-500 leading-relaxed">
                <strong className="text-slate-400">Disclaimer:</strong> This report is generated for educational purposes only. It does not constitute financial advice or guarantee loan approval. Actual lending decisions are made by authorised financial institutions based on their own criteria. TrustLoan AI — MCA Academic Project · Random Forest · Held-out test accuracy: 98.13%
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
