import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MEMBERS, MEMBER_COLORS, type Member } from './constants';

/** shadcn utility — merges Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmt(n: number): string {
  return Math.abs(n).toLocaleString('en-IN');
}

export function fmtBaht(n: number): string {
  return '฿' + fmt(n);
}

export function memberColor(name: string): string {
  return MEMBER_COLORS[name as Member] ?? '#9CA3AF';
}

export function memberInitial(name: string): string {
  return name?.[0]?.toUpperCase() ?? '?';
}

/** Get today's trip day (1-5), or null if outside trip */
export function getTripDay(): number | null {
  const today = new Date().toISOString().split('T')[0];
  const days = [
    '2026-02-28', '2026-03-01', '2026-03-02', '2026-03-03', '2026-03-04',
  ];
  const idx = days.indexOf(today);
  return idx >= 0 ? idx + 1 : null;
}

/** Min-cash-flow debt simplification */
export function simplifyDebts(balances: Record<string, number>): Array<{ from: string; to: string; amount: number }> {
  const bal = { ...balances };
  const debts: Array<{ from: string; to: string; amount: number }> = [];
  const eps = 0.5;

  for (let iter = 0; iter < 100; iter++) {
    const creditors = Object.entries(bal).filter(([, v]) => v > eps).sort((a, b) => b[1] - a[1]);
    const debtors   = Object.entries(bal).filter(([, v]) => v < -eps).sort((a, b) => a[1] - b[1]);
    if (!creditors.length || !debtors.length) break;
    const [cName, cAmt] = creditors[0];
    const [dName, dAmt] = debtors[0];
    const pay = Math.min(cAmt, -dAmt);
    debts.push({ from: dName, to: cName, amount: Math.round(pay) });
    bal[cName] -= pay;
    bal[dName] += pay;
  }
  return debts;
}

export function computeSplitBalances(
  expenses: Array<{ amount: number; paid_by: string; split_among: string[] }>,
  settlements: Array<{ from_member: string; to_member: string; amount: number }>
): Record<string, number> {
  const bal: Record<string, number> = {};
  MEMBERS.forEach(m => (bal[m] = 0));

  for (const exp of expenses) {
    const share = Number(exp.amount) / exp.split_among.length;
    bal[exp.paid_by] = (bal[exp.paid_by] ?? 0) + Number(exp.amount);
    for (const m of exp.split_among) {
      bal[m] = (bal[m] ?? 0) - share;
    }
  }
  for (const s of settlements) {
    bal[s.from_member] = (bal[s.from_member] ?? 0) + Number(s.amount);
    bal[s.to_member]   = (bal[s.to_member]   ?? 0) - Number(s.amount);
  }
  return bal;
}
