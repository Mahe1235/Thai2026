'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, DollarSign } from 'lucide-react';
import { ITINERARY_DAYS } from '@/lib/constants';
import { getTripDay } from '@/lib/utils';

const TYPE_COLORS: Record<string, string> = {
  transit:       'bg-blue-500/15 text-blue-300 border-blue-500/20',
  food:          'bg-orange-500/15 text-orange-300 border-orange-500/20',
  activity:      'bg-teal/15 text-teal border-teal/20',
  stay:          'bg-purple-500/15 text-purple-300 border-purple-500/20',
  nightlife:     'bg-pink-500/15 text-pink-300 border-pink-500/20',
};

const TYPE_LABELS: Record<string, string> = {
  transit: 'Flight / Transfer',
  food: 'Food & Drinks',
  activity: 'Activity',
  stay: 'Accommodation',
  nightlife: 'Nightlife',
};

export default function ItineraryPage() {
  const todayTrip = getTripDay();
  const [activeDay, setActiveDay] = useState(todayTrip ?? 1);

  const day = ITINERARY_DAYS[activeDay - 1];
  const totalCost = day.activities.reduce((s, a) => s + ('cost' in a && a.cost ? a.cost : 0), 0);

  return (
    <div className="max-w-lg mx-auto">

      {/* Header */}
      <div className="px-4 pt-6 pb-3">
        <h1 className="text-xl font-bold">Itinerary</h1>
        <p className="text-sm text-muted mt-0.5">Feb 28 – Mar 4, 2026 · Phuket & Bangkok</p>
      </div>

      {/* Day selector */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-hide no-scrollbar">
        {ITINERARY_DAYS.map(d => {
          const isActive  = d.day === activeDay;
          const isToday   = d.day === todayTrip;
          const dateLabel = new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' });
          return (
            <button
              key={d.day}
              onClick={() => setActiveDay(d.day)}
              className={`flex flex-col items-center shrink-0 rounded-2xl px-4 py-2.5 border transition-all ${
                isActive
                  ? 'bg-gold border-gold text-bg font-semibold'
                  : 'bg-surface border-border text-muted hover:border-gold/40'
              }`}
            >
              <span className="text-[10px] uppercase tracking-wide">
                {isToday && !isActive ? '●' : `Day ${d.day}`}
              </span>
              <span className="text-sm font-semibold mt-0.5">{dateLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Day content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeDay}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.2 }}
          className="px-4 space-y-3"
        >
          {/* Day header */}
          <div className="bg-surface border border-border rounded-2xl p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-bold text-lg leading-tight">{day.title}</h2>
                <p className="text-sm text-muted flex items-center gap-1 mt-0.5">
                  <MapPin size={12} className="shrink-0" /> {day.location}
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="font-mono text-base font-bold text-gold">฿{totalCost.toLocaleString()}</div>
                <div className="text-[10px] text-muted">per person est.</div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[2.1rem] top-3 bottom-3 w-px bg-border" />

            <div className="space-y-1">
              {day.activities.map((act, i) => {
                const colorClass = TYPE_COLORS[act.type] ?? TYPE_COLORS.activity;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-start gap-3"
                  >
                    {/* Time */}
                    <div className="w-16 text-right shrink-0 pt-3">
                      <span className="font-mono text-xs text-muted">{act.time}</span>
                    </div>

                    {/* Dot */}
                    <div className="relative z-10 mt-3.5 shrink-0">
                      <div className={`w-3 h-3 rounded-full border-2 ${
                        act.type === 'transit' ? 'border-blue-400 bg-blue-400/30' :
                        act.type === 'food'    ? 'border-orange-400 bg-orange-400/30' :
                        act.type === 'nightlife' ? 'border-pink-400 bg-pink-400/30' :
                        act.type === 'stay'    ? 'border-purple-400 bg-purple-400/30' :
                        'border-teal bg-teal/30'
                      }`} />
                    </div>

                    {/* Card */}
                    <div className={`flex-1 mb-2 rounded-xl border p-3 ${colorClass}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1">
                          <span className="text-lg leading-none mt-0.5">{act.emoji}</span>
                          <div>
                            <p className="font-medium text-sm text-text leading-snug">{act.label}</p>
                            {act.note && (
                              <p className="text-xs opacity-70 mt-0.5">{act.note}</p>
                            )}
                          </div>
                        </div>
                        {'cost' in act && act.cost ? (
                          <span className="font-mono text-xs font-semibold shrink-0 flex items-center gap-0.5">
                            <DollarSign size={10} />฿{act.cost.toLocaleString()}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Cost summary */}
          <div className="bg-surface border border-border rounded-2xl p-4 mb-2">
            <p className="text-xs text-muted uppercase tracking-widest mb-3">Estimated costs for Day {day.day}</p>
            <div className="space-y-2">
              {day.activities
                .filter(a => 'cost' in a && a.cost)
                .map((a, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5">
                      <span>{a.emoji}</span>
                      <span className="text-muted">{a.label.split(' — ')[0]}</span>
                    </span>
                    <span className="font-mono text-xs">{'cost' in a && a.cost ? `฿${a.cost.toLocaleString()}` : ''}</span>
                  </div>
                ))}
              <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
                <span className="font-semibold">Total per person</span>
                <span className="font-mono font-bold text-gold">฿{totalCost.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted">
                <span>Group of 7</span>
                <span className="font-mono">฿{(totalCost * 7).toLocaleString()}</span>
              </div>
            </div>
          </div>

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
