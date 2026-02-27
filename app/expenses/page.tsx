'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ChevronDown, Check, Trash2, Wallet, ReceiptText } from 'lucide-react';
import { db } from '@/lib/supabase';
import type { CashTransaction, SplitExpense, Settlement } from '@/lib/supabase';
import { MEMBERS, TOTAL_CASH, EXPENSE_CATEGORIES, MEMBER_COLORS } from '@/lib/constants';
import { fmtBaht, memberColor, computeSplitBalances, simplifyDebts } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type Tab = 'pool' | 'split';

/* ── Add Expense bottom sheet ── */
function AddSheet({ tab, onClose, onSave }: {
  tab: Tab;
  onClose: () => void;
  onSave: () => void;
}) {
  const [type, setType]     = useState<'expense' | 'cash'>(tab === 'pool' ? 'expense' : 'expense');
  const [amount, setAmount] = useState('');
  const [note, setNote]     = useState('');
  const [category, setCat]  = useState('food');
  const [paidBy, setPaid]   = useState<string>(MEMBERS[0]);
  const [toMember, setTo]   = useState<string>(MEMBERS[0]);
  const [splitAmong, setSplit] = useState<string[]>([...MEMBERS]);
  const [saving, setSaving] = useState(false);

  const toggleMember = (m: string) =>
    setSplit(p => p.includes(m) ? p.filter(x => x !== m) : [...p, m]);

  async function save() {
    if (!amount || isNaN(Number(amount))) return;
    setSaving(true);
    try {
      if (tab === 'pool') {
        await db.from('cash_transactions').insert({
          type,
          amount: Number(amount),
          to_member: type === 'cash' ? toMember : null,
          category: type === 'expense' ? category : null,
          note: note || null,
        });
      } else {
        await db.from('split_expenses').insert({
          description: note || category,
          amount: Number(amount),
          category,
          paid_by: paidBy,
          split_among: splitAmong.length ? splitAmong : [...MEMBERS],
        });
      }
      onSave();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="relative w-full max-w-lg mx-auto bg-card border border-border rounded-t-3xl p-5 space-y-4"
        onClick={e => e.stopPropagation()}
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base">
            {tab === 'pool' ? 'Pool Transaction' : 'Split Expense'}
          </h2>
          <button onClick={onClose} className="text-muted hover:text-text">
            <X size={20} />
          </button>
        </div>

        {/* Pool: type toggle */}
        {tab === 'pool' && (
          <div className="flex bg-surface2 rounded-xl p-1 gap-1">
            {(['expense', 'cash'] as const).map(t => (
              <button key={t} onClick={() => setType(t)}
                className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${
                  type === t ? 'bg-gold text-bg' : 'text-muted'
                }`}
              >
                {t === 'expense' ? '💸 Group Expense' : '💵 Give Cash'}
              </button>
            ))}
          </div>
        )}

        {/* Amount */}
        <div>
          <label className="text-xs text-muted uppercase tracking-wide block mb-1.5">Amount (฿)</label>
          <input
            type="number" inputMode="decimal" value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 font-mono text-xl font-bold text-gold placeholder-muted focus:outline-none focus:border-gold/50"
            placeholder="0"
            autoFocus
          />
        </div>

        {/* To member (pool cash) */}
        {tab === 'pool' && type === 'cash' && (
          <div>
            <label className="text-xs text-muted uppercase tracking-wide block mb-1.5">To member</label>
            <div className="flex gap-2 flex-wrap">
              {MEMBERS.map(m => (
                <button key={m} onClick={() => setTo(m)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    toMember === m ? 'border-gold bg-gold/10 text-gold' : 'border-border text-muted'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Category */}
        {(tab === 'split' || type === 'expense') && (
          <div>
            <label className="text-xs text-muted uppercase tracking-wide block mb-1.5">Category</label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {EXPENSE_CATEGORIES.map(c => (
                <button key={c.value} onClick={() => setCat(c.value)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-sm border transition-colors whitespace-nowrap ${
                    category === c.value ? 'border-gold bg-gold/10 text-gold' : 'border-border text-muted'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Paid by (split) */}
        {tab === 'split' && (
          <div>
            <label className="text-xs text-muted uppercase tracking-wide block mb-1.5">Paid by</label>
            <div className="flex gap-2 flex-wrap">
              {MEMBERS.map(m => (
                <button key={m} onClick={() => setPaid(m)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    paidBy === m ? 'border-gold bg-gold/10 text-gold' : 'border-border text-muted'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Split among (split) */}
        {tab === 'split' && (
          <div>
            <label className="text-xs text-muted uppercase tracking-wide block mb-1.5">
              Split among ({splitAmong.length})
              <button onClick={() => setSplit([...MEMBERS])} className="ml-2 text-gold underline">all</button>
            </label>
            <div className="flex gap-2 flex-wrap">
              {MEMBERS.map(m => (
                <button key={m} onClick={() => toggleMember(m)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors flex items-center gap-1 ${
                    splitAmong.includes(m) ? 'border-teal bg-teal/10 text-teal' : 'border-border text-muted'
                  }`}
                >
                  {splitAmong.includes(m) && <Check size={11} />}
                  {m}
                </button>
              ))}
            </div>
            {splitAmong.length > 0 && (
              <p className="text-xs text-muted mt-1.5">
                ฿{amount ? Math.round(Number(amount) / splitAmong.length).toLocaleString() : '0'} per person
              </p>
            )}
          </div>
        )}

        {/* Note */}
        <div>
          <label className="text-xs text-muted uppercase tracking-wide block mb-1.5">
            {tab === 'split' ? 'Description' : 'Note'} (optional)
          </label>
          <input value={note} onChange={e => setNote(e.target.value)}
            className="w-full bg-surface2 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gold/50 placeholder-muted"
            placeholder={tab === 'split' ? 'e.g. Dinner at Marush' : 'e.g. Taxi'}
          />
        </div>

        <button onClick={save} disabled={saving || !amount}
          className="w-full bg-gold text-bg font-bold rounded-xl py-3 text-sm disabled:opacity-40 transition-opacity"
        >
          {saving ? 'Saving…' : `Add ${tab === 'pool' ? type === 'expense' ? 'Expense' : 'Cash' : 'Split Expense'}`}
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ── Pool tab ── */
function PoolTab() {
  const [txns, setTxns] = useState<CashTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await db.from('cash_transactions').select('*').order('created_at', { ascending: false });
    setTxns((data ?? []) as CashTransaction[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Realtime
  useEffect(() => {
    const ch = db.channel('pool')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cash_transactions' }, load)
      .subscribe();
    return () => { db.removeChannel(ch); };
  }, [load]);

  async function deleteTxn(id: number) {
    await db.from('cash_transactions').delete().eq('id', id);
    load();
  }

  const spent      = txns.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const distributed = txns.filter(t => t.type === 'cash').reduce((s, t) => s + Number(t.amount), 0);
  const remaining  = TOTAL_CASH - spent - distributed;
  const pct        = Math.max(0, Math.min(100, (remaining / TOTAL_CASH) * 100));

  return (
    <div className="space-y-4">
      {/* Balance card */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Pool Remaining</p>
            <p className="font-mono text-2xl font-bold text-teal mt-0.5">{fmtBaht(remaining)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">of {fmtBaht(TOTAL_CASH)}</p>
            <p className="font-mono text-sm text-primary mt-0.5">{fmtBaht(spent)} spent</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-2 bg-surface2 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: pct > 40 ? '#00C9A7' : pct > 20 ? '#F5C842' : '#FF5F6D',
            }}
          />
        </div>
        <div className="grid grid-cols-3 gap-2 pt-1">
          {[
            { label: 'Total pool', val: fmtBaht(TOTAL_CASH), color: 'text-foreground' },
            { label: 'Spent', val: fmtBaht(spent), color: 'text-destructive' },
            { label: 'Distributed', val: fmtBaht(distributed), color: 'text-muted-foreground' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className={`font-mono text-sm font-bold ${s.color}`}>{s.val}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Transactions */}
      <div>
        <p className="text-xs text-muted uppercase tracking-widest mb-2">Transactions ({txns.length})</p>
        {loading && [1,2,3].map(i => <div key={i} className="skeleton h-14 rounded-xl mb-2" />)}
        {!loading && txns.length === 0 && (
          <p className="text-center text-muted text-sm py-8">No transactions yet</p>
        )}
        {!loading && (
          <div className="space-y-2">
            {txns.map(t => (
              <div key={t.id}
                className="bg-surface border border-border rounded-xl px-4 py-3 flex items-center gap-3"
              >
                <span className="text-xl shrink-0">
                  {t.type === 'cash' ? '💵' : EXPENSE_CATEGORIES.find(c => c.value === t.category)?.label.split(' ')[0] ?? '💸'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {t.type === 'cash' ? `Cash → ${t.to_member}` : (t.note || t.category || 'Expense')}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {new Date(t.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className={`font-mono text-sm font-bold ${t.type === 'cash' ? 'text-muted' : 'text-red'}`}>
                    {t.type === 'cash' ? '' : '-'}{fmtBaht(Number(t.amount))}
                  </div>
                </div>
                <button onClick={() => deleteTxn(t.id)} className="text-muted hover:text-red transition-colors shrink-0">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Split tab ── */
function SplitTab() {
  const [expenses, setExpenses]     = useState<SplitExpense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showAll, setShowAll]       = useState(false);

  const load = useCallback(async () => {
    const [exp, set] = await Promise.all([
      db.from('split_expenses').select('*').order('created_at', { ascending: false }),
      db.from('settlements').select('*'),
    ]);
    setExpenses((exp.data ?? []) as SplitExpense[]);
    setSettlements((set.data ?? []) as Settlement[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const ch = db.channel('split')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'split_expenses' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settlements' }, load)
      .subscribe();
    return () => { db.removeChannel(ch); };
  }, [load]);

  async function markSettled(from: string, to: string, amount: number) {
    await db.from('settlements').insert({ from_member: from, to_member: to, amount });
    load();
  }

  async function deleteExp(id: number) {
    await db.from('split_expenses').delete().eq('id', id);
    load();
  }

  const balances = computeSplitBalances(expenses, settlements);
  const debts    = simplifyDebts(balances);
  const total    = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const visible  = showAll ? expenses : expenses.slice(0, 10);

  return (
    <div className="space-y-4">

      {/* Summary */}
      <Card className="p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Balances</p>
        {loading && <div className="skeleton h-32 rounded-xl" />}
        {!loading && (
          <div className="space-y-2">
            {MEMBERS.map(m => {
              const bal = balances[m] ?? 0;
              const color = bal > 0.5 ? 'var(--color-teal,#2DD4BF)' : bal < -0.5 ? '#FF5F6D' : '#6B7280';
              return (
                <div key={m} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: `${memberColor(m)}22`, color: memberColor(m) }}>
                    {m[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{m}</span>
                      <span className="font-mono text-sm font-bold" style={{ color }}>
                        {bal > 0.5 ? '+' : ''}{fmtBaht(Math.round(bal))}
                      </span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full mt-1 overflow-hidden">
                      {Math.abs(bal) > 0.5 && (
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, (Math.abs(bal) / Math.max(1, total / MEMBERS.length)) * 50)}%`,
                            background: color,
                            marginLeft: bal < 0 ? 'auto' : 0,
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Who owes who */}
      {!loading && debts.length > 0 && (
        <div>
          <p className="text-xs text-muted uppercase tracking-widest mb-2">Who owes who</p>
          <div className="space-y-2">
            {debts.map((d, i) => (
              <div key={i} className="bg-surface border border-border rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="flex-1">
                  <span className="text-sm font-medium" style={{ color: memberColor(d.from) }}>{d.from}</span>
                  <span className="text-sm text-muted"> owes </span>
                  <span className="text-sm font-medium" style={{ color: memberColor(d.to) }}>{d.to}</span>
                </div>
                <span className="font-mono text-sm font-bold text-red">{fmtBaht(d.amount)}</span>
                <button
                  onClick={() => markSettled(d.from, d.to, d.amount)}
                  className="text-xs bg-teal/10 text-teal border border-teal/30 rounded-full px-2.5 py-1 hover:bg-teal/20 transition-colors shrink-0"
                >
                  Settled ✓
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expenses list */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted uppercase tracking-widest">Expenses ({expenses.length})</p>
          <p className="font-mono text-xs text-gold">{fmtBaht(total)} total</p>
        </div>
        {loading && [1,2,3].map(i => <div key={i} className="skeleton h-14 rounded-xl mb-2" />)}
        {!loading && expenses.length === 0 && (
          <p className="text-center text-muted text-sm py-8">No split expenses yet</p>
        )}
        {!loading && (
          <div className="space-y-2">
            {visible.map(e => {
              const share = Math.round(Number(e.amount) / (e.split_among?.length || 1));
              return (
                <div key={e.id}
                  className="bg-surface border border-border rounded-xl px-4 py-3 flex items-start gap-3"
                >
                  <span className="text-xl shrink-0 mt-0.5">
                    {EXPENSE_CATEGORIES.find(c => c.value === e.category)?.label.split(' ')[0] ?? '💸'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{e.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted">Paid by</span>
                      <span className="text-xs font-medium" style={{ color: memberColor(e.paid_by) }}>
                        {e.paid_by}
                      </span>
                      <span className="text-xs text-muted">· {fmtBaht(share)}/person</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono text-sm font-bold">{fmtBaht(Number(e.amount))}</div>
                    <div className="text-[10px] text-muted">
                      {new Date(e.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <button onClick={() => deleteExp(e.id)} className="text-muted hover:text-red transition-colors shrink-0 mt-0.5">
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
            {expenses.length > 10 && (
              <button onClick={() => setShowAll(p => !p)}
                className="w-full text-sm text-muted py-2 flex items-center justify-center gap-1"
              >
                {showAll ? 'Show less' : `Show ${expenses.length - 10} more`}
                <ChevronDown size={14} className={showAll ? 'rotate-180 transition-transform' : 'transition-transform'} />
              </button>
            )}
          </div>
        )}
      </div>

    </div>
  );
}

/* ── Main page ── */
export default function ExpensesPage() {
  const [tab, setTab]       = useState<Tab>('pool');
  const [showAdd, setShowAdd] = useState(false);
  const [, setRefresh]      = useState(0);

  return (
    <>
      <div className="px-4 pt-6 max-w-lg mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">Expenses</h1>
            <p className="text-sm text-muted mt-0.5">Pool · Split · Balances</p>
          </div>
          <Button
            onClick={() => setShowAdd(true)}
            size="sm"
            className="gap-1.5 rounded-xl"
          >
            <Plus size={16} /> Add
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex bg-surface2 rounded-xl p-1 gap-1 mb-4">
          {([
            { id: 'pool',  label: '💰 Cash Pool', icon: Wallet },
            { id: 'split', label: '⚖️ Split',     icon: ReceiptText },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id ? 'bg-gold text-bg' : 'text-muted hover:text-text'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {tab === 'pool' ? <PoolTab /> : <SplitTab />}
          </motion.div>
        </AnimatePresence>

      </div>

      {/* Add sheet */}
      <AnimatePresence>
        {showAdd && (
          <AddSheet
            tab={tab}
            onClose={() => setShowAdd(false)}
            onSave={() => setRefresh(r => r + 1)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
