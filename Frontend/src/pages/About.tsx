import type { Page } from '../types';

interface AboutProps {
  onNavigate: (page: Page) => void;
}

const techStack = [
  { category: 'ML Framework', items: ['scikit-learn Pipeline', 'Random Forest', 'NumPy', 'Pandas'] },
  { category: 'Explainability', items: ['SHAP TreeExplainer', 'Transformed feature attribution'] },
  { category: 'Frontend', items: ['React 19', 'TypeScript 5.7', 'Vite 8', 'Tailwind CSS v4', 'Recharts 3.10'] },
  { category: 'AI / NLP', items: ['NLP extraction planned', 'Optional GenAI advisor planned'] },
];

export default function About({ onNavigate }: AboutProps) {
  return (
    <div className="min-h-screen px-4 py-10 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">About TrustLoan AI</h1>
          <p className="text-slate-400 text-sm">Model information, dataset details, and project documentation.</p>
        </div>

        {/* Project banner */}
        <div className="relative overflow-hidden rounded-3xl p-8 mb-8 border border-indigo-500/20"
          style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(99,102,241,0.12), rgba(139,92,246,0.08))' }}>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
          <h2 className="text-2xl font-bold text-white mb-2">Smarter Loan Decisions. Explained.</h2>
          <p className="text-slate-400 text-sm max-w-xl leading-relaxed mb-5">
            TrustLoan AI is an intelligent loan eligibility assessment platform developed as an MCA capstone project. It demonstrates a saved scikit-learn Random Forest pipeline and Explainable AI in the Indian fintech domain.
          </p>
          <div className="flex flex-wrap gap-2">
            {['MCA Academic Project', 'Machine Learning', 'XAI', 'Fintech'].map((tag) => (
              <span key={tag} className="text-xs font-medium text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-3 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Model info */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center text-xs text-indigo-400">🤖</span>
              Model Information
            </h3>
            <div className="space-y-3">
              {[
                ['Algorithm', 'Random Forest'],
                ['Version', 'Saved v2 pipeline'],
                ['Accuracy', '98.13% (held-out test set)'],
                ['ROC-AUC', '99.83% (held-out test set)'],
                ['F1 Score', '98.12% (held-out test set)'],
                ['Explainability', 'SHAP TreeExplainer'],
                ['Features Used', '11 input features'],
                ['Prediction Type', 'Binary Classification'],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between text-sm border-b border-white/[0.04] pb-2 last:border-0">
                  <span className="text-slate-500">{k}</span>
                  <span className="text-slate-200 font-medium text-right max-w-xs">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dataset info */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center text-xs text-cyan-400">📊</span>
              Dataset Information
            </h3>
            <div className="space-y-3">
              {[
                ['Source', 'Loan Prediction Dataset (public)'],
                ['Total Records', '4,269 loan applications'],
                ['Training Set', '2,990 records (70%)'],
                ['Validation Set', '641 records (15%)'],
                ['Test Set', '638 records (15%)'],
                ['Target Variable', 'Loan Status (Approved / Rejected)'],
                ['Class Distribution', '~61.9% Approved, ~38.1% Rejected'],
                ['Features', '11 raw → 9 engineered'],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between text-sm border-b border-white/[0.04] pb-2 last:border-0">
                  <span className="text-slate-500">{k}</span>
                  <span className="text-slate-200 font-medium text-right max-w-xs">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tech stack */}
        <div className="glass rounded-2xl p-6 mb-6">
          <h3 className="text-white font-semibold mb-5">Technology Stack</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {techStack.map((cat) => (
              <div key={cat.category}>
                <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">{cat.category}</p>
                <ul className="space-y-2">
                  {cat.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/60 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation cards */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { page: 'eligibility' as Page, icon: '📝', label: 'Start Assessment', desc: 'Check your loan eligibility' },
            { page: 'insights' as Page, icon: '📈', label: 'Model Insights', desc: 'View performance metrics' },
            { page: 'responsible' as Page, icon: '🛡️', label: 'Responsible AI', desc: 'Our ethical framework' },
          ].map((c) => (
            <button
              key={c.page}
              onClick={() => onNavigate(c.page)}
              className="glass rounded-2xl p-5 text-left hover:bg-white/[0.06] transition-all hover:-translate-y-0.5 group"
            >
              <span className="text-2xl block mb-2">{c.icon}</span>
              <p className="text-white font-semibold text-sm mb-1 group-hover:text-indigo-300 transition-colors">{c.label}</p>
              <p className="text-slate-500 text-xs">{c.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
