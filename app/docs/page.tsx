'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Hotel, Phone, CheckSquare, Square, ExternalLink } from 'lucide-react';
import { db } from '@/lib/supabase';
import { MEMBERS, FLIGHTS } from '@/lib/constants';

type MemberStatus = { member: string; status: 'not_started' | 'in_progress' | 'completed'; ref?: string };

const STATUS_LABELS = {
  not_started: { label: 'Not started', color: 'text-muted border-border bg-surface2' },
  in_progress: { label: 'In progress', color: 'text-gold border-gold/40 bg-gold/10' },
  completed:   { label: '✓ Done',     color: 'text-teal border-teal/40 bg-teal/10'  },
} as const;

type DocSection = 'tdac' | 'voa' | 'india' | 'flights' | 'hotels' | 'emergency';

const TABS: { id: DocSection; label: string; emoji: string }[] = [
  { id: 'tdac',      label: 'TDAC',      emoji: '📱' },
  { id: 'voa',       label: 'VOA',       emoji: '🛂' },
  { id: 'india',     label: 'India',     emoji: '🇮🇳' },
  { id: 'flights',   label: 'Flights',   emoji: '✈️' },
  { id: 'hotels',    label: 'Hotels',    emoji: '🏨' },
  { id: 'emergency', label: 'Emergency', emoji: '🚨' },
];

/* ── Member status tracker ── */
function MemberStatusTracker({ section, title, subtitle }: {
  section: string;
  title: string;
  subtitle: string;
}) {
  const [statuses, setStatuses] = useState<MemberStatus[]>(
    MEMBERS.map(m => ({ member: m, status: 'not_started' as const }))
  );
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await db.from('documents')
      .select('*')
      .eq('section', section);
    if (data?.length) {
      const map: Record<string, MemberStatus> = {};
      for (const d of data) {
        const s = d.data as MemberStatus;
        if (s.member) map[s.member] = s;
      }
      setStatuses(MEMBERS.map(m => map[m] ?? { member: m, status: 'not_started' }));
    }
    setLoading(false);
  }, [section]);

  useEffect(() => { load(); }, [load]);

  async function cycle(member: string, current: MemberStatus['status']) {
    const next: MemberStatus['status'] = current === 'not_started' ? 'in_progress' : current === 'in_progress' ? 'completed' : 'not_started';
    const newStatus: MemberStatus = { member, status: next };
    // Upsert via delete+insert (documents table may not have upsert config)
    await db.from('documents').delete().eq('section', section).eq('data->>member', member);
    await db.from('documents').insert({ section, title: `${member} ${section}`, data: newStatus });
    setStatuses(p => p.map(s => s.member === member ? newStatus : s));
  }

  const done = statuses.filter(s => s.status === 'completed').length;

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-xs text-muted mt-0.5">{subtitle}</p>
        </div>
        <div className="text-right shrink-0">
          <span className={`font-mono text-sm font-bold ${done === MEMBERS.length ? 'text-teal' : 'text-gold'}`}>
            {done}/{MEMBERS.length}
          </span>
          <div className="text-[10px] text-muted">complete</div>
        </div>
      </div>
      <div className="h-1.5 bg-surface2 rounded-full overflow-hidden">
        <div
          className="h-full bg-teal rounded-full transition-all duration-500"
          style={{ width: `${(done / MEMBERS.length) * 100}%` }}
        />
      </div>
      {loading
        ? <div className="skeleton h-48 rounded-xl" />
        : (
          <div className="space-y-2">
            {statuses.map(s => {
              const { label, color } = STATUS_LABELS[s.status];
              return (
                <div key={s.member} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                    style={{
                      background: ['#F5C842','#00C9A7','#FF7EB3','#7C83FD','#FF9A3C','#4ECDC4','#C471ED'][MEMBERS.indexOf(s.member as typeof MEMBERS[number])] + '22',
                      color: ['#F5C842','#00C9A7','#FF7EB3','#7C83FD','#FF9A3C','#4ECDC4','#C471ED'][MEMBERS.indexOf(s.member as typeof MEMBERS[number])],
                    }}
                  >
                    {s.member[0]}
                  </div>
                  <span className="flex-1 text-sm">{s.member}</span>
                  <button
                    onClick={() => cycle(s.member, s.status)}
                    className={`text-xs border rounded-full px-3 py-1 transition-colors ${color}`}
                  >
                    {label}
                  </button>
                </div>
              );
            })}
          </div>
        )
      }
    </div>
  );
}

/* ── Checklist ── */
function Checklist({ items }: { items: string[] }) {
  const [checked, setChecked] = useState<Set<number>>(new Set());
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <button key={i} onClick={() => setChecked(p => { const n = new Set(p); n.has(i) ? n.delete(i) : n.add(i); return n; })}
          className="flex items-start gap-2.5 w-full text-left"
        >
          {checked.has(i)
            ? <CheckSquare size={16} className="text-teal shrink-0 mt-0.5" />
            : <Square size={16} className="text-muted shrink-0 mt-0.5" />
          }
          <span className={`text-sm ${checked.has(i) ? 'line-through text-muted' : ''}`}>{item}</span>
        </button>
      ))}
    </div>
  );
}

/* ── Section renderers ── */
function TDACSection() {
  return (
    <div className="space-y-4">
      <div className="bg-gold/10 border border-gold/30 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">📱</span>
          <div>
            <h3 className="font-semibold text-gold">Thailand Digital Arrival Card (TDAC)</h3>
            <p className="text-sm text-muted mt-1">
              Mandatory for all arrivals. Complete online before boarding — no physical form needed.
            </p>
            <p className="text-xs text-muted mt-1">Fill between Feb 25–28 (within 3 days of arrival)</p>
          </div>
        </div>
        <a
          href="https://tdac.immigration.go.th" target="_blank" rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-2 bg-gold text-bg font-semibold text-sm rounded-xl py-2.5"
        >
          Open TDAC Portal <ExternalLink size={14} />
        </a>
      </div>
      <MemberStatusTracker
        section="tdac"
        title="TDAC Status"
        subtitle="Tap to cycle: Not started → In progress → Done"
      />
    </div>
  );
}

function VOASection() {
  return (
    <div className="space-y-4">
      <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
        <h3 className="font-semibold">Visa on Arrival (VOA)</h3>
        <p className="text-sm text-muted">Indian passports — 30-day VOA at Phuket International Airport</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-surface2 rounded-xl p-3 text-center">
            <div className="font-mono text-base font-bold text-red">฿2,000</div>
            <div className="text-xs text-muted">Per person</div>
          </div>
          <div className="bg-surface2 rounded-xl p-3 text-center">
            <div className="font-mono text-base font-bold text-gold">฿14,000</div>
            <div className="text-xs text-muted">Group total</div>
          </div>
        </div>
        <div className="bg-teal/10 border border-teal/20 rounded-xl p-3">
          <p className="text-xs text-teal font-medium">💡 Tip: Use the automated kiosks first, then join the correct VOA queue. Keep ฿2,000 cash ready.</p>
        </div>
      </div>
      <div className="bg-surface border border-border rounded-2xl p-4">
        <h3 className="font-semibold mb-3">Required Documents (per person)</h3>
        <Checklist items={[
          'Passport — valid for 6+ months past Mar 4',
          'Passport-size photo (recent)',
          'Proof of onward journey (return FD 137 ticket)',
          'Hotel booking confirmation (Villa Aurora / Bangkok hotel)',
          'Sufficient funds — ฿10,000 minimum per person',
          'Completed TDAC (can show on phone)',
        ]} />
      </div>
      <MemberStatusTracker
        section="voa"
        title="VOA Readiness"
        subtitle="Tap to mark — ensure all docs are ready before landing"
      />
    </div>
  );
}

function IndiaSection() {
  return (
    <div className="space-y-4">
      <div className="bg-red/10 border border-red/30 rounded-2xl p-4 space-y-2">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🇮🇳</span>
          <div>
            <h3 className="font-semibold text-red">India e-Arrival Card</h3>
            <p className="text-sm text-muted mt-1">
              Required for all returning travellers (effective Oct 2025). Complete within 72 hrs before return flight.
            </p>
            <p className="text-xs text-gold mt-1">Fill on Mar 4 (or eve of return). FD 137 departs 20:10.</p>
          </div>
        </div>
        <a
          href="https://www.india.gov.in/spotlight/india-e-arrival-card" target="_blank" rel="noopener noreferrer"
          className="mt-2 flex items-center justify-center gap-2 border border-red/40 text-red font-medium text-sm rounded-xl py-2"
        >
          Official Portal <ExternalLink size={14} />
        </a>
      </div>
      <MemberStatusTracker
        section="india_arrival"
        title="India e-Arrival Card"
        subtitle="Fill within 72 hrs before FD 137 on Mar 4"
      />
    </div>
  );
}

function FlightsSection() {
  return (
    <div className="space-y-3">
      <div className="bg-red/10 border border-red/30 rounded-xl p-3">
        <p className="text-xs text-red font-medium">⚠️ Return from DMK (Don Mueang) — NOT Suvarnabhumi. Leave Bangkok hotel by 17:00 on Mar 4.</p>
      </div>
      {FLIGHTS.map(f => (
        <div key={f.leg} className="bg-surface border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Plane size={14} className="text-gold" />
                <span className="font-mono font-bold text-gold">{f.flight}</span>
                <span className="text-xs text-muted">{f.airline}</span>
              </div>
              <div className="text-xs text-muted mt-0.5">PNR: {f.pnr}</div>
            </div>
            <a href={f.fr24} target="_blank" rel="noopener noreferrer"
              className="text-xs text-teal border border-teal/30 rounded-full px-2.5 py-1 flex items-center gap-1"
            >
              Track <ExternalLink size={11} />
            </a>
          </div>
          <div className="flex items-center gap-3">
            <div>
              <div className="font-mono font-bold text-lg">{f.from}</div>
              <div className="text-xs text-muted">{f.fromFull}</div>
            </div>
            <div className="flex-1 flex items-center gap-1 px-1">
              <div className="flex-1 h-px bg-border" />
              <Plane size={12} className="text-muted" />
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="text-right">
              <div className="font-mono font-bold text-lg">{f.to}</div>
              <div className="text-xs text-muted">{f.toFull}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-muted text-xs">Depart</span><br /><span className="font-medium">{f.depLocal}</span></div>
            <div><span className="text-muted text-xs">Arrive</span><br /><span className="font-medium">{f.arrLocal}</span></div>
          </div>
          {f.baggage && (
            <div className="text-xs text-muted bg-surface2 rounded-lg px-3 py-1.5">🧳 {f.baggage}</div>
          )}
          {f.note && <p className="text-xs text-teal/80">{f.note}</p>}
          {'warn' in f && f.warn && <p className="text-xs text-red/80">{f.warn}</p>}
        </div>
      ))}
    </div>
  );
}

function HotelsSection() {
  return (
    <div className="space-y-3">
      {[
        {
          name: 'Villa Aurora',
          location: 'Kamala, Phuket',
          checkin: 'Feb 28',
          checkout: 'Mar 3',
          ref: 'RCRW2FJNPN (Airbnb)',
          emoji: '🏡',
          notes: 'Private villa with pool · Kamala Beach',
          mapUrl: 'https://maps.app.goo.gl/yvRxuzL1BgPr3J2K8',
        },
        {
          name: 'Bangkok Hotel',
          location: 'Bangkok (TBC)',
          checkin: 'Mar 3',
          checkout: 'Mar 4',
          ref: '—',
          emoji: '🏨',
          notes: 'To be confirmed',
          mapUrl: null,
        },
      ].map((h, i) => (
        <div key={i} className="bg-surface border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl">{h.emoji}</span>
            <div className="flex-1">
              <h3 className="font-semibold">{h.name}</h3>
              <p className="text-sm text-muted flex items-center gap-1"><Hotel size={12} /> {h.location}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs text-muted">Check-in</p><p className="font-medium">{h.checkin}</p></div>
            <div><p className="text-xs text-muted">Check-out</p><p className="font-medium">{h.checkout}</p></div>
          </div>
          <div className="text-xs text-muted bg-surface2 rounded-lg px-3 py-1.5">📋 Ref: {h.ref}</div>
          {h.notes && <p className="text-xs text-muted">{h.notes}</p>}
          {h.mapUrl && (
            <a href={h.mapUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-teal">
              <ExternalLink size={12} /> View on Maps
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

function EmergencySection() {
  const contacts = [
    { label: 'Thailand Emergency',    number: '191',           type: 'emergency' },
    { label: 'Tourist Police',         number: '1155',          type: 'emergency', note: 'English-speaking' },
    { label: 'Ambulance / Medical',    number: '1669',          type: 'emergency' },
    { label: 'Fire',                   number: '199',           type: 'emergency' },
    { label: 'Indian Embassy Bangkok', number: '+66 2 258 0300', type: 'embassy',  note: 'Wireless Rd, Bangkok' },
    { label: 'Indian CWF Thailand',    number: '+66 2 258 5024', type: 'embassy' },
    { label: 'Bangkok Hospital Phuket',number: '+66 76 254 425', type: 'hospital' },
    { label: 'Phuket International Hospital', number: '+66 76 249 400', type: 'hospital' },
  ];
  const colors = { emergency: 'text-red', embassy: 'text-teal', hospital: 'text-gold' };
  return (
    <div className="space-y-2">
      {contacts.map(c => (
        <a key={c.label} href={`tel:${c.number.replace(/\s/g,'')}`}
          className="flex items-center gap-3 bg-surface border border-border rounded-xl px-4 py-3 hover:border-gold/40 transition-colors"
        >
          <Phone size={15} className={colors[c.type as keyof typeof colors] ?? 'text-muted'} />
          <div className="flex-1">
            <p className="text-sm font-medium">{c.label}</p>
            {c.note && <p className="text-xs text-muted">{c.note}</p>}
          </div>
          <span className={`font-mono text-sm font-bold ${colors[c.type as keyof typeof colors] ?? 'text-text'}`}>
            {c.number}
          </span>
        </a>
      ))}
    </div>
  );
}

/* ── Main page ── */
export default function DocsPage() {
  const [active, setActive] = useState<DocSection>('tdac');

  return (
    <div className="max-w-lg mx-auto">
      <div className="px-4 pt-6 pb-3">
        <h1 className="text-xl font-bold">Documents</h1>
        <p className="text-sm text-muted mt-0.5">TDAC · VOA · Flights · Hotels · Emergency</p>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-3 no-scrollbar">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActive(t.id)}
            className={`flex flex-col items-center shrink-0 rounded-xl px-3.5 py-2 border transition-all ${
              active === t.id
                ? 'bg-gold border-gold text-bg font-semibold'
                : 'bg-surface border-border text-muted'
            }`}
          >
            <span className="text-base">{t.emoji}</span>
            <span className="text-[10px] mt-0.5 whitespace-nowrap">{t.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="px-4 space-y-3"
        >
          {active === 'tdac'      && <TDACSection />}
          {active === 'voa'       && <VOASection />}
          {active === 'india'     && <IndiaSection />}
          {active === 'flights'   && <FlightsSection />}
          {active === 'hotels'    && <HotelsSection />}
          {active === 'emergency' && <EmergencySection />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
