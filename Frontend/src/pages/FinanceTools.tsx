import { useState } from 'react';
import type { FormData, Page } from '../types';
import { formatCurrency } from '../utils/predict';
import {
  calculateEmi,
  answerKnowledge,
  matchLenders,
  searchKnowledge,
  type EmiResult,
  type KnowledgeResult,
  type LenderMatch,
} from '../utils/phase2';

interface FinanceToolsProps {
  formData: FormData;
  onNavigate: (page: Page) => void;
}

export default function FinanceTools({ formData, onNavigate }: FinanceToolsProps) {
  const [lenders, setLenders] = useState<LenderMatch[] | null>(null);
  const [emi, setEmi] = useState<EmiResult | null>(null);
  const [knowledge, setKnowledge] = useState<{ answer: string; results: KnowledgeResult[] } | null>(null);
  const [knowledgeAnswer, setKnowledgeAnswer] = useState<{
    configured: boolean;
    answer: string | null;
    message: string | null;
    results: KnowledgeResult[];
  } | null>(null);
  const [principal, setPrincipal] = useState(formData.loanAmount);
  const [interestRate, setInterestRate] = useState(12);
  const [tenureYears, setTenureYears] = useState(formData.loanTerm);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: string, operation: () => Promise<void>) => {
    setBusy(action);
    setError(null);
    try {
      await operation();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The request could not be completed.');
    } finally {
      setBusy(null);
    }
  };

  const findLenders = () => run('lenders', async () => {
    setLenders(await matchLenders(formData));
  });

  const runEmi = () => run('emi', async () => {
    setEmi(await calculateEmi(principal, interestRate, Math.round(tenureYears * 12)));
  });

  const search = () => run('knowledge', async () => {
    setKnowledge(await searchKnowledge(query));
    setKnowledgeAnswer(null);
  });

  const askKnowledge = () => run('knowledge-answer', async () => {
    setKnowledgeAnswer(await answerKnowledge(query));
  });

  return (
    <div className="min-h-screen px-4 py-10 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => onNavigate('home')} className="text-xs text-slate-400 hover:text-white mb-4">
          ← Back to Home
        </button>
        <h1 className="text-3xl font-bold text-white">Lenders & Financial Tools</h1>
        <p className="text-slate-400 text-sm mt-2">
          Personal-loan information is checked against published sources. Unknown criteria stay unknown;
          no result is an approval decision.
        </p>

        <section className="glass rounded-2xl p-6 mt-7 border border-indigo-500/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-indigo-300 uppercase tracking-widest">Published criteria</p>
              <h2 className="text-white text-xl font-semibold mt-1">Find potential lenders</h2>
              <p className="text-xs text-slate-400 mt-1">This compares only personal-loan criteria verified from official lender pages.</p>
            </div>
            <button onClick={() => void findLenders()} disabled={busy !== null} className="bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50">
              {busy === 'lenders' ? 'Checking…' : 'Compare my profile'}
            </button>
          </div>
          {lenders && (
            <div className="grid md:grid-cols-2 gap-4 mt-5">
              {lenders.map((lender) => (
                <article key={lender.lender_id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-white font-semibold">{lender.lender_name}</h3>
                    <span className={`text-xs text-right ${lender.status.startsWith('Potential') ? 'text-amber-300' : lender.status === 'Insufficient information' ? 'text-slate-300' : 'text-emerald-300'}`}>
                      {lender.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Personal loan · last verified {lender.last_verified}</p>
                  <div className="space-y-3 mt-4">
                    {lender.criteria.map((criterion) => (
                      <div key={criterion.criterion} className="text-xs">
                        <p className="text-slate-200">{criterion.criterion}: <span className={criterion.status === 'match' ? 'text-emerald-300' : criterion.status === 'mismatch' ? 'text-amber-300' : 'text-slate-400'}>{criterion.status}</span></p>
                        <p className="text-slate-400 mt-0.5">{criterion.explanation}</p>
                        {criterion.source_url && <a className="text-cyan-300 hover:underline" href={criterion.source_url} target="_blank" rel="noreferrer">Official criterion source</a>}
                      </div>
                    ))}
                  </div>
                  {lender.unknown_criteria.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-amber-200">Not established by the reviewed page</p>
                      <ul className="list-disc pl-4 mt-1 space-y-1 text-xs text-slate-400">
                        {lender.unknown_criteria.map((criterion) => <li key={criterion}>{criterion}</li>)}
                      </ul>
                    </div>
                  )}
                  <p className="text-xs text-slate-400 mt-4">{lender.caveat} Final eligibility and approval are determined by the lender.</p>
                  <div className="flex gap-4 mt-3 text-xs">
                    <a className="text-cyan-300 hover:underline" href={lender.product_url} target="_blank" rel="noreferrer">Official product page</a>
                    {lender.application_url && <a className="text-cyan-300 hover:underline" href={lender.application_url} target="_blank" rel="noreferrer">Official application page</a>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="glass rounded-2xl p-6 mt-5 border border-cyan-500/20">
          <p className="text-xs font-semibold text-cyan-300 uppercase tracking-widest">Deterministic calculation</p>
          <h2 className="text-white text-xl font-semibold mt-1">EMI calculator</h2>
          <p className="text-xs text-slate-400 mt-1">Illustrative mathematics only; the entered rate is not a bank quote.</p>
          <div className="grid sm:grid-cols-3 gap-3 mt-4">
            <label className="text-xs text-slate-400">Principal (₹)
              <input type="number" min="1" value={principal} onChange={(event) => setPrincipal(Number(event.target.value))} className="mt-1 w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
            </label>
            <label className="text-xs text-slate-400">Illustrative annual interest rate (%)
              <input type="number" min="0" max="60" step="0.1" value={interestRate} onChange={(event) => setInterestRate(Number(event.target.value))} className="mt-1 w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
            </label>
            <label className="text-xs text-slate-400">Tenure (years)
              <input type="number" min="0.1" max="40" step="0.1" value={tenureYears} onChange={(event) => setTenureYears(Number(event.target.value))} className="mt-1 w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
            </label>
          </div>
          <button onClick={() => void runEmi()} disabled={busy !== null} className="mt-4 bg-cyan-500/20 border border-cyan-400/30 text-cyan-200 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50">
            {busy === 'emi' ? 'Calculating…' : 'Calculate EMI'}
          </button>
          {emi && (
            <div className="grid sm:grid-cols-3 gap-3 mt-4">
              {[
                ['Monthly EMI', emi.monthly_emi],
                ['Total interest', emi.total_interest],
                ['Total payment', emi.total_payment],
              ].map(([label, amount]) => (
                <div key={String(label)} className="rounded-xl bg-white/[0.04] p-3">
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className="text-white font-semibold mt-1">{formatCurrency(Number(amount))}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="glass rounded-2xl p-6 mt-5 border border-emerald-500/20">
          <p className="text-xs font-semibold text-emerald-300 uppercase tracking-widest">Local retrieval</p>
          <h2 className="text-white text-xl font-semibold mt-1">Financial knowledge & lender FAQs</h2>
          <p className="text-xs text-slate-400 mt-1">Answers include source links and verification dates. No evidence is presented as current policy without a checked source.</p>
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && void search()} placeholder="Search lender criteria or model limitations" className="flex-1 bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500" />
            <button onClick={() => void search()} disabled={!query.trim() || busy !== null} className="bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50">
              {busy === 'knowledge' ? 'Searching…' : 'Search sources'}
            </button>
          </div>
          {knowledge && (
            <div className="mt-4">
              <p className="text-sm text-slate-200">{knowledge.answer}</p>
              {knowledge.results.map((item) => (
                <article key={item.title} className="border-t border-white/10 mt-3 pt-3">
                  <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                  <p className="text-xs text-slate-300 mt-1">{item.excerpt}</p>
                  <p className="text-xs text-slate-500 mt-1">Verified {item.verified_at}</p>
                  {item.source_url
                    ? <a href={item.source_url} target="_blank" rel="noreferrer" className="text-xs text-cyan-300 hover:underline">View source</a>
                    : <span className="text-xs text-slate-400">Source: TrustLoan application documentation</span>}
                </article>
              ))}
              {knowledge.results.length > 0 && (
                <button onClick={() => void askKnowledge()} disabled={busy !== null} className="mt-4 bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50">
                  {busy === 'knowledge-answer' ? 'Preparing answer…' : 'Ask optional AI using these sources'}
                </button>
              )}
              {knowledgeAnswer && (
                <div className="mt-4 rounded-xl border border-indigo-400/20 bg-indigo-500/10 p-4">
                  <p className="text-sm text-white">{knowledgeAnswer.answer ?? knowledge.answer}</p>
                  {knowledgeAnswer.message && <p className="text-xs text-amber-200 mt-2">{knowledgeAnswer.message}</p>}
                  <div className="mt-3 space-y-1">
                    {knowledgeAnswer.results.map((item, index) => (
                      <p key={item.title} className="text-xs text-slate-400">
                        [{index + 1}] {item.title} · verified {item.verified_at}
                        {item.source_url && <> · <a href={item.source_url} target="_blank" rel="noreferrer" className="text-cyan-300 hover:underline">source</a></>}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {error && <p role="alert" className="text-sm text-red-300 mt-4">{error}</p>}
      </div>
    </div>
  );
}
