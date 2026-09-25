import type { Page } from '../types';

interface HomeProps {
  onNavigate: (page: Page) => void;
}

function TrustBadge({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="glass flex items-center gap-2.5 px-4 py-2.5 rounded-full border border-white/10">
      <span className="text-lg">{icon}</span>
      <span className="text-sm font-medium text-slate-300">{label}</span>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-3xl font-bold gradient-text" style={{ fontFamily: 'Outfit, sans-serif' }}>{value}</p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
    </div>
  );
}

// Decorative AI visualization
function AIViz() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Outer ring */}
      <div className="absolute w-72 h-72 rounded-full border border-indigo-500/20 animate-spin" style={{ animationDuration: '30s' }} />
      <div className="absolute w-56 h-56 rounded-full border border-violet-500/20 animate-spin" style={{ animationDuration: '20s', animationDirection: 'reverse' }} />
      <div className="absolute w-40 h-40 rounded-full border border-cyan-500/20 animate-spin" style={{ animationDuration: '15s' }} />

      {/* Orbit dots */}
      {[0, 60, 120, 180, 240, 300].map((deg, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            background: i % 2 === 0 ? '#6366f1' : '#06b6d4',
            transform: `rotate(${deg}deg) translateX(108px)`,
            boxShadow: `0 0 8px ${i % 2 === 0 ? '#6366f1' : '#06b6d4'}`,
          }}
        />
      ))}

      {/* Center */}
      <div className="relative z-10 glass-bright rounded-2xl p-6 text-center glow-violet float">
        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        </div>
        <p className="text-xs text-slate-400 font-medium">ML Confidence</p>
        <p className="text-2xl font-bold text-white">94.2%</p>
      </div>

      {/* Floating cards */}
      <div className="absolute top-4 right-8 glass rounded-xl px-3 py-2 text-xs float" style={{ animationDelay: '1s' }}>
        <p className="text-slate-400">CIBIL Score</p>
        <p className="text-emerald-400 font-bold font-mono">720 ✓</p>
      </div>
      <div className="absolute bottom-8 left-4 glass rounded-xl px-3 py-2 text-xs float" style={{ animationDelay: '2s' }}>
        <p className="text-slate-400">Risk Level</p>
        <p className="text-blue-400 font-bold">Low Risk</p>
      </div>
      <div className="absolute top-16 left-0 glass rounded-xl px-3 py-2 text-xs float" style={{ animationDelay: '0.5s' }}>
        <p className="text-slate-400">SHAP</p>
        <p className="text-violet-400 font-bold">Explained</p>
      </div>
    </div>
  );
}

export default function Home({ onNavigate }: HomeProps) {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 lg:px-12 pt-16 pb-20 grid-overlay">
        {/* Background gradient blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-600/5 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 glass border border-indigo-500/30 rounded-full px-4 py-2 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
              <span className="text-xs text-slate-300 font-medium">Random Forest + Explainable AI</span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight text-white mb-6">
              Know Your Loan
              <br />
              <span className="gradient-text">Eligibility</span>
              <br />
              Before You Apply
            </h1>

            <p className="text-slate-400 text-lg leading-relaxed mb-10 max-w-xl">
              TrustLoan AI combines machine learning, explainable AI, and generative models to assess your loan eligibility — transparently, accurately, and instantly.
            </p>

            <div className="flex flex-wrap gap-4 mb-12">
              <button
                onClick={() => onNavigate('eligibility')}
                className="bg-gradient-primary text-white px-8 py-3.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-all shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:shadow-[0_0_40px_rgba(99,102,241,0.6)] hover:-translate-y-0.5"
              >
                Check Eligibility →
              </button>
              <button
                onClick={() => onNavigate('advisor')}
                className="glass border border-white/15 text-white px-8 py-3.5 rounded-xl font-semibold text-sm hover:bg-white/[0.08] transition-all hover:-translate-y-0.5"
              >
                Talk to AI Advisor
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              <TrustBadge icon="🤖" label="Machine Learning" />
              <TrustBadge icon="🔍" label="Explainable AI" />
              <TrustBadge icon="💬" label="AI Advisor" />
            </div>
          </div>

          {/* Right — visualization */}
          <div className="relative h-80 lg:h-[420px] hidden lg:block">
            <AIViz />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/[0.06] py-8 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatCard value="98.13%" label="Held-out Test Accuracy" />
          <StatCard value="99.83%" label="Held-out Test ROC-AUC" />
          <StatCard value="11" label="Model Features Used" />
          <StatCard value="<1s" label="Prediction Time" />
        </div>
      </section>

      {/* Features */}
      <section className="px-6 lg:px-12 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-indigo-400 text-sm font-semibold uppercase tracking-widest mb-3">Why TrustLoan AI</p>
            <h2 className="text-4xl font-bold text-white">Intelligent. Transparent. Trustworthy.</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                color: 'from-blue-500 to-cyan-500',
                icon: '🧠',
                title: 'Machine Learning',
                desc: 'A tuned Random Forest evaluated at 98.13% accuracy on the held-out test set. Multiple benchmark models were compared.',
                action: 'insights' as Page,
                cta: 'View Model Metrics',
              },
              {
                color: 'from-violet-500 to-purple-600',
                icon: '🔍',
                title: 'Explainable AI (XAI)',
                desc: 'SHAP values reveal exactly which factors drove your prediction — income, CIBIL score, assets — with quantified contributions.',
                action: 'shap' as Page,
                cta: 'Explore SHAP',
              },
              {
                color: 'from-indigo-500 to-blue-600',
                icon: '💬',
                title: 'Conversational AI',
                desc: 'Ask our NLP-powered advisor about your assessment in plain English. Get actionable improvement guidance instantly.',
                action: 'advisor' as Page,
                cta: 'Ask AI Advisor',
              },
              {
                color: 'from-cyan-500 to-teal-500',
                icon: '⚗️',
                title: 'What-If Analysis',
                desc: 'Simulate changes to your financial profile and see how they would affect eligibility probability in real time.',
                action: 'whatif' as Page,
                cta: 'Try Simulation',
              },
              {
                color: 'from-purple-500 to-pink-500',
                icon: '📄',
                title: 'Full Report',
                desc: 'Generate a comprehensive eligibility report including SHAP, scenario analysis, and AI-written summary — exportable as PDF.',
                action: 'report' as Page,
                cta: 'View Report',
              },
              {
                color: 'from-amber-500 to-orange-500',
                icon: '🛡️',
                title: 'Responsible AI',
                desc: 'Built with fairness, transparency, and human oversight. Includes model limitations, bias monitoring, and decision explainability.',
                action: 'responsible' as Page,
                cta: 'Learn More',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="glass rounded-2xl p-6 hover:bg-white/[0.06] transition-all group cursor-pointer hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(99,102,241,0.15)]"
                onClick={() => onNavigate(f.action)}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-2xl mb-4 shadow-lg`}>
                  {f.icon}
                </div>
                <h3 className="text-white font-semibold text-base mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">{f.desc}</p>
                <button className="text-xs font-medium text-indigo-400 group-hover:text-indigo-300 transition-colors flex items-center gap-1">
                  {f.cta} <span>→</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="px-6 lg:px-12 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl p-10 lg:p-14 text-center" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.15), rgba(139,92,246,0.15))' }}>
            <div className="absolute inset-0 rounded-3xl border border-indigo-500/20" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-indigo-500/10 blur-3xl" />
            <p className="text-slate-400 text-sm font-medium mb-3">Ready to find out?</p>
            <h2 className="text-4xl font-bold text-white mb-4">Check Your Loan Eligibility in 60 Seconds</h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
              Answer a few simple questions about your finances. Our AI will assess your eligibility and explain the result clearly.
            </p>
            <button
              onClick={() => onNavigate('eligibility')}
              className="bg-gradient-primary text-white px-10 py-4 rounded-xl font-semibold hover:opacity-90 transition-all shadow-[0_0_30px_rgba(99,102,241,0.5)] hover:-translate-y-0.5"
            >
              Start Free Assessment →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
