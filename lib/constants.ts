export const MEMBERS = [
  'Mahendra', 'Namrata', 'Ishmeet', 'Meghana', 'Unmesh', 'Harish', 'Swaroop',
] as const;

export type Member = (typeof MEMBERS)[number];

export const MEMBER_COLORS: Record<Member, string> = {
  Mahendra:  '#F5C842',
  Namrata:   '#00C9A7',
  Ishmeet:   '#FF7EB3',
  Meghana:   '#7C83FD',
  Unmesh:    '#FF9A3C',
  Harish:    '#4ECDC4',
  Swaroop:   '#C471ED',
};

export const TOTAL_CASH = 70_000; // ฿

export const TRIP = {
  departure: new Date('2026-02-27T17:40:00.000Z'), // BLR dep 23:10 IST = 17:40 UTC
  start:     new Date('2026-02-28T00:00:00+07:00'), // Feb 28 Bangkok time
  end:       new Date('2026-03-04T23:59:59+07:00'),
};

export const FLIGHTS = [
  {
    leg: 1, flight: 'FD 138', airline: 'Thai AirAsia',
    from: 'BLR', fromFull: 'Bengaluru T2',
    to:   'DMK', toFull:   'Don Mueang T1',
    depLocal: 'Feb 27, 23:10', arrLocal: 'Feb 28, 04:25',
    depUTC: '2026-02-27T17:40:00Z',
    pnr: 'DBWNXZ', baggage: '20 KG + 7 KG cabin', insurance: 'ACKO',
    fr24: 'https://www.flightradar24.com/data/flights/fd138',
    note: 'International. Arrive DMK T1 → transfer to T2 for domestic.',
  },
  {
    leg: 2, flight: 'SL 0754', airline: 'Thai Lion Air',
    from: 'DMK', fromFull: 'Don Mueang T2',
    to:   'HKT', toFull:   'Phuket Domestic',
    depLocal: 'Feb 28, 10:20', arrLocal: 'Feb 28, 11:40',
    depUTC: '2026-02-28T03:20:00Z',
    pnr: 'QKAEWX', baggage: '15 KG checked',
    fr24: 'https://www.flightradar24.com/data/flights/sl754',
    note: '6 hr layover at DMK. Clear immigration before heading to T2.',
  },
  {
    leg: 3, flight: 'SL 0759', airline: 'Thai Lion Air',
    from: 'HKT', fromFull: 'Phuket Domestic',
    to:   'DMK', toFull:   'Don Mueang T2',
    depLocal: 'Mar 3, 11:35', arrLocal: 'Mar 3, 12:55',
    depUTC: '2026-03-03T04:35:00Z',
    pnr: 'QKAEWX', baggage: '15 KG checked',
    fr24: 'https://www.flightradar24.com/data/flights/sl759',
    note: 'Phuket → Bangkok. Check in for Day 4.',
  },
  {
    leg: 4, flight: 'FD 137', airline: 'Thai AirAsia',
    from: 'DMK', fromFull: 'Don Mueang T1',
    to:   'BLR', toFull:   'Bengaluru T2',
    depLocal: 'Mar 4, 20:10', arrLocal: 'Mar 4, 22:30',
    depUTC: '2026-03-04T13:10:00Z',
    pnr: 'DBWNXZ', baggage: '20 KG + 7 KG cabin', insurance: 'ACKO',
    fr24: 'https://www.flightradar24.com/data/flights/fd137',
    warn: '⚠ Depart from DMK (Don Mueang) — NOT Suvarnabhumi. Leave hotel by 17:00.',
  },
];

export const ITINERARY_DAYS = [
  {
    day: 1, date: '2026-02-28', title: 'Arrival in Paradise',
    location: 'Phuket · Kamala',
    activities: [
      { time: '04:25', label: 'Land at DMK', emoji: '✈️', type: 'transit' },
      { time: '10:20', label: 'SL 0754 DMK → HKT', emoji: '✈️', type: 'transit' },
      { time: '12:00', label: 'Lunch — Lillo Island Restaurant & Bar', emoji: '🍽️', note: 'Kamala Beach', type: 'food', cost: 800 },
      { time: '14:00', label: 'Check-in — Villa Aurora', emoji: '🏠', note: 'Kamala, Phuket · Ref: RCRW2FJNPN', type: 'stay' },
      { time: '17:30', label: 'Sunset — Café del Mar Beach Club', emoji: '🌅', note: 'Kamala Beach', type: 'activity', cost: 600 },
      { time: '20:00', label: 'Dinner — Marush Kamala', emoji: '🍽️', note: 'Mediterranean / Middle Eastern', type: 'food', cost: 700 },
      { time: '22:00', label: 'Villa Aurora pool party', emoji: '🏊', type: 'activity' },
    ],
    perPersonCost: 9540,
  },
  {
    day: 2, date: '2026-03-01', title: 'Phi Phi Islands',
    location: 'Phi Phi · Andaman Sea',
    activities: [
      { time: '07:30', label: 'Breakfast — Lafayette French Bakery', emoji: '🥐', type: 'food', cost: 350 },
      { time: '09:00', label: 'Phi Phi Speedboat Tour', emoji: '🚤', note: 'Maya Bay · Pileh Lagoon · Snorkeling', type: 'activity', cost: 2800 },
      { time: '18:00', label: 'Return to villa', emoji: '🏠', type: 'stay' },
      { time: '20:00', label: 'Bangla Road & Illuzion Club', emoji: '🌙', note: 'Patong nightlife', type: 'nightlife', cost: 2500 },
    ],
    perPersonCost: 11244,
  },
  {
    day: 3, date: '2026-03-02', title: 'Jungle Adventures',
    location: 'Phuket · Patong',
    activities: [
      { time: '08:30', label: 'Breakfast — 936 Coffee', emoji: '☕', note: 'Kamala beachfront', type: 'food', cost: 350 },
      { time: '10:00', label: 'Flying Hanuman Zipline', emoji: '🪂', note: 'Jungle canopy', type: 'activity', cost: 2500 },
      { time: '13:00', label: 'Lunch — Three Monkeys Restaurant', emoji: '🍽️', note: 'Treehouse dining', type: 'food', cost: 600 },
      { time: '15:00', label: 'Villa pool time', emoji: '🏊', type: 'activity' },
      { time: '20:00', label: 'Farewell Dinner — SILK at Andara', emoji: '🍽️', note: 'Fine dining · Villa farewell party after', type: 'food', cost: 2500 },
    ],
    perPersonCost: 14910,
  },
  {
    day: 4, date: '2026-03-03', title: 'Phuket → Bangkok',
    location: 'Bangkok',
    activities: [
      { time: '08:00', label: 'Farewell buffet — Pinto at InterContinental', emoji: '🍳', type: 'food', cost: 1200 },
      { time: '11:35', label: 'SL 0759 HKT → DMK', emoji: '✈️', type: 'transit' },
      { time: '13:00', label: 'Bangkok hotel check-in', emoji: '🏨', type: 'stay' },
      { time: '14:00', label: 'Grand Palace & Emerald Buddha', emoji: '🛕', note: 'Closes 15:30 — go early!', type: 'activity', cost: 500 },
      { time: '19:00', label: 'Yaowarat Chinatown Night Market', emoji: '🍜', note: 'Street food experience', type: 'food', cost: 600 },
    ],
    perPersonCost: 6574,
  },
  {
    day: 5, date: '2026-03-04', title: 'Last Day in Bangkok',
    location: 'Bangkok',
    activities: [
      { time: '10:00', label: 'Traditional Thai Massage', emoji: '💆', note: 'Sukhumvit', type: 'activity', cost: 600 },
      { time: '12:00', label: 'ICONSIAM Riverside Mall', emoji: '🛍️', note: 'Floating market inside', type: 'activity' },
      { time: '14:00', label: 'Wat Arun — Temple of Dawn', emoji: '🛕', note: 'Best view from across the river', type: 'activity', cost: 100 },
      { time: '17:00', label: 'Octave Rooftop Bar', emoji: '🍸', note: '45th floor · 360° views', type: 'nightlife', cost: 1500 },
      { time: '20:10', label: 'FD 137 DMK → BLR', emoji: '✈️', note: 'Don Mueang T1 · Leave hotel by 17:00', type: 'transit' },
    ],
    perPersonCost: 5667,
  },
];

// Coords for weather
export const LOCATIONS: Record<string, { lat: number; lon: number; name: string }> = {
  bengaluru: { lat: 12.97, lon: 77.59, name: 'Bengaluru' },
  phuket:    { lat: 7.89,  lon: 98.40, name: 'Phuket' },
  bangkok:   { lat: 13.75, lon: 100.52, name: 'Bangkok' },
};

export const EXPENSE_CATEGORIES = [
  { value: 'food',          label: '🍜 Food & Drinks' },
  { value: 'transport',     label: '🚌 Transport' },
  { value: 'accommodation', label: '🏨 Accommodation' },
  { value: 'activities',    label: '🎡 Activities & Tours' },
  { value: 'shopping',      label: '🛍️ Shopping' },
  { value: 'medical',       label: '💊 Medical' },
  { value: 'misc',          label: '📌 Miscellaneous' },
];
