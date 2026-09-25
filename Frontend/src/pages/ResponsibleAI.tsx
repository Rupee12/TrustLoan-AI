import type { Page } from '../types';

interface ResponsibleAIProps {
  onNavigate: (page: Page) => void;
}

const principles = [
  {
    icon: '🔍',
    color: 'from-violet-500 to-purple-600',
    title: 'Explainability',
    description:
      'Every prediction is accompanied by SHAP values that quantify each feature\'s contribution. Users can understand why a decision was made, not just what the decision was.',
    items: ['SHAP TreeExplainer on Random Forest', 'Per-prediction feature attribution', 'Human-readable explanation cards', 'Feature importance visualisation'],
  },
  {
    icon: '⚠️',
    color: 'from-amber-500 to-orange-500',
    title: 'Model Limitations',
    description:
      'Our model is trained on historical loan data and may not capture all relevant factors. It provides probabilistic assessments, not deterministic decisions.',
    items: ['4,269 public dataset records', 'No external validation yet', 'Potential dataset bias', 'Not a substitute for lender judgment'],
  },
  {
    icon: '⚖️',
    color: 'from-blue-500 to-cyan-500',
    title: 'Fairness Monitoring',
    description:
      'The dataset and model may contain biases that do not represent all real borrowers. This project has not completed external fairness validation.',
    items: ['No external validation yet', 'Potential dataset bias', 'No bank policy integration', 'Fairness review is still required'],
  },
  {
    icon: '📊',
    color: 'from-emerald-500 to-teal-500',
    title: 'Data Quality',
    description:
      'Model training used curated, cleaned financial data with documented preprocessing steps. Input validation ensures data integrity at prediction time.',
    items: ['Missing value imputation documented', 'Outlier detection and capping', 'Feature scaling and normalisation', 'Train/test/validation splits maintained'],
  },
  {
    icon: '🔐',
    color: 'from-indigo-500 to-violet-500',
    title: 'Prediction Transparency',
    description:
      'Prediction probabilities, confidence levels, and risk categories are shown openly. The model does not hide uncertainty — it quantifies and communicates it.',
    items: ['Calibrated probability outputs', 'Risk category alongside prediction', 'Confidence intervals shown', 'No opaque black-box decisions'],
  },
  {
    icon: '👁️',
    color: 'from-rose-500 to-pink-500',
    title: 'Human Oversight',
    description:
      'AI predictions are advisory tools to inform, not replace, human judgment. Final lending decisions should always involve qualified human review.',
    items: ['AI as decision support, not decision maker', 'Human-in-the-loop recommended', 'Model outputs are probabilistic only', 'Appeals process for all applicants'],
  },
];

export default function ResponsibleAI({ onNavigate }: ResponsibleAIProps) {
  return (
    <div className="min-h-screen px-4 py-10 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 glass border border-violet-500/30 rounded-full px-4 py-2 mb-5">
            <span className="w-2 h-2 rounded-full bg-violet-400" />
            <span className="text-xs font-semibold text-violet-300">Responsible AI Framework</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">AI You Can Trust</h1>
          <p className="text-slate-400 text-base max-w-2xl mx-auto leading-relaxed">
            TrustLoan AI is built on a foundation of transparency, fairness, and accountability. We believe powerful AI tools must be accompanied by clear explanations and human oversight.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {principles.map((p) => (
            <div key={p.title} className="glass rounded-2xl p-6 hover:bg-white/[0.06] transition-all group">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${p.color} flex items-center justify-center text-2xl mb-4 shadow-lg group-hover:-translate-y-1 transition-transform`}>
                {p.icon}
              </div>
              <h3 className="text-white font-semibold text-base mb-2">{p.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">{p.description}</p>
              <ul className="space-y-1.5">
                {p.items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="glass border border-amber-500/20 rounded-2xl p-8">
          <h2 className="text-white font-semibold text-xl mb-4 flex items-center gap-2">
            <span>⚠️</span> Important Disclaimer
          </h2>
          <div className="space-y-3 text-sm text-slate-400 leading-relaxed">
            <p>
              TrustLoan AI is an academic demonstration project developed as part of an MCA program. The predictions generated by this system are based on machine learning models trained on publicly available datasets and are intended solely for educational purposes.
            </p>
            <p>
              <strong className="text-white">This tool does not constitute financial advice</strong> and should not be used as the basis for actual lending decisions. Actual loan eligibility is determined by registered financial institutions based on their proprietary criteria, regulatory requirements, and comprehensive applicant assessment.
            </p>
            <p>
              Dataset facts: 4,269 records, 2,656 approved and 1,613 rejected. Final Random Forest held-out test metrics are 98.13% accuracy, 98.14% precision, 98.13% recall, 98.12% F1, and 99.83% ROC-AUC. These are test-set results, not real-world guarantees.
            </p>
            <p>
              SHAP is explanatory, not causal. The TrustLoan Model Risk Score is not CIBIL, there is no external bank-policy integration or external validation yet, and real financial decisions require qualified human review.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
