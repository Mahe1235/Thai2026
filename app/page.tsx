'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Plane, Wind, Droplets, CalendarDays, ReceiptText,
  ChevronRight, MapPin, FolderOpen,
} from 'lucide-react';
import { db } from '@/lib/supabase';
import { fetchWeather, weatherInfo } from '@/lib/weather';
import type { WeatherData } from '@/lib/weather';
import { TRIP, FLIGHTS, ITINERARY_DAYS, TOTAL_CASH, MEMBERS } from '@/lib/constants';
import { fmtBaht, getTripDay } from '@/lib/utils';

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

/* ── Sub-components ── */
function Digit({ val, label }: { val: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="bg-surface2 border border-border rounded-xl px-3 py-2.5 min-w-[3.2rem] text-center">
        <span className="font-mono text-[1.6rem] font-bold text-gold cd-digit leading-none">{val}</span>
      </div>
      <span className="text-[9px] text-muted uppercase tracking-widest">{label}</span>
    </div>
  );
}

function WeatherCard({ w }: { w: WeatherData }) {
  const info = weatherInfo(w.code);
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
      className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-4"
    >
      <span className="text-4xl leading-none">{info.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-2xl font-bold">{w.temp}°C</span>
          <span className="text-sm text-muted truncate">{info.label}</span>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="flex items-center gap-1 text-xs text-muted">
            <Droplets size={11} className="shrink-0" /> {w.humidity}%
          </span>
          <span className="flex items-center gap-1 text-xs text-muted">
            <Wind size={11} className="shrink-0" /> {w.windSpeed} km/h
          </span>
          <span className="flex items-center gap-1 text-xs text-muted">
            <MapPin size={11} className="shrink-0" /> {w.location}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function FlightCard({ f, compact = false }: { f: typeof FLIGHTS[number]; compact?: boolean }) {
  const past = new Date(f.depUTC) < new Date();
  return (
    <a
      href={f.fr24} target="_blank" rel="noopener noreferrer"
      className={`block bg-surface border rounded-2xl p-4 transition-colors ${
        past ? 'border-border opacity-40' : 'border-border hover:border-gold/40 active:border-gold/60'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Plane size={13} className={past ? 'text-muted' : 'text-gold'} />
          <span className={`font-mono text-sm font-bold ${past ? 'text-muted' : 'text-gold'}`}>
            {f.flight}
          </span>
          <span className="text-xs text-muted">{f.airline}</span>
        </div>
        {!past && (
          <span className="text-[10px] text-teal border border-teal/30 rounded-full px-2 py-0.5">
            Track live ↗
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="text-center">
          <div className="font-mono text-base font-bold">{f.from}</div>
          <div className="text-[11px] text-muted leading-tight">{f.fromFull}</div>
        </div>
        <div className="flex-1 flex items-center gap-1 px-1">
          <div className="flex-1 h-px bg-border" />
          <Plane size={11} className="text-muted" />
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="text-center">
          <div className="font-mono text-base font-bold">{f.to}</div>
          <div className="text-[11px] text-muted leading-tight">{f.toFull}</div>
        </div>
      </div>
      {!compact && (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted">
          <span>{f.depLocal} → {f.arrLocal.split(', ')[1]}</span>
          <span>PNR: {f.pnr}</span>
          {f.baggage && <span>🧳 {f.baggage}</span>}
        </div>
      )}
      {!compact && f.note && (
        <p className="mt-1.5 text-[11px] text-teal/80">{f.note}</p>
      )}
      {!compact && 'warn' in f && f.warn && (
        <p className="mt-1 text-[11px] text-red/80">{f.warn}</p>
      )}
    </a>
  );
}

/* ── Page ── */
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
      const tx   = cash.data  ?? [];
      const spent      = tx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
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

  const memberColors = ['#F5C842','#00C9A7','#FF7EB3','#7C83FD','#FF9A3C','#4ECDC4','#C471ED'];

  return (
    <div className="px-4 pt-6 space-y-4 max-w-lg mx-auto">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
        {isPreTrip && (
          <>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🇹🇭</span>
              <h1 className="text-xl font-bold tracking-tight">Thailand 2026</h1>
            </div>
            <p className="text-sm text-muted">
              {diff?.d === 0 ? '🛫 Today is flight day — pack your bags!' :
               diff?.d === 1 ? '✈️ Departing tomorrow night from BLR!' :
               `${diff?.d} day${diff?.d !== 1 ? 's' : ''} until departure`}
            </p>
          </>
        )}
        {tripDay && dayData && (
          <>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold bg-gold/10 border border-gold/20 rounded-full px-2.5 py-1 mb-1.5">
              DAY {tripDay} · {new Date(dayData.date).toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
            <h1 className="text-xl font-bold">{dayData.title}</h1>
            <p className="text-sm text-muted flex items-center gap-1">
              <MapPin size={12} /> {dayData.location}
            </p>
          </>
        )}
        {isPostTrip && (
          <>
            <div className="text-2xl mb-1">🎉</div>
            <h1 className="text-xl font-bold">Thailand was incredible!</h1>
            <p className="text-sm text-muted">Feb 28 – Mar 4, 2026</p>
          </>
        )}
      </motion.div>

      {/* Countdown */}
      {isPreTrip && diff && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className="bg-surface border border-border rounded-2xl p-5"
        >
          <p className="text-[10px] text-muted uppercase tracking-widest mb-4 text-center">Countdown to departure</p>
          <div className="flex justify-center gap-3">
            <Digit val={pad(diff.d)} label="Days" />
            <span className="font-mono text-xl text-muted mt-2">:</span>
            <Digit val={pad(diff.h)} label="Hrs" />
            <span className="font-mono text-xl text-muted mt-2">:</span>
            <Digit val={pad(diff.m)} label="Min" />
            <span className="font-mono text-xl text-muted mt-2">:</span>
            <Digit val={pad(diff.s)} label="Sec" />
          </div>
        </motion.div>
      )}

      {/* Weather */}
      {weather
        ? <WeatherCard w={weather} />
        : <div className="skeleton h-20 rounded-2xl" />
      }

      {/* "Up next" highlight during trip */}
      {tripDay && dayData && (() => {
        const nowStr   = now.toTimeString().slice(0, 5);
        const upcoming = dayData.activities.filter(a => a.time >= nowStr);
        const next     = upcoming[0];
        if (!next) return null;
        return (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-surface2 border border-teal/30 rounded-2xl p-4"
          >
            <p className="text-[10px] text-teal uppercase tracking-widest mb-2">Up next</p>
            <div className="flex items-start gap-3">
              <span className="text-2xl leading-none">{next.emoji}</span>
              <div>
                <div className="font-semibold text-sm">{next.label}</div>
                <div className="text-xs text-muted mt-0.5">
                  {next.time}{next.note ? ` · ${next.note}` : ''}
                  {'cost' in next && next.cost ? ` · ฿${next.cost}` : ''}
                </div>
              </div>
            </div>
            {upcoming[1] && (
              <div className="mt-2.5 pt-2.5 border-t border-border/50 flex items-center gap-2 text-xs text-muted">
                <span>{upcoming[1].emoji}</span>
                <span className="font-mono">{upcoming[1].time}</span>
                <span>—</span>
                <span>{upcoming[1].label}</span>
              </div>
            )}
          </motion.div>
        );
      })()}

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
        className="grid grid-cols-3 gap-2"
      >
        {[
          { label: 'Pool Left',  val: stats ? fmtBaht(stats.remaining) : null, color: 'text-teal'  },
          { label: 'Pool Spent', val: stats ? fmtBaht(stats.spent)     : null, color: 'text-gold'  },
          { label: 'Split',      val: stats ? fmtBaht(stats.splitTotal): null, color: 'text-text'  },
        ].map(item => (
          <Link key={item.label} href="/expenses"
            className="bg-surface border border-border rounded-xl p-3 text-center active:border-gold/50 transition-colors"
          >
            {item.val
              ? <div className={`font-mono text-[0.9rem] font-bold ${item.color}`}>{item.val}</div>
              : <div className="skeleton h-5 w-16 mx-auto" />
            }
            <div className="text-[10px] text-muted mt-0.5 uppercase tracking-wide">{item.label}</div>
          </Link>
        ))}
      </motion.div>

      {/* Next / upcoming flight */}
      {nextFlight && !isPostTrip && (
        <div>
          <p className="text-[10px] text-muted uppercase tracking-widest mb-2">
            {isPreTrip ? 'Your first flight' : 'Next flight'}
          </p>
          <FlightCard f={nextFlight} />
        </div>
      )}

      {/* Pre-trip: show all flights */}
      {isPreTrip && (
        <div>
          <p className="text-[10px] text-muted uppercase tracking-widest mb-2">All flights</p>
          <div className="space-y-2">
            {FLIGHTS.slice(1).map(f => <FlightCard key={f.leg} f={f} compact />)}
          </div>
        </div>
      )}

      {/* During-trip: today's full schedule */}
      {tripDay && dayData && (
        <div>
          <Link href="/itinerary" className="flex items-center justify-between mb-2">
            <p className="text-[10px] text-muted uppercase tracking-widest">Today's schedule</p>
            <span className="text-xs text-gold flex items-center gap-0.5">Full view <ChevronRight size={12} /></span>
          </Link>
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
                  {'cost' in act && act.cost ? (
                    <span className="text-xs text-muted font-mono shrink-0">฿{act.cost}</span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Post-trip settlement CTA */}
      {isPostTrip && (
        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="bg-surface border border-gold/30 rounded-2xl p-4 space-y-3"
        >
          <div>
            <p className="font-semibold">Settle up the group!</p>
            <p className="text-sm text-muted mt-0.5">See who owes who and close it out.</p>
          </div>
          <Link href="/expenses"
            className="flex items-center justify-center gap-2 bg-gold text-bg font-semibold text-sm rounded-xl py-2.5 w-full"
          >
            <ReceiptText size={15} /> View Balances
          </Link>
        </motion.div>
      )}

      {/* Quick links */}
      <motion.div
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="grid grid-cols-2 gap-2"
      >
        {[
          { href: '/itinerary', icon: CalendarDays, label: 'Itinerary' },
          { href: '/expenses',  icon: ReceiptText,  label: 'Expenses' },
          { href: '/docs',      icon: FolderOpen,   label: 'Documents' },
          { href: '/places',    icon: MapPin,        label: 'Places' },
        ].map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href}
            className="flex items-center gap-2.5 bg-surface border border-border rounded-xl px-3.5 py-3 hover:border-gold/40 active:bg-surface2 transition-colors"
          >
            <Icon size={16} className="text-gold shrink-0" />
            <span className="text-sm font-medium">{label}</span>
            <ChevronRight size={13} className="text-muted ml-auto" />
          </Link>
        ))}
      </motion.div>

      {/* Crew */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
      >
        <p className="text-[10px] text-muted uppercase tracking-widest mb-2">
          The crew · {MEMBERS.length} people
        </p>
        <div className="flex gap-2 flex-wrap">
          {MEMBERS.map((m, i) => (
            <div key={m}
              className="flex items-center gap-1.5 bg-surface border border-border rounded-full px-2.5 py-1"
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{ background: `${memberColors[i]}22`, color: memberColors[i] }}
              >
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
