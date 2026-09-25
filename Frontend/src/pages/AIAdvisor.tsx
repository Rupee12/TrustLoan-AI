import { useState, useRef, useEffect } from 'react';
import type { FormData, Page, PredictionResult } from '../types';
import type { WhatIfComparison } from '../types';
import { formatCurrency } from '../utils/predict';
import { requestAdvisor } from '../utils/phase2';

interface AIAdvisorProps {
  result: PredictionResult | null;
  formData: FormData;
  whatIf: WhatIfComparison | null;
  onNavigate: (page: Page) => void;
}

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

function generateResponse(question: string, result: PredictionResult | null, formData: FormData): string {
  const eligible = result?.eligible;
  const prob = result ? Math.round(result.probability * 100) : null;
  const topFactor = result?.shapValues[0];
  const cibil = formData.cibilScore;
  const q = question.toLowerCase();

  if (!result) {
    return "I don't have your assessment results yet. Please complete the Eligibility Assessment first so I can provide personalised insights about your loan profile.";
  }

  if (q.includes('reject') || q.includes('why') || q.includes('not eligible')) {
    if (eligible) {
      return `Your profile was actually predicted as **likely eligible** with ${prob}% confidence! The primary driver was your ${topFactor?.feature} (${topFactor?.rawValue}). If you're looking to maximise your approval chances, I'd recommend maintaining your CIBIL score above 750 and ensuring your debt-to-income ratio stays below 40%.`;
    }
    return `Your application was predicted as unlikely to be approved with ${prob}% confidence. The top negative factor was **${topFactor?.feature}** (current value: ${topFactor?.rawValue}). ${
      cibil < 650
        ? 'Your CIBIL score of ' + cibil + ' is below the typical threshold of 650. This is the single most impactful factor to address.'
        : 'The loan amount relative to your income and assets appears high. Consider reducing the loan amount or increasing your documented income.'
    }`;
  }

  if (q.includes('cibil') || q.includes('credit score') || q.includes('improve')) {
    return `Your current CIBIL score is **${cibil}**. ${
      cibil >= 750
        ? 'This is excellent! Maintain it by paying EMIs on time, keeping credit utilisation below 30%, and avoiding multiple loan inquiries.'
        : cibil >= 650
        ? 'This is fair. To improve: (1) Pay all dues on time for the next 6 months, (2) Reduce credit card utilisation below 30%, (3) Avoid new hard enquiries. A score of 720+ could increase your approval probability significantly.'
        : 'This is below the preferred threshold. Priority actions: (1) Clear any outstanding defaults immediately, (2) Set up auto-pay for all EMIs, (3) Don\'t apply for new credit for 6 months. Improving to 700+ could increase your probability by 20–30%.'
    }`;
  }

  if (q.includes('factor') || q.includes('affect') || q.includes('influence')) {
    const top3 = result.shapValues.slice(0, 3);
    return `The top 3 factors influencing your prediction are:\n\n1. **${top3[0].feature}** (${top3[0].rawValue}) — SHAP: ${top3[0].value.toFixed(3)}\n2. **${top3[1].feature}** (${top3[1].rawValue}) — SHAP: ${top3[1].value.toFixed(3)}\n3. **${top3[2].feature}** (${top3[2].rawValue}) — SHAP: ${top3[2].value.toFixed(3)}\n\nView the full SHAP analysis for detailed explanations of each factor's contribution.`;
  }

  if (q.includes('eligibility') || q.includes('improve eligibility') || q.includes('better')) {
    return `To improve your loan eligibility:\n\n• **CIBIL Score**: ${cibil < 700 ? 'Priority action — aim for 720+' : 'Maintain your current strong score'}\n• **Reduce Loan Amount**: Try ${formatCurrency(Math.round(formData.loanAmount * 0.8))} instead of ${formatCurrency(formData.loanAmount)}\n• **Increase Assets**: Document all assets formally with bank statements\n• **Extend Loan Term**: A longer term reduces monthly EMI burden, improving DTI ratio\n• **Income Documentation**: Ensure all income sources are formally documented\n\nRun the What-If Analysis to see quantified impact of each change.`;
  }

  if (q.includes('explain') || q.includes('simply') || q.includes('simple')) {
    return `Here's your assessment in simple terms:\n\nThe AI looked at ${Object.keys(formData).length} things about you — your credit score (${cibil}), income (${formatCurrency(formData.annualIncome)}), assets, and the loan you want (${formatCurrency(formData.loanAmount)} for ${formData.loanTerm} months).\n\nBased on patterns learned from thousands of real loan applications, it calculated a **${prob}% probability** of approval.\n\n${eligible ? '✅ Good news: your profile looks strong enough for approval.' : '⚠️ The main concern is the balance between what you\'re borrowing and your current financial standing. Small improvements could make a significant difference.'}\n\nWant me to explain any specific aspect in more detail?`;
  }

  if (q.includes('asset') || q.includes('income') || q.includes('salary')) {
    return `Your current financial summary:\n\n• Annual Income: **${formatCurrency(formData.annualIncome)}** (monthly: ~${formatCurrency(Math.round(formData.annualIncome / 12))})\n• Total Assets: **${formatCurrency(formData.residentialAssets + formData.commercialAssets + formData.luxuryAssets + formData.bankAssets)}**\n• Loan-to-Asset Coverage: ${((formData.loanAmount / (formData.residentialAssets + formData.commercialAssets + formData.luxuryAssets + formData.bankAssets)) * 100).toFixed(0)}%\n\nThe model uses income as a proxy for repayment capacity and assets as collateral security. Both factors contribute to the final probability.`;
  }

  return `That's a great question about your loan assessment. Your prediction shows **${prob}% confidence** of ${eligible ? 'approval' : 'rejection'} based on your CIBIL score of ${cibil} and income of ${formatCurrency(formData.annualIncome)}.\n\nFor a deeper dive:\n• View the **Explainable AI** section for SHAP factor analysis\n• Try the **What-If Analysis** to simulate profile improvements\n• Check the **Full Report** for a comprehensive summary\n\nIs there something specific about your assessment you'd like me to explain?`;
}

const suggestedPrompts = [
  "Why was my application predicted this way?",
  "What factors affected my score most?",
  "How can I improve my eligibility?",
  "Explain my assessment in simple terms",
  "What happens if I increase my CIBIL score?",
];

export default function AIAdvisor({ result, formData, whatIf, onNavigate }: AIAdvisorProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'ai',
      content: result
        ? `Hi! I'm your TrustLoan AI Advisor. Ask me about your assessment, prediction, SHAP factors, risk score, or What-If results.`
        : `Hi! I'm your TrustLoan AI Advisor. Complete an eligibility assessment first, then I can explain your model result, SHAP factors, risk score, and What-If results.`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTyping(true);
    try {
      const response = result
        ? await requestAdvisor({ question: text.trim(), result, formData, whatIf })
        : { configured: false, message: 'AI Advisor is not configured. Complete an assessment first.' };
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          content: response.configured ? response.explanation ?? 'The advisor returned no explanation.' : response.message ?? 'AI Advisor is not configured.',
          timestamp: new Date(),
        },
      ]);
    } catch (reason) {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'ai', content: reason instanceof Error ? reason.message : 'AI Advisor is unavailable.', timestamp: new Date() },
      ]);
    } finally {
      setTyping(false);
    }
  };

  function renderContent(text: string) {
    return text.split('\n').map((line, i) => {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={i} className={i > 0 && line === '' ? 'my-1' : 'leading-relaxed'}>
          {parts.map((part, j) =>
            j % 2 === 1 ? <strong key={j} className="text-white font-semibold">{part}</strong> : part
          )}
        </p>
      );
    });
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen max-h-screen overflow-hidden">
      {/* Context panel */}
      <div className="lg:w-64 shrink-0 border-r border-white/[0.06] p-5 overflow-y-auto">
        <h2 className="text-white font-semibold text-base mb-1">TrustLoan AI Advisor</h2>
        <p className="text-slate-400 text-xs mb-5">Ask questions about your loan assessment</p>

        {result && (
          <div className="space-y-3 mb-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Your Context</p>
            {[
              { label: 'Prediction', value: result.eligible ? '✓ Eligible' : '✗ Not Eligible', color: result.eligible ? 'text-emerald-400' : 'text-red-400' },
              { label: 'Probability', value: `${Math.round(result.probability * 100)}%`, color: 'text-white' },
              { label: 'Risk Score', value: String(result.riskScore), color: 'text-white' },
              { label: 'Risk Level', value: result.riskCategory, color: 'text-white' },
            ].map((item) => (
              <div key={item.label} className="glass rounded-xl p-3">
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className={`text-sm font-semibold ${item.color}`}>{item.value}</p>
              </div>
            ))}
            <div className="glass rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-2">Top Factors</p>
              {result.shapValues.slice(0, 3).map((sv) => (
                <div key={sv.feature} className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400 truncate">{sv.feature}</span>
                  <span className={sv.direction === 'positive' ? 'text-emerald-400' : 'text-red-400'}>
                    {sv.direction === 'positive' ? '+' : ''}{sv.value.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!result && (
          <button
            onClick={() => onNavigate('eligibility')}
            className="w-full bg-gradient-primary text-white px-4 py-3 rounded-xl text-xs font-semibold hover:opacity-90 transition-all"
          >
            Complete Assessment →
          </button>
        )}

        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Quick Links</p>
          {[
            { label: 'SHAP Analysis', page: 'shap' as Page },
            { label: 'What-If', page: 'whatif' as Page },
            { label: 'Full Report', page: 'report' as Page },
          ].map((l) => (
            <button
              key={l.label}
              onClick={() => onNavigate(l.page)}
              className="w-full text-left text-xs text-slate-400 hover:text-indigo-300 px-2 py-1.5 rounded-lg hover:bg-indigo-500/10 transition-all"
            >
              → {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 fade-in-up ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {msg.role === 'ai' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_15px_rgba(99,102,241,0.4)]">
                  <span className="text-white text-xs font-bold">AI</span>
                </div>
              )}
              <div
                className={`max-w-[78%] rounded-2xl px-5 py-3.5 text-sm space-y-1 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-blue-600/80 to-indigo-600/80 text-white ml-auto rounded-tr-sm'
                    : 'glass text-slate-300 rounded-tl-sm'
                }`}
              >
                {renderContent(msg.content)}
                <p className="text-xs opacity-40 mt-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {typing && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">AI</span>
              </div>
              <div className="glass rounded-2xl rounded-tl-sm px-5 py-4">
                <div className="flex gap-1.5">
                  {[0, 150, 300].map((delay) => (
                    <div
                      key={delay}
                      className="w-2 h-2 rounded-full bg-indigo-400 pulse-dot"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggested prompts */}
        <div className="px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {suggestedPrompts.map((p) => (
              <button
                key={p}
                onClick={() => void sendMessage(p)}
                className="shrink-0 glass border border-white/10 text-slate-300 text-xs px-3 py-2 rounded-full hover:bg-white/[0.07] hover:text-white transition-all"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="px-4 pb-5">
          <div className="glass-bright rounded-2xl border border-white/10 flex items-center gap-3 px-4 py-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && void sendMessage(input)}
              placeholder="Ask about your assessment..."
              className="flex-1 bg-transparent text-white text-sm placeholder-slate-500 outline-none"
            />
            <button
              onClick={() => void sendMessage(input)}
              disabled={!input.trim() || typing}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-40"
              aria-label="Send message"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
