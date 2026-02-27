'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Plane, Wind, Droplets, CalendarDays, ReceiptText,
  MapPin, FolderOpen,
} from 'lucide-react';
import { db } from '@/lib/supabase';
import { fetchWeather, weatherInfo } from '@/lib/weather';
import type { WeatherData } from '@/lib/weather';
import { TRIP, FLIGHTS, ITINERARY_DAYS, TOTAL_CASH, MEMBERS } from '@/lib/constants';
import { fmtBaht, getTripDay } from '@/lib/utils';

const MEMBER_COLORS = ['#F5C842','#00C9A7','#FF7EB3','#7C83FD','#FF9A3C','#4ECDC4','#C471ED'];

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
  if (h < 12) return 'Good morning.';
  if (h < 17) return 'Good afternoon.';
  return 'Good evening.';
}

/* ── Section label ── */
function SectionLabel({ label, href }: { label: string; href?: string }) {
  return (
    <div className="flex items-center justify-between mb-2.5">
      <p className="text-[11px] text-zinc-500 uppercase tracking-[0.1em] font-medium">{label}</p>
      {href && (
        <Link href={href} className="text-[11px] text-zinc-500 hover:text-white transition-colors">
          See all
        </Link>
      )}
    </div>
  );
}

/* ── Weather card ── */
function WeatherCard({ w }: { w: WeatherData }) {
  const info = weatherInfo(w.code);
  return (
    <div className="flex items-center gap-3 bg-surface border border-border rounded-2xl p-4">
      <span className="text-3xl leading-none">{info.emoji}</span>
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-xl font-bold">{w.temp}°C</span>
          <span className="text-sm text-muted">{info.label}</span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="flex items-center gap-1 text-xs text-muted"><Droplets size={11} /> {w.humidity}%</span>
          <span className="flex items-center gap-1 text-xs text-muted"><Wind size={11} /> {w.windSpeed} km/h</span>
          <span className="flex items-center gap-1 text-xs text-muted"><MapPin size={11} /> {w.location}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function TodayPage() {
  const [now, setNow]         = useState(() => new Date());
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [stats, setStats]     = useState<{ remaining: number; spent: number; splitTotal: number } | null>(null);
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
      const tx          = cash.data ?? [];
      const spent       = tx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
      const distributed = tx.filter(t => t.type === 'cash').reduce((s, t) => s + Number(t.amount), 0);
      const splitTotal  = (split.data ?? []).reduce((s, e) => s + Number(e.amount), 0);
      setStats({ remaining: TOTAL_CASH - spent - distributed, spent, splitTotal });
    })();
  }, []);

  const isPreTrip  = now < TRIP.departure;
  const isPostTrip = now > TRIP.end;
  const tripDay    = getTripDay();
  const dayData    = tripDay ? ITINERARY_DAYS[tripDay - 1] : null;
  const nextFlight = FLIGHTS.find(f => new Date(f.depUTC) > now);
  const diff       = isPreTrip ? getDiff(TRIP.departure) : null;

  return (
    <div className="max-w-lg mx-auto px-4 pt-10 space-y-8">

      {/* ── Greeting header ── */}
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-[28px] font-bold tracking-tight leading-tight">{greeting()}</h1>
        {isPreTrip && diff && (
          <p className="text-muted text-sm mt-1.5">
            {diff.d === 0 ? 'Flight day — pack your bags.' :
             diff.d === 1 ? 'Departing tomorrow night from BLR.' :
             `Thailand in ${diff.d} day${diff.d !== 1 ? 's' : ''}.`}
          </p>
        )}
        {tripDay && dayData && (
          <p className="text-muted text-sm mt-1.5">Day {tripDay} of 5 · {dayData.location}</p>
        )}
        {isPostTrip && (
          <p className="text-muted text-sm mt-1.5">Thailand 2026 — what a trip.</p>
        )}
      </motion.div>

      {/* ── Countdown (pre-trip) ── */}
      {isPreTrip && diff && (
        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
        >
          <SectionLabel label="Countdown to departure" />
          <div className="flex items-baseline gap-0.5">
            <span className="font-mono text-[48px] font-semibold text-white leading-none cd-digit">{pad(diff.d)}</span>
            <span className="text-zinc-600 text-base mb-1 ml-1 mr-4">d</span>
            <span className="font-mono text-[48px] font-semibold text-white leading-none cd-digit">{pad(diff.h)}</span>
            <span className="text-zinc-600 text-base mb-1 ml-1 mr-4">h</span>
            <span className="font-mono text-[48px] font-semibold text-white leading-none cd-digit">{pad(diff.m)}</span>
            <span className="text-zinc-600 text-base mb-1 ml-1 mr-4">m</span>
            <span className="font-mono text-[48px] font-semibold text-white leading-none cd-digit">{pad(diff.s)}</span>
            <span className="text-zinc-600 text-base mb-1 ml-1">s</span>
          </div>
        </motion.div>
      )}

      {/* ── Up next (during trip) ── */}
      {tripDay && dayData && (() => {
        const nowStr   = now.toTimeString().slice(0, 5);
        const upcoming = dayData.activities.filter(a => a.time >= nowStr);
        const next     = upcoming[0];
        if (!next) return null;
        return (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
          >
            <SectionLabel label="Up next" />
            <div className="bg-surface border border-teal/20 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl leading-none">{next.emoji}</span>
                <div>
                  <p className="font-semibold text-sm">{next.label}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {next.time}{next.note ? ` · ${next.note}` : ''}
                  </p>
                </div>
              </div>
              {upcoming[1] && (
                <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2 text-xs text-muted">
                  <span>{upcoming[1].emoji}</span>
                  <span className="font-mono">{upcoming[1].time}</span>
                  <span>—</span>
                  <span>{upcoming[1].label}</span>
                </div>
              )}
            </div>
          </motion.div>
        );
      })()}

      {/* ── Weather ── */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <SectionLabel label="Weather" />
        {weather
          ? <WeatherCard w={weather} />
          : <div className="skeleton h-[72px] rounded-2xl" />
        }
      </motion.div>

      {/* ── Money ── */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
        <SectionLabel label="Money" href="/expenses" />
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Pool left',  val: stats ? fmtBaht(stats.remaining) : null, color: 'text-teal'  },
            { label: 'Pool spent', val: stats ? fmtBaht(stats.spent)     : null, color: 'text-gold'  },
            { label: 'Split',      val: stats ? fmtBaht(stats.splitTotal): null, color: 'text-text'  },
          ].map(item => (
            <Link key={item.label} href="/expenses"
              className="bg-surface border border-border rounded-2xl p-3.5 text-center hover:border-gold/20 active:border-gold/40 transition-colors"
            >
              {item.val
                ? <div className={`font-mono text-[15px] font-bold ${item.color}`}>{item.val}</div>
                : <div className="skeleton h-5 w-14 mx-auto rounded" />
              }
              <div className="text-[10px] text-muted mt-1 tracking-wide">{item.label}</div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* ── Next flight ── */}
      {nextFlight && !isPostTrip && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }}>
          <SectionLabel label={isPreTrip ? 'First flight' : 'Next flight'} />
          <a href={nextFlight.fr24} target="_blank" rel="noopener noreferrer"
            className="block bg-surface border border-border hover:border-gold/40 rounded-2xl p-4 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Plane size={13} className="text-gold" />
                <span className="font-mono text-sm font-bold text-gold">{nextFlight.flight}</span>
                <span className="text-xs text-muted">{nextFlight.airline}</span>
              </div>
              <span className="text-[10px] text-teal border border-teal/30 rounded-full px-2.5 py-0.5">Track live ↗</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-center">
                <div className="font-mono text-xl font-bold">{nextFlight.from}</div>
                <div className="text-[11px] text-muted">{nextFlight.fromFull}</div>
              </div>
              <div className="flex-1 flex items-center gap-1 px-2">
                <div className="flex-1 h-px bg-border" />
                <Plane size={12} className="text-muted" />
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="text-center">
                <div className="font-mono text-xl font-bold">{nextFlight.to}</div>
                <div className="text-[11px] text-muted">{nextFlight.toFull}</div>
              </div>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-x-3 text-[11px] text-muted">
              <span>{nextFlight.depLocal} → {nextFlight.arrLocal.split(', ')[1]}</span>
              <span>PNR: {nextFlight.pnr}</span>
            </div>
            {nextFlight.note && <p className="mt-1 text-[11px] text-teal/80">{nextFlight.note}</p>}
            {'warn' in nextFlight && nextFlight.warn && <p className="mt-1 text-[11px] text-red/80">{nextFlight.warn}</p>}
          </a>
        </motion.div>
      )}

      {/* ── Today's schedule ── */}
      {tripDay && dayData && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <SectionLabel label="Today's schedule" href="/itinerary" />
          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            {dayData.activities.map((act, i) => {
              const past = act.time < now.toTimeString().slice(0, 5);
              return (
                <div key={i} className={`flex items-start gap-3 px-4 py-2.5 ${i > 0 ? 'border-t border-border' : ''}`}>
                  <span className="font-mono text-xs text-muted w-10 pt-0.5 shrink-0">{act.time}</span>
                  <span className="text-lg leading-none shrink-0 mt-0.5">{act.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${past ? 'text-muted line-through' : ''}`}>{act.label}</p>
                    {act.note && <p className="text-xs text-muted mt-0.5">{act.note}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── Post-trip settlement ── */}
      {isPostTrip && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="bg-surface border border-gold/30 rounded-2xl p-4 space-y-3"
        >
          <p className="font-semibold">Time to settle up!</p>
          <p className="text-sm text-muted">See who owes who and close it out.</p>
          <Link href="/expenses"
            className="flex items-center justify-center gap-2 bg-gold text-bg font-semibold text-sm rounded-xl py-2.5 w-full"
          >
            <ReceiptText size={15} /> View Balances
          </Link>
        </motion.div>
      )}

      {/* ── Quick access ── */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
        <SectionLabel label="Quick access" />
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: '/itinerary', icon: CalendarDays, label: 'Itinerary',  sub: '5 days · Phuket & BKK' },
            { href: '/expenses',  icon: ReceiptText,  label: 'Expenses',   sub: '฿70k pool · split' },
            { href: '/docs',      icon: FolderOpen,   label: 'Documents',  sub: 'TDAC · VOA · Flights' },
            { href: '/places',    icon: MapPin,        label: 'Places',     sub: 'Map · visited list' },
          ].map(({ href, icon: Icon, label, sub }) => (
            <Link key={href} href={href}
              className="flex flex-col gap-2.5 bg-surface border border-border rounded-2xl p-4 hover:border-gold/25 active:bg-surface2 transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-surface2 flex items-center justify-center">
                <Icon size={16} className="text-gold" />
              </div>
              <div>
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-[11px] text-muted mt-0.5">{sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* ── Crew ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.26 }} className="pb-2">
        <SectionLabel label={`The crew · ${MEMBERS.length}`} />
        <div className="flex gap-2 flex-wrap">
          {MEMBERS.map((m, i) => (
            <div key={m} className="flex items-center gap-1.5 bg-surface border border-border rounded-full px-2.5 py-1">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{ background: `${MEMBER_COLORS[i]}22`, color: MEMBER_COLORS[i] }}>
                {m[0]}
              </div>
              <span className="text-xs">{m}</span>
            </div>
          ))}
        </div>
      </motion.div>

    </div>
  );
}
