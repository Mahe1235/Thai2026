'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Plane, Wind, Droplets, CalendarDays, ReceiptText,
  MapPin, FolderOpen, ChevronRight, ArrowRight,
} from 'lucide-react';
import { db } from '@/lib/supabase';
import { fetchWeather, weatherInfo } from '@/lib/weather';
import type { WeatherData } from '@/lib/weather';
import { TRIP, FLIGHTS, ITINERARY_DAYS, TOTAL_CASH, MEMBERS } from '@/lib/constants';
import { fmtBaht, getTripDay } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const MEMBER_COLORS = ['#F5C842', '#00C9A7', '#FF7EB3', '#7C83FD', '#FF9A3C', '#4ECDC4', '#C471ED'];

/* ── Helpers ── */
function getDiff(target: Date) {
  const ms = target.getTime() - Date.now();
  if (ms <= 0) return null;
  return {
    d: Math.floor(ms / 86_400_000),
    h: Math.floor((ms % 86_400_000) / 3_600_000),
    m: Math.floor((ms % 3_600_000) / 60_000),
    s: Math.floor((ms % 60_000) / 1_000),
  };
}
function pad(n: number) { return String(n).padStart(2, '0'); }
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/* ── Reusable section header ── */
function Section({ label, href, children }: { label: string; href?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-xs text-muted-foreground uppercase tracking-widest font-medium">{label}</h2>
        {href && (
          <Link href={href} className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            View <ChevronRight size={12} />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

/* ── Quick access config ── */
const QUICK = [
  { href: '/itinerary', icon: CalendarDays, label: 'Itinerary', sub: '5 days · Phuket & BKK',    bg: 'bg-amber-500/10',  color: 'text-amber-400'  },
  { href: '/expenses',  icon: ReceiptText,  label: 'Expenses',  sub: '฿70k pool · split',        bg: 'bg-teal-500/10',   color: 'text-teal-400'   },
  { href: '/docs',      icon: FolderOpen,   label: 'Documents', sub: 'TDAC · VOA · Flights',      bg: 'bg-violet-500/10', color: 'text-violet-400' },
  { href: '/places',    icon: MapPin,       label: 'Places',    sub: 'Map · visited list',        bg: 'bg-sky-500/10',    color: 'text-sky-400'    },
];

/* ── Main page ── */
export default function TodayPage() {
  const [now, setNow] = useState(() => new Date());
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [stats, setStats] = useState<{ remaining: number; spent: number; splitTotal: number } | null>(null);
  const tick = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    tick.current = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick.current);
  }, []);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const loc = today >= '2026-03-03'
      ? { lat: 13.75, lon: 100.52, name: 'Bangkok' }
      : { lat: 7.89,  lon: 98.40,  name: 'Phuket'  };
    fetchWeather(loc.lat, loc.lon, loc.name).then(setWeather);
  }, []);

  useEffect(() => {
    (async () => {
      const [cash, split] = await Promise.all([
        db.from('cash_transactions').select('type,amount'),
        db.from('split_expenses').select('amount'),
      ]);
      const tx = cash.data ?? [];
      const spent = tx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
      const distributed = tx.filter(t => t.type === 'cash').reduce((s, t) => s + Number(t.amount), 0);
      const splitTotal = (split.data ?? []).reduce((s, e) => s + Number(e.amount), 0);
      setStats({ remaining: TOTAL_CASH - spent - distributed, spent, splitTotal });
    })();
  }, []);

  const isPreTrip  = now < TRIP.departure;
  const isPostTrip = now > TRIP.end;
  const tripDay    = getTripDay();
  const dayData    = tripDay ? ITINERARY_DAYS[tripDay - 1] : null;
  const nextFlight = FLIGHTS.find(f => new Date(f.depUTC) > now);
  const diff       = isPreTrip ? getDiff(TRIP.departure) : null;
  const poolPct    = stats ? Math.max(0, Math.min(100, Math.round(stats.remaining / TOTAL_CASH * 100))) : 0;

  return (
    <div className="max-w-lg mx-auto px-5 pt-14 pb-6 flex flex-col gap-8">

      {/* ─── Header ─── */}
      <motion.header initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="px-1">
        <h1 className="text-xl font-semibold tracking-tight">{greeting()}</h1>
        {isPreTrip && diff && (
          <p className="text-sm text-muted-foreground mt-1">
            {diff.d === 0 ? 'Flight day — pack your bags.' :
             diff.d === 1 ? 'Departing tomorrow night from BLR.' :
             `Thailand in ${diff.d} day${diff.d !== 1 ? 's' : ''}.`}
          </p>
        )}
        {tripDay && dayData && (
          <p className="text-sm text-muted-foreground mt-1">Day {tripDay} of 5 · {dayData.location}</p>
        )}
        {isPostTrip && (
          <p className="text-sm text-muted-foreground mt-1">Thailand 2026 — what a trip.</p>
        )}
      </motion.header>

      {/* ─── Countdown ─── */}
      {isPreTrip && diff && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Section label="Departure countdown">
            <Card className="overflow-hidden">
              <div className="h-px bg-gradient-to-r from-primary/50 to-transparent" />
              <div className="px-5 py-6 flex items-end justify-center gap-5">
                {[
                  { val: pad(diff.d), unit: 'days' },
                  { val: pad(diff.h), unit: 'hrs' },
                  { val: pad(diff.m), unit: 'min' },
                  { val: pad(diff.s), unit: 'sec' },
                ].map(({ val, unit }) => (
                  <div key={unit} className="flex flex-col items-center gap-1.5">
                    <span className="font-mono text-[28px] font-bold leading-none cd-digit">{val}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{unit}</span>
                  </div>
                ))}
              </div>
            </Card>
          </Section>
        </motion.div>
      )}

      {/* ─── Up Next (during trip) ─── */}
      {tripDay && dayData && (() => {
        const nowStr = now.toTimeString().slice(0, 5);
        const upcoming = dayData.activities.filter(a => a.time >= nowStr);
        const next = upcoming[0];
        if (!next) return null;
        return (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Section label="Up next">
              <Card className="overflow-hidden">
                <div className="h-px bg-gradient-to-r from-teal/50 to-transparent" />
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl leading-none mt-0.5">{next.emoji}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{next.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {next.time}{next.note ? ` · ${next.note}` : ''}
                      </p>
                    </div>
                  </div>
                  {upcoming[1] && (
                    <>
                      <Separator className="my-3" />
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{upcoming[1].emoji}</span>
                        <span className="font-mono">{upcoming[1].time}</span>
                        <span className="text-muted-foreground/40">·</span>
                        <span>{upcoming[1].label}</span>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            </Section>
          </motion.div>
        );
      })()}

      {/* ─── Weather ─── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <Section label="Weather">
          {weather ? (() => {
            const info = weatherInfo(weather.code);
            return (
              <Card>
                <div className="p-5 flex items-center gap-4">
                  <span className="text-3xl leading-none shrink-0">{info.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-lg font-bold">{weather.temp}°C</span>
                      <span className="text-sm text-muted-foreground">{info.label}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Droplets size={11} /> {weather.humidity}%</span>
                      <span className="flex items-center gap-1"><Wind size={11} /> {weather.windSpeed} km/h</span>
                      <span className="flex items-center gap-1"><MapPin size={11} /> {weather.location}</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })() : (
            <div className="skeleton h-[76px] rounded-2xl" />
          )}
        </Section>
      </motion.div>

      {/* ─── Money ─── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Section label="Money" href="/expenses">
          <Link href="/expenses" className="block">
            <Card className="overflow-hidden hover:border-white/[0.12] transition-colors">
              <div className="h-px bg-gradient-to-r from-teal/50 to-transparent" />
              <div className="p-5">

                {/* Hero row */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Pool remaining</p>
                    {stats
                      ? <p className="font-mono text-2xl font-bold text-teal leading-none">{fmtBaht(stats.remaining)}</p>
                      : <div className="skeleton h-7 w-28 rounded" />
                    }
                  </div>
                  <Badge variant="outline" className="text-teal border-teal/25 font-mono text-xs shrink-0">
                    {stats ? `${poolPct}% left` : '···'}
                  </Badge>
                </div>

                {/* Progress */}
                <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden mb-5">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${poolPct}%`, background: 'linear-gradient(90deg, #2DD4BF, #0EA5E9)' }}
                  />
                </div>

                <Separator className="mb-4" />

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Total</p>
                    <p className="font-mono text-xs font-semibold">{fmtBaht(TOTAL_CASH)}</p>
                  </div>
                  <div className="border-x border-white/[0.06]">
                    <p className="text-[10px] text-muted-foreground mb-1">Spent</p>
                    <p className={`font-mono text-xs font-semibold ${stats?.spent ? 'text-primary' : ''}`}>
                      {stats ? fmtBaht(stats.spent) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Split</p>
                    <p className="font-mono text-xs font-semibold">
                      {stats ? fmtBaht(stats.splitTotal) : '—'}
                    </p>
                  </div>
                </div>

              </div>
            </Card>
          </Link>
        </Section>
      </motion.div>

      {/* ─── Next Flight ─── */}
      {nextFlight && !isPostTrip && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <Section label={isPreTrip ? 'First flight' : 'Next flight'}>
            <a href={nextFlight.fr24} target="_blank" rel="noopener noreferrer" className="block">
              <Card className="overflow-hidden hover:border-white/[0.12] transition-colors">
                <div className="h-px bg-gradient-to-r from-primary/50 to-transparent" />
                <div className="p-5">

                  {/* Airline header */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                        <Plane size={14} className="text-amber-400" />
                      </div>
                      <div>
                        <p className="font-mono text-sm font-bold text-primary leading-none">{nextFlight.flight}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">{nextFlight.airline}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-teal border-teal/25 text-[10px]">Track ↗</Badge>
                  </div>

                  {/* Route */}
                  <div className="flex items-center">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xl font-bold leading-none">{nextFlight.from}</p>
                      <p className="text-[11px] text-muted-foreground mt-1.5 truncate">{nextFlight.fromFull}</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 shrink-0">
                      <div className="w-6 h-px bg-white/10" />
                      <ArrowRight size={12} className="text-muted-foreground" />
                      <div className="w-6 h-px bg-white/10" />
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                      <p className="font-mono text-xl font-bold leading-none">{nextFlight.to}</p>
                      <p className="text-[11px] text-muted-foreground mt-1.5 truncate">{nextFlight.toFull}</p>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Details */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>{nextFlight.depLocal} → {nextFlight.arrLocal.split(', ')[1]}</span>
                    <span>PNR {nextFlight.pnr}</span>
                  </div>
                  {nextFlight.note && <p className="mt-2 text-xs text-teal/70">{nextFlight.note}</p>}
                  {'warn' in nextFlight && nextFlight.warn && <p className="mt-2 text-xs text-destructive/70">{nextFlight.warn}</p>}

                </div>
              </Card>
            </a>
          </Section>
        </motion.div>
      )}

      {/* ─── Today's Schedule ─── */}
      {tripDay && dayData && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
          <Section label="Schedule" href="/itinerary">
            <Card className="overflow-hidden">
              {dayData.activities.map((act, i) => {
                const past = act.time < now.toTimeString().slice(0, 5);
                return (
                  <div key={i} className={`flex items-start gap-3 px-5 py-3.5 ${i > 0 ? 'border-t border-white/[0.04]' : ''}`}>
                    <span className="font-mono text-xs text-muted-foreground w-10 pt-0.5 shrink-0">{act.time}</span>
                    <span className="text-base leading-none shrink-0 mt-0.5">{act.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${past ? 'text-muted-foreground line-through' : ''}`}>{act.label}</p>
                      {act.note && <p className="text-[11px] text-muted-foreground mt-0.5">{act.note}</p>}
                    </div>
                  </div>
                );
              })}
            </Card>
          </Section>
        </motion.div>
      )}

      {/* ─── Post-trip Settlement ─── */}
      {isPostTrip && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="overflow-hidden border-primary/20">
            <div className="h-px bg-gradient-to-r from-primary/50 to-transparent" />
            <div className="p-5 space-y-3">
              <p className="text-sm font-semibold">Time to settle up!</p>
              <p className="text-xs text-muted-foreground">See who owes who and close it out.</p>
              <Link
                href="/expenses"
                className="flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold text-sm rounded-xl py-2.5 w-full"
              >
                <ReceiptText size={14} /> View Balances
              </Link>
            </div>
          </Card>
        </motion.div>
      )}

      {/* ─── Quick Access ─── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
        <Section label="Quick access">
          <div className="grid grid-cols-2 gap-3">
            {QUICK.map(({ href, icon: Icon, label, sub, bg, color }) => (
              <Link key={href} href={href} className="block">
                <Card className="p-5 h-full hover:border-white/[0.12] active:bg-white/[0.02] transition-colors">
                  <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                    <Icon size={18} className={color} />
                  </div>
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>
                </Card>
              </Link>
            ))}
          </div>
        </Section>
      </motion.div>

      {/* ─── Crew ─── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <Section label={`Crew · ${MEMBERS.length}`}>
          <div className="flex gap-2.5 flex-wrap">
            {MEMBERS.map((m, i) => (
              <div key={m} className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-card px-3 py-1.5">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                  style={{ background: `${MEMBER_COLORS[i]}18`, color: MEMBER_COLORS[i] }}
                >
                  {m[0]}
                </div>
                <span className="text-xs">{m}</span>
              </div>
            ))}
          </div>
        </Section>
      </motion.div>

    </div>
  );
}
