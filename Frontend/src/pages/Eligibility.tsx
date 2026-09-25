import { useEffect, useState } from 'react';
import type { FormData, Page } from '../types';
import { defaultFormData } from '../types';
import { formatCurrency } from '../utils/predict';
import NlpApplication from '../components/NlpApplication';

interface EligibilityProps {
  formData: FormData;
  setFormData: (d: FormData) => void;
  onComplete: (data?: FormData) => Promise<void>;
  onNavigate: (page: Page) => void;
  isLoading: boolean;
  error: string | null;
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              i < current
                ? 'bg-gradient-to-br from-blue-500 to-violet-600 text-white'
                : i === current
                ? 'border-2 border-indigo-400 text-indigo-300'
                : 'border border-white/15 text-slate-500'
            }`}
          >
            {i < current ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              i + 1
            )}
          </div>
          {i < total - 1 && (
            <div className={`h-0.5 w-10 rounded-full transition-all ${i < current ? 'bg-indigo-500' : 'bg-white/10'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-2">
      <label className="text-sm font-medium text-slate-200">{children}</label>
      {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  step,
  prefix,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
}) {
  const [inputValue, setInputValue] = useState(String(value));

  useEffect(() => {
    setInputValue(String(value));
  }, [value]);

  const handleChange = (raw: string) => {
    setInputValue(raw);

    if (raw === '') {
      return;
    }

    const numericValue = Number(raw);

    if (!Number.isNaN(numericValue)) {
      onChange(numericValue);
    }
  };

  const handleBlur = () => {
    if (inputValue === '') {
      const fallback = min ?? 0;
      setInputValue(String(fallback));
      onChange(fallback);
      return;
    }

    let numericValue = Number(inputValue);

    if (Number.isNaN(numericValue)) {
      numericValue = min ?? 0;
    }

    if (min !== undefined) {
      numericValue = Math.max(min, numericValue);
    }

    if (max !== undefined) {
      numericValue = Math.min(max, numericValue);
    }

    setInputValue(String(numericValue));
    onChange(numericValue);
  };

  return (
    <div className="relative">
      {prefix && (
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-mono">
          {prefix}
        </span>
      )}

      <input
        type="number"
        value={inputValue}
        min={min}
        max={max}
        step={step}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        className={`w-full bg-white/[0.04] border border-white/10 rounded-xl py-3 text-white text-sm font-mono placeholder-slate-500 focus:border-indigo-500/60 focus:bg-white/[0.06] transition-all outline-none ${
          prefix ? 'pl-8 pr-4' : 'px-4'
        }`}
      />
    </div>
  );
}

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-[#0d1426] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-indigo-500/60 transition-all outline-none appearance-none"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
        checked ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-white/10 bg-white/[0.02]'
      }`}
    >
      <div className={`w-9 h-5 rounded-full relative transition-all ${checked ? 'bg-indigo-500' : 'bg-white/20'}`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${checked ? 'left-4' : 'left-0.5'}`} />
      </div>
      <span className="text-sm text-slate-300">{label}</span>
    </button>
  );
}

const steps = ['Personal Profile', 'Financial Information', 'Loan Details'];

export default function Eligibility({ formData, setFormData, onComplete, onNavigate, isLoading, error }: EligibilityProps) {
  const [step, setStep] = useState(0);

  const update = <K extends keyof FormData>(key: K, val: FormData[K]) =>
    setFormData({ ...formData, [key]: val });

  const totalAssets =
    formData.residentialAssets +
    formData.commercialAssets +
    formData.luxuryAssets +
    formData.bankAssets;

  return (
    <div className="min-h-screen px-4 py-10 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => onNavigate('home')}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 mb-4 transition-colors"
          >
            ← Back to Home
          </button>
          <h1 className="text-3xl font-bold text-white mb-1">Loan Eligibility Assessment</h1>
          <p className="text-slate-400 text-sm">Complete the form to receive your AI-powered eligibility prediction.</p>
        </div>

        <NlpApplication onAnalyze={onComplete} />

        {/* Step indicator */}
        <div className="glass rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <StepIndicator current={step} total={3} />
            <span className="text-xs text-slate-400 font-mono">{step + 1} / 3</span>
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">{steps[step]}</h2>
            <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-600 transition-all duration-500"
                style={{ width: `${((step + 1) / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Step 1: Personal */}
        {step === 0 && (
          <div className="glass rounded-2xl p-6 space-y-5">
            <div>
              <Label hint="Number of people financially dependent on you">Number of Dependents</Label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => update('dependents', Math.max(0, formData.dependents - 1))}
                  className="w-10 h-10 rounded-xl border border-white/10 text-white hover:bg-white/[0.06] transition-all font-bold"
                >
                  −
                </button>
                <span className="text-2xl font-bold text-white w-10 text-center" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {formData.dependents}
                </span>
                <button
                  onClick={() => update('dependents', Math.min(10, formData.dependents + 1))}
                  className="w-10 h-10 rounded-xl border border-white/10 text-white hover:bg-white/[0.06] transition-all font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <Label hint="Your highest level of education completed">Education Level</Label>
              <div className="grid grid-cols-2 gap-3">
                {['Graduate', 'Not Graduate'].map((v) => (
                  <button
                    key={v}
                    onClick={() => update('education', v as FormData['education'])}
                    className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                      formData.education === v
                        ? 'border-indigo-500/60 bg-indigo-500/15 text-indigo-300'
                        : 'border-white/10 text-slate-400 hover:bg-white/[0.04]'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label hint="Are you self-employed or running your own business?">Employment Status</Label>
              <ToggleSwitch
                checked={formData.selfEmployed}
                onChange={(v) => update('selfEmployed', v)}
                label={formData.selfEmployed ? 'Self Employed' : 'Salaried / Other'}
              />
            </div>
          </div>
        )}

        {/* Step 2: Financial */}
        {step === 1 && (
          <div className="glass rounded-2xl p-6 space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <Label hint="Gross annual income before taxes">Annual Income (₹)</Label>
                <NumberInput
                  value={formData.annualIncome}
                  onChange={(v) => update('annualIncome', v)}
                  min={0}
                  step={50000}
                  prefix="₹"
                />
                <p className="text-xs text-slate-500 mt-1">{formatCurrency(formData.annualIncome)}</p>
              </div>
              <div>
                <Label hint="Your credit score from credit bureaus (300–900)">CIBIL Score</Label>
                <NumberInput
                  value={formData.cibilScore}
                  onChange={(v) => update('cibilScore', v)}
                  min={300}
                  max={900}
                />
                <div className="mt-1 h-1 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${((formData.cibilScore - 300) / 600) * 100}%`,
                      background: formData.cibilScore >= 700 ? '#22c55e' : formData.cibilScore >= 600 ? '#f59e0b' : '#ef4444',
                    }}
                  />
                </div>
                <p className="text-xs mt-0.5" style={{ color: formData.cibilScore >= 700 ? '#22c55e' : formData.cibilScore >= 600 ? '#f59e0b' : '#ef4444' }}>
                  {formData.cibilScore >= 750 ? 'Excellent' : formData.cibilScore >= 700 ? 'Good' : formData.cibilScore >= 650 ? 'Fair' : 'Poor'}
                </p>
              </div>
            </div>

            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Asset Valuation (₹)</p>

            <div className="grid grid-cols-2 gap-4">
              {(
                [
                  ['residentialAssets', 'Residential Assets', 'House, flat, property'],
                  ['commercialAssets', 'Commercial Assets', 'Office, shop, warehouse'],
                  ['luxuryAssets', 'Luxury Assets', 'Vehicle, jewellery, etc.'],
                  ['bankAssets', 'Bank / Liquid Assets', 'FD, savings, stocks'],
                ] as const
              ).map(([key, label, hint]) => (
                <div key={key}>
                  <Label hint={hint}>{label}</Label>
                  <NumberInput
                    value={formData[key]}
                    onChange={(v) => update(key, v)}
                    min={0}
                    step={100000}
                    prefix="₹"
                  />
                  <p className="text-xs text-slate-500 mt-1">{formatCurrency(formData[key])}</p>
                </div>
              ))}
            </div>

            <div className="glass-bright rounded-xl p-3 flex items-center justify-between">
              <span className="text-sm text-slate-400">Total Assets</span>
              <span className="text-base font-bold text-white font-mono">{formatCurrency(totalAssets)}</span>
            </div>
          </div>
        )}

        {/* Step 3: Loan Details */}
        {step === 2 && (
          <div className="glass rounded-2xl p-6 space-y-5">
            <div>
              <Label hint="Total loan amount you wish to borrow">Requested Loan Amount (₹)</Label>
              <NumberInput
                value={formData.loanAmount}
                onChange={(v) => update('loanAmount', v)}
                min={100000}
                step={100000}
                prefix="₹"
              />
              <p className="text-xs text-slate-500 mt-1">{formatCurrency(formData.loanAmount)}</p>
            </div>

            <div>
              <Label hint="Repayment term in years, matching the trained model">Loan Term</Label>
              <SelectInput
                value={String(formData.loanTerm)}
                onChange={(v) => update('loanTerm', Number(v))}
                options={[
                  { value: '1', label: '1 year' },
                  { value: '2', label: '2 years' },
                  { value: '3', label: '3 years' },
                  { value: '5', label: '5 years' },
                  { value: '7', label: '7 years' },
                  { value: '10', label: '10 years' },
                  { value: '15', label: '15 years' },
                  { value: '20', label: '20 years' },
                ]}
              />
            </div>

            {/* Summary */}
            <div className="border border-white/[0.06] rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Application Summary</p>
              {[
                ['Income', formatCurrency(formData.annualIncome)],
                ['CIBIL Score', formData.cibilScore],
                ['Loan Amount', formatCurrency(formData.loanAmount)],
                ['Loan Term', `${formData.loanTerm} years`],
                ['Total Assets', formatCurrency(totalAssets)],
                ['Dependents', formData.dependents],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between text-sm">
                  <span className="text-slate-500">{k}</span>
                  <span className="text-white font-mono font-medium">{v}</span>
                </div>
              ))}
            </div>

            <div className="glass-bright border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300/80">
              This is a model prediction based on the saved Random Forest pipeline. It is not a guarantee of loan approval.
            </div>
          </div>
        )}

        {isLoading && <div className="glass-bright border border-indigo-500/30 rounded-xl p-3 mt-5 text-sm text-indigo-200">Waking up the prediction service. This may take up to a minute...</div>}
        {error && <div className="glass-bright border border-red-500/30 rounded-xl p-3 mt-5 text-sm text-red-300">{error}</div>}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => step > 0 ? setStep(step - 1) : onNavigate('home')}
            className="glass border border-white/10 text-slate-300 px-6 py-3 rounded-xl text-sm font-medium hover:bg-white/[0.06] transition-all"
          >
            ← {step > 0 ? 'Back' : 'Home'}
          </button>

          {step < 2 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="bg-gradient-primary text-white px-8 py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)]"
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={() => void onComplete()}
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-600 text-white px-8 py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              {isLoading ? 'Analyzing application...' : 'Analyze My Eligibility'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
