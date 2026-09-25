import type { FormData, Page, PredictionResult } from '../types';
import { formatCurrency } from '../utils/predict';

interface ResultProps {
  result: PredictionResult;
  formData: FormData;
  onNavigate: (page: Page) => void;
}

function ProgressRing({ value, size = 140, stroke = 10 }: { value: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - value);
  const isGood = value >= 0.5;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={`url(#ring-grad-${isGood ? 'good' : 'warn'})`}
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease-out' }}
      />
      <defs>
        <linearGradient id="ring-grad-good" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
        <linearGradient id="ring-grad-warn" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function MetricCard({ label, value, sub, icon, color }: { label: string; value: string; sub?: string; icon: string; color: string }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${color}`}>{icon}</div>
      </div>
      <p className="text-slate-400 text-xs font-medium mb-1">{label}</p>
      <p className="text-white text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{value}</p>
      {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

const riskColors = {
  'Low': { text: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30', icon: '●' },
  'Medium': { text: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30', icon: '▲' },
  'High': { text: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/30', icon: '▲' },
  'Very High': { text: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30', icon: '■' },
};

export default function Result({ result, formData, onNavigate }: ResultProps) {
  const { eligible, probability, riskScore, riskCategory, shapValues } = result;
  const pct = Math.round(probability * 100);
  const risk = riskColors[riskCategory];

  const totalAssets =
    formData.residentialAssets +
    formData.commercialAssets +
    formData.luxuryAssets +
    formData.bankAssets;

  return (
    <div className="min-h-screen px-4 py-10 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button onClick={() => onNavigate('eligibility')} className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 mb-4 transition-colors">
            ← Edit Application
          </button>
          <h1 className="text-3xl font-bold text-white">Loan Eligibility Assessment</h1>
          <p className="text-slate-400 text-sm mt-1">AI-powered prediction result based on your financial profile</p>
        </div>

        {/* Main result card */}
        <div className={`relative overflow-hidden rounded-3xl p-8 mb-6 border ${
          eligible
            ? 'border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-blue-500/10'
            : 'border-red-500/20 bg-gradient-to-br from-red-500/10 to-orange-500/10'
        }`}>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ background: eligible ? '#22c55e' : '#ef4444' }} />

          <div className="flex flex-col lg:flex-row items-center gap-8">
            {/* Ring */}
            <div className="relative shrink-0">
              <ProgressRing value={probability} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{pct}%</span>
                <span className="text-xs text-slate-400">Confidence</span>
              </div>
            </div>

            {/* Status */}
            <div className="flex-1 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-3">
                <span className="text-3xl">{eligible ? '✅' : '❌'}</span>
                <span className={`text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full border ${risk.bg} ${risk.text}`}>
                  {riskCategory} Risk
                </span>
              </div>
              <h2 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {eligible ? 'Likely Eligible' : 'Likely Not Eligible'}
              </h2>
              <p className="text-slate-400 text-sm max-w-md">
                {eligible
                  ? 'Based on your financial profile, the model predicts a high likelihood of loan approval. View the SHAP analysis to understand key contributing factors.'
                  : 'The model predicts a low probability of approval based on current profile. Use What-If Analysis to explore improvement scenarios.'}
              </p>

              <div className="flex flex-wrap gap-3 mt-5 justify-center lg:justify-start">
                <button
                  onClick={() => onNavigate('shap')}
                  className="glass-bright border border-indigo-500/30 text-indigo-300 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-500/15 transition-all"
                >
                  🔍 Why this result?
                </button>
                <button
                  onClick={() => onNavigate('whatif')}
                  className="glass border border-white/10 text-slate-300 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-white/[0.06] transition-all"
                >
                  ⚗️ What-If Analysis
                </button>
                <button
                  onClick={() => onNavigate('advisor')}
                  className="glass border border-white/10 text-slate-300 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-white/[0.06] transition-all"
                >
                  💬 Ask AI Advisor
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <MetricCard
            label="CIBIL Score"
            value={String(formData.cibilScore)}
            sub={formData.cibilScore >= 700 ? 'Good' : formData.cibilScore >= 650 ? 'Fair' : 'Poor'}
            icon="📊"
            color="bg-blue-500/15"
          />
          <MetricCard
            label="Annual Income"
            value={formatCurrency(formData.annualIncome)}
            sub="Gross per year"
            icon="💼"
            color="bg-emerald-500/15"
          />
          <MetricCard
            label="Loan Amount"
            value={formatCurrency(formData.loanAmount)}
            sub={`${formData.loanTerm} year term`}
            icon="🏦"
            color="bg-indigo-500/15"
          />
          <MetricCard
            label="Total Assets"
            value={formatCurrency(totalAssets)}
            sub="All asset classes"
            icon="🏠"
            color="bg-violet-500/15"
          />
          <MetricCard
            label="TrustLoan Model Risk Score"
            value={String(riskScore)}
            sub={`${riskCategory} Risk`}
            icon="🎯"
            color={eligible ? 'bg-emerald-500/15' : 'bg-red-500/15'}
          />
        </div>

        {/* Top factors */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-semibold">Top Influencing Factors</h3>
            <button
              onClick={() => onNavigate('shap')}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Full SHAP Analysis →
            </button>
          </div>
          <div className="space-y-3">
            {shapValues.slice(0, 5).map((sv) => {
              const absMax = Math.max(...shapValues.map((s) => Math.abs(s.value)));
              const pct = (Math.abs(sv.value) / absMax) * 100;
              return (
                <div key={sv.feature} className="flex items-center gap-4">
                  <div className="w-32 shrink-0 text-xs text-slate-400 text-right">{sv.feature}</div>
                  <div className="flex-1 h-5 bg-white/[0.04] rounded-full overflow-hidden relative">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: sv.direction === 'positive'
                          ? 'linear-gradient(90deg, #3b82f6, #22c55e)'
                          : 'linear-gradient(90deg, #f59e0b, #ef4444)',
                      }}
                    />
                  </div>
                  <div className={`w-20 text-xs font-mono shrink-0 ${sv.direction === 'positive' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {sv.direction === 'positive' ? '+' : ''}{sv.value.toFixed(3)}
                  </div>
                  <div className="text-xs font-mono text-slate-400 w-20 shrink-0 text-right">{sv.rawValue}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
