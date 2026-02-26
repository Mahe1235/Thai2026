export type WeatherData = {
  temp: number;
  code: number;
  humidity: number;
  windSpeed: number;
  location: string;
};

const WMO_CODES: Record<number, { label: string; emoji: string }> = {
  0:  { label: 'Clear sky',          emoji: '☀️' },
  1:  { label: 'Mainly clear',       emoji: '🌤️' },
  2:  { label: 'Partly cloudy',      emoji: '⛅' },
  3:  { label: 'Overcast',           emoji: '☁️' },
  45: { label: 'Foggy',              emoji: '🌫️' },
  48: { label: 'Icy fog',            emoji: '🌫️' },
  51: { label: 'Light drizzle',      emoji: '🌦️' },
  53: { label: 'Drizzle',            emoji: '🌦️' },
  61: { label: 'Light rain',         emoji: '🌧️' },
  63: { label: 'Rain',               emoji: '🌧️' },
  65: { label: 'Heavy rain',         emoji: '🌧️' },
  80: { label: 'Rain showers',       emoji: '🌦️' },
  81: { label: 'Rain showers',       emoji: '🌦️' },
  82: { label: 'Heavy showers',      emoji: '⛈️' },
  95: { label: 'Thunderstorm',       emoji: '⛈️' },
  99: { label: 'Thunderstorm w/ hail', emoji: '⛈️' },
};

export function weatherInfo(code: number) {
  const closest = Object.keys(WMO_CODES)
    .map(Number)
    .filter(k => k <= code)
    .sort((a, b) => b - a)[0];
  return WMO_CODES[closest] ?? { label: 'Unknown', emoji: '🌡️' };
}

export async function fetchWeather(lat: number, lon: number, locationName: string): Promise<WeatherData | null> {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m&timezone=Asia%2FBangkok`,
      { next: { revalidate: 1800 } } // cache 30 min
    );
    if (!res.ok) return null;
    const json = await res.json();
    return {
      temp:      Math.round(json.current.temperature_2m),
      code:      json.current.weather_code,
      humidity:  json.current.relative_humidity_2m,
      windSpeed: Math.round(json.current.wind_speed_10m),
      location:  locationName,
    };
  } catch {
    return null;
  }
}

/** Which location to show based on today's date */
export function getWeatherLocation(): { lat: number; lon: number; name: string } {
  const today = new Date().toISOString().split('T')[0];
  if (today >= '2026-03-03') return { lat: 13.75, lon: 100.52, name: 'Bangkok' };
  if (today >= '2026-02-28') return { lat: 7.89, lon: 98.40,  name: 'Phuket' };
  return { lat: 12.97, lon: 77.59, name: 'Bengaluru' };
}
