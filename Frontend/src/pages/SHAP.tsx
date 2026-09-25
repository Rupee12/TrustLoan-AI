import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import type { Page, PredictionResult } from '../types';

interface SHAPProps {
  result: PredictionResult;
  onNavigate: (page: Page) => void;
}

const explanations: Record<string, { pos: string; neg: string }> = {
  'CIBIL Score': {
    pos: 'Your CIBIL score is strong, which strongly signals creditworthiness to the model.',
    neg: 'A low CIBIL score is the leading negative factor. Improving it could significantly boost eligibility.',
  },
  'Annual Income': {
    pos: 'Your income comfortably supports the loan repayments, increasing predicted eligibility.',
    neg: 'Your income relative to the loan amount reduced the model\'s confidence.',
  },
  'Loan-to-Asset Ratio': {
    pos: 'Your assets far exceed the loan amount, providing strong collateral coverage.',
    neg: 'The loan amount is high relative to your total assets, increasing perceived risk.',
  },
  'Loan Amount': {
    pos: 'The requested amount is within a range the model considers low-risk.',
    neg: 'The requested loan amount is large relative to your financial profile, reducing confidence.',
  },
  'Total Assets': {
    pos: 'Strong asset base provides security and improves the model\'s risk assessment.',
    neg: 'Limited asset coverage compared to loan size reduced eligibility probability.',
  },
  'Debt-to-Income Ratio': {
    pos: 'Low debt obligation relative to income indicates strong repayment capacity.',
    neg: 'High debt-to-income ratio signals potential repayment stress.',
  },
  'Education': {
    pos: 'Graduate education is associated with higher income stability in the training data.',
    neg: 'Education level has a small negative effect in the model\'s learned patterns.',
  },
  'Self Employment': {
    pos: 'Salaried employment provides income stability, which the model favors.',
    neg: 'Self-employed income can be variable; the model applies a small risk adjustment.',
  },
  'No. of Dependents': {
    pos: 'Few dependents means lower financial obligations, supporting repayment capacity.',
    neg: 'Higher dependents increase financial obligations, slightly reducing eligibility.',
  },
};

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: { feature: string; value: number; direction: string; rawValue: string | number } }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const info = explanations[d.feature];
  return (
    <div className="glass-bright rounded-xl p-4 max-w-xs border border-white/15 shadow-2xl">
      <p className="text-white font-semibold text-sm mb-1">{d.feature}</p>
      <p className="text-xs font-mono mb-2" style={{ color: d.direction === 'positive' ? '#34d399' : '#f87171' }}>
        SHAP: {d.direction === 'positive' ? '+' : ''}{d.value.toFixed(3)} · Value: {d.rawValue}
      </p>
      <p className="text-xs text-slate-400 leading-relaxed">
        {info ? (d.direction === 'positive' ? info.pos : info.neg) : ''}
      </p>
    </div>
  );
}

export default function SHAP({ result, onNavigate }: SHAPProps) {
  const { shapValues, eligible, probability } = result;

  const chartData = [...shapValues].sort((a, b) => a.value - b.value);

  return (
    <div className="min-h-screen px-4 py-10 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <button onClick={() => onNavigate('result')} className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 mb-4 transition-colors">
              ← Back to Result
            </button>
            <h1 className="text-3xl font-bold text-white mb-1">Why Did the Model Predict This?</h1>
            <p className="text-slate-400 text-sm">SHAP (SHapley Additive exPlanations) values quantify each feature's contribution to the prediction.</p>
          </div>
          <div className="flex items-center gap-2 glass border border-violet-500/30 rounded-full px-4 py-2">
            <span className="w-2 h-2 rounded-full bg-violet-400" />
            <span className="text-xs font-semibold text-violet-300">Powered by Explainable AI</span>
          </div>
        </div>

        {/* Prediction summary */}
        <div className="glass rounded-2xl p-5 mb-6 flex flex-wrap items-center gap-6">
          <div>
            <p className="text-xs text-slate-400">Prediction</p>
            <p className={`text-lg font-bold ${eligible ? 'text-emerald-400' : 'text-red-400'}`}>
              {eligible ? '✓ Likely Eligible' : '✗ Not Eligible'}
            </p>
          </div>
          <div className="h-10 w-px bg-white/10" />
          <div>
            <p className="text-xs text-slate-400">Confidence</p>
            <p className="text-lg font-bold text-white font-mono">{Math.round(probability * 100)}%</p>
          </div>
          <div className="h-10 w-px bg-white/10" />
          <div className="flex-1">
            <p className="text-xs text-slate-400 mb-1.5">Probability</p>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${probability * 100}%`,
                  background: eligible ? 'linear-gradient(90deg, #3b82f6, #22c55e)' : 'linear-gradient(90deg, #f59e0b, #ef4444)',
                }}
              />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Chart */}
          <div className="lg:col-span-3 glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-white font-semibold">Feature Contribution (SHAP Values)</h2>
            </div>
            <p className="text-xs text-slate-500 mb-5">
              <span className="inline-block w-3 h-3 rounded-sm mr-1" style={{ background: '#34d399', verticalAlign: 'middle' }} />Positive impact &nbsp;
              <span className="inline-block w-3 h-3 rounded-sm mr-1" style={{ background: '#f87171', verticalAlign: 'middle' }} />Negative impact
            </p>

            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 110 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                  tickLine={false}
                  tickFormatter={(v) => v.toFixed(2)}
                />
                <YAxis
                  type="category"
                  dataKey="feature"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={108}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20}>
                  {chartData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.direction === 'positive' ? '#34d399' : '#f87171'}
                      opacity={0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Explanation cards */}
          <div className="lg:col-span-2 space-y-3 overflow-y-auto max-h-[440px] pr-1">
            {shapValues.map((sv) => {
              const info = explanations[sv.feature];
              const isPos = sv.direction === 'positive';
              return (
                <div
                  key={sv.feature}
                  className={`rounded-xl p-4 border text-sm ${
                    isPos ? 'border-emerald-500/20 bg-emerald-500/[0.06]' : 'border-red-500/20 bg-red-500/[0.06]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="font-semibold text-white text-xs">{sv.feature}</p>
                      <p className="text-xs text-slate-400 font-mono">{sv.rawValue}</p>
                    </div>
                    <span className={`text-xs font-mono font-bold shrink-0 ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isPos ? '+' : ''}{sv.value.toFixed(3)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {info ? (isPos ? info.pos : info.neg) : ''}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Feature importance ranking */}
        <div className="glass rounded-2xl p-6 mt-6">
          <h3 className="text-white font-semibold mb-4">Feature Importance Ranking</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {shapValues.map((sv, i) => {
              const absMax = Math.max(...shapValues.map((s) => Math.abs(s.value)));
              const pctWidth = (Math.abs(sv.value) / absMax) * 100;
              return (
                <div key={sv.feature} className="glass-bright rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono text-slate-500 w-5">#{i + 1}</span>
                    <span className="text-xs text-white font-medium">{sv.feature}</span>
                    <span className={`ml-auto text-xs font-mono ${sv.direction === 'positive' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {sv.direction === 'positive' ? '+' : ''}{sv.value.toFixed(3)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pctWidth}%`,
                        background: sv.direction === 'positive' ? '#34d399' : '#f87171',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 glass border border-indigo-500/20 rounded-xl p-4 text-xs text-slate-400">
          <strong className="text-indigo-300">About SHAP:</strong> SHAP (SHapley Additive exPlanations) explains model predictions. Each value represents a feature contribution relative to a baseline; it is not causal evidence. Values are computed with TreeExplainer on the deployed Random Forest after the saved preprocessing pipeline.
        </div>
      </div>
    </div>
  );
}
