'use client';
import { createClient } from '@supabase/supabase-js';

const URL = 'https://vvydmpurwzdnxmzrbham.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2eWRtcHVyd3pkbnhtenJiaGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMDk2NTgsImV4cCI6MjA4NzY4NTY1OH0.npGHAYO5QcIblhTjJkCNwIR7hiuDZ985wNYbygp-vKk';

export const db = createClient(URL, KEY);

export type CashTransaction = {
  id: number;
  type: 'cash' | 'expense';
  to_member: string | null;
  amount: number;
  category: string | null;
  note: string | null;
  day_tag: string | null;
  expense_source: 'pool' | 'personal';
  split_among: string[] | null;
  created_at: string;
};

export type SplitExpense = {
  id: number;
  description: string;
  amount: number;
  category: string | null;
  paid_by: string;
  split_among: string[];
  created_at: string;
};

export type Settlement = {
  id: number;
  from_member: string;
  to_member: string;
  amount: number;
  note: string | null;
  created_at: string;
};

export type Place = {
  id: number;
  name: string;
  category: string;
  address: string | null;
  maps_url: string | null;
  notes: string | null;
  visited: boolean;
  sort_order: number;
  created_at: string;
};

export type Document = {
  id: number;
  section: string;
  title: string;
  data: Record<string, unknown>;
  created_at: string;
};
