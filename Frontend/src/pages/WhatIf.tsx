import { useEffect, useState } from 'react';
import type { FormData, Page, PredictionResult, WhatIfComparison } from '../types';
import { runPrediction, formatCurrency } from '../utils/predict';

interface WhatIfProps {
  result: PredictionResult | null;
  formData: FormData;
  onNavigate: (page: Page) => void;
  onSimulationComplete?: (comparison: WhatIfComparison) => void;
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-300">{label}</span>
        <span className="text-sm font-bold text-white font-mono">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        aria-label={label}
      />
      <div className="flex justify-between text-xs text-slate-600 mt-1">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}

function DeltaBadge({ delta }: { delta: number }) {
  if (Math.abs(delta) < 0.5) return <span className="text-xs text-slate-400">No change</span>;
  return (
    <span className={`text-xs font-mono font-bold ${delta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
      {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
    </span>
  );
}

function CompareColumn({
  label,
  eligible,
  probability,
  riskScore,
  riskCategory,
  highlight,
}: {
  label: string;
  eligible: boolean;
  probability: number;
  riskScore: number;
  riskCategory: string;
  highlight?: boolean;
}) {
  const pct = Math.round(probability * 100);
  return (
    <div className={`rounded-2xl p-5 flex-1 border ${
      highlight
        ? 'border-indigo-500/40 bg-gradient-to-b from-indigo-500/10 to-violet-500/10'
        : 'glass border-white/[0.06]'
    }`}>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">{label}</p>
      <div className="space-y-4">
        <div>
          <p className="text-xs text-slate-500 mb-1">Prediction</p>
          <p className={`text-lg font-bold ${eligible ? 'text-emerald-400' : 'text-red-400'}`}>
            {eligible ? '✓ Eligible' : '✗ Not Eligible'}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Confidence</p>
          <p className="text-3xl font-bold text-white" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{pct}%</p>
          <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                background: eligible ? 'linear-gradient(90deg, #3b82f6, #22c55e)' : 'linear-gradient(90deg, #f59e0b, #ef4444)',
              }}
            />
          </div>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Risk Score</p>
          <p className="text-xl font-bold text-white font-mono">{riskScore}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Risk Category</p>
          <p className="text-sm font-semibold text-white">{riskCategory}</p>
        </div>
      </div>
    </div>
  );
}

export default function WhatIf({ result, formData, onNavigate, onSimulationComplete }: WhatIfProps) {
  const [sim, setSim] = useState<FormData>({ ...formData });
  const [simResult, setSimResult] = useState<PredictionResult | null>(result);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);
    void runPrediction(sim)
      .then((nextResult) => {
        if (active) {
          setSimResult(nextResult);
          onSimulationComplete?.({
            original: result ?? nextResult,
            modified: nextResult,
            changedFeatures: Object.keys(formData).filter((key) => formData[key as keyof FormData] !== sim[key as keyof FormData]),
          });
        }
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Unable to run this model simulation.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [sim, formData, onSimulationComplete, result]);

  const origResult = result;

  if (!origResult || !simResult) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center glass rounded-2xl p-12 max-w-md">
          <h2 className="text-white font-bold text-xl mb-2">Assessment Required</h2>
          <p className="text-slate-400 text-sm mb-6">Complete an assessment before running a model simulation.</p>
          <button onClick={() => onNavigate('eligibility')} className="bg-gradient-primary text-white px-6 py-3 rounded-xl text-sm font-semibold">Start Assessment</button>
        </div>
      </div>
    );
  }

  const probDelta = (simResult.probability - origResult.probability) * 100;
  const riskDelta = origResult.riskScore - simResult.riskScore;
  const changed = sim.cibilScore !== formData.cibilScore ||
    sim.annualIncome !== formData.annualIncome ||
    sim.loanAmount !== formData.loanAmount ||
    sim.loanTerm !== formData.loanTerm;

  return (
    <div className="min-h-screen px-4 py-10 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <button onClick={() => onNavigate('result')} className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 mb-4 transition-colors">
            ← Back to Result
          </button>
          <h1 className="text-3xl font-bold text-white mb-1">What If I Change My Profile?</h1>
          <p className="text-slate-400 text-sm">Adjust your financial parameters to simulate how changes affect your eligibility prediction.</p>
        </div>

        {/* Disclaimer */}
        <div className="glass border border-amber-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
          <span className="text-amber-400 text-lg shrink-0">⚠️</span>
          <p className="text-xs text-amber-300/80">
            <strong>Model Simulation — Not a Guarantee of Loan Approval.</strong> This tool simulates how the AI model would respond to different inputs. Results are for educational exploration only and do not reflect actual lender decisions.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Sliders */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-white font-semibold text-sm uppercase tracking-wider">Adjust Parameters</h2>
            <SliderRow
              label="CIBIL Score"
              value={sim.cibilScore}
              min={300}
              max={900}
              step={10}
              format={(v) => String(v)}
              onChange={(v) => setSim({ ...sim, cibilScore: v })}
            />
            <SliderRow
              label="Annual Income"
              value={sim.annualIncome}
              min={100000}
              max={5000000}
              step={50000}
              format={formatCurrency}
              onChange={(v) => setSim({ ...sim, annualIncome: v })}
            />
            <SliderRow
              label="Loan Amount"
              value={sim.loanAmount}
              min={100000}
              max={10000000}
              step={100000}
              format={formatCurrency}
              onChange={(v) => setSim({ ...sim, loanAmount: v })}
            />
            <SliderRow
              label="Loan Term (years)"
              value={sim.loanTerm}
              min={1}
              max={20}
              step={1}
              format={(v) => `${v} yr`}
              onChange={(v) => setSim({ ...sim, loanTerm: v })}
            />

            <button
              onClick={() => setSim({ ...formData })}
              className="w-full glass border border-white/10 text-slate-300 py-2.5 rounded-xl text-sm font-medium hover:bg-white/[0.06] transition-all"
            >
              ↺ Reset to Original
            </button>
          </div>

          {/* Comparison */}
          <div className="lg:col-span-3 space-y-5">
            <h2 className="text-white font-semibold text-sm uppercase tracking-wider">Comparison</h2>

            {/* Change summary */}
            {changed && (
              <div className="glass-bright rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Changes Made</p>
                {sim.cibilScore !== formData.cibilScore && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">CIBIL Score</span>
                    <span className="font-mono text-white">{formData.cibilScore} → <strong className="text-indigo-300">{sim.cibilScore}</strong></span>
                  </div>
                )}
                {sim.annualIncome !== formData.annualIncome && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Annual Income</span>
                    <span className="font-mono text-white">{formatCurrency(formData.annualIncome)} → <strong className="text-indigo-300">{formatCurrency(sim.annualIncome)}</strong></span>
                  </div>
                )}
                {sim.loanAmount !== formData.loanAmount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Loan Amount</span>
                    <span className="font-mono text-white">{formatCurrency(formData.loanAmount)} → <strong className="text-indigo-300">{formatCurrency(sim.loanAmount)}</strong></span>
                  </div>
                )}
                {sim.loanTerm !== formData.loanTerm && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Loan Term</span>
                    <span className="font-mono text-white">{formData.loanTerm}yr → <strong className="text-indigo-300">{sim.loanTerm}yr</strong></span>
                  </div>
                )}
              </div>
            )}

            {/* Impact metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1">Probability Change</p>
                <DeltaBadge delta={probDelta} />
                <p className="text-2xl font-bold text-white font-mono mt-1">
                  {Math.round(origResult.probability * 100)}% → {Math.round(simResult.probability * 100)}%
                </p>
              </div>
              <div className="glass rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1">Risk Score Change</p>
                <DeltaBadge delta={-riskDelta} />
                <p className="text-2xl font-bold text-white font-mono mt-1">
                  {origResult.riskScore} → {simResult.riskScore}
                </p>
              </div>
            </div>

            {isLoading && <p className="text-xs text-slate-400">Running the saved Random Forest on the modified application...</p>}
            {error && <p className="text-xs text-red-300">{error}</p>}

            {/* Side by side */}
            <div className="flex gap-4">
              <CompareColumn
                label="Current Result"
                eligible={origResult.eligible}
                probability={origResult.probability}
                riskScore={origResult.riskScore}
                riskCategory={origResult.riskCategory}
              />
              <div className="flex items-center">
                <div className="text-2xl text-slate-500">→</div>
              </div>
              <CompareColumn
                label="Simulated Result"
                eligible={simResult.eligible}
                probability={simResult.probability}
                riskScore={simResult.riskScore}
                riskCategory={simResult.riskCategory}
                highlight
              />
            </div>

            {/* Feature impact */}
            <div className="glass rounded-2xl p-5">
              <h3 className="text-white font-semibold text-sm mb-4">Feature Impact Comparison</h3>
              <div className="space-y-3">
                {origResult.shapValues.slice(0, 5).map((ov) => {
                  const sv = simResult.shapValues.find((s) => s.feature === ov.feature);
                  if (!sv) return null;
                  const delta = sv.value - ov.value;
                  return (
                    <div key={ov.feature} className="text-xs">
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-400">{ov.feature}</span>
                        <span className={delta === 0 ? 'text-slate-500' : delta > 0 ? 'text-emerald-400' : 'text-red-400'}>
                          {delta === 0 ? 'unchanged' : `${delta > 0 ? '+' : ''}${delta.toFixed(3)}`}
                        </span>
                      </div>
                      <div className="flex gap-2 items-center">
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-slate-400/40" style={{ width: `${(Math.abs(ov.value) / 0.5) * 100}%` }} />
                        </div>
                        <span className="text-slate-500">→</span>
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(Math.abs(sv.value) / 0.5) * 100}%`,
                              background: sv.direction === 'positive' ? '#34d399' : '#f87171',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
