// Mumbai local time and live weather (Open-Meteo, free, no key). The sky
// follows IST; rain follows the real forecast. Mumbai never gets snow.
// Overrides for review: ?sky=day|dusk|night and ?weather=rain|clear.
const KEY = 'v3:mumbai-weather';
const TTL = 15 * 60 * 1000;
const URL_ = 'https://api.open-meteo.com/v1/forecast?latitude=19.07&longitude=72.88'
  + '&current=temperature_2m,precipitation,rain,weather_code&timezone=Asia%2FKolkata';

function param(name) {
  try {
    const hash = window.location.hash, q = hash.indexOf('?');
    return new URLSearchParams(window.location.search).get(name)
      || (q >= 0 ? new URLSearchParams(hash.slice(q)).get(name) : null);
  } catch { return null; }
}

export function istParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', month: 'numeric', hourCycle: 'h23' })
    .formatToParts(date).reduce((o, p) => (o[p.type] = p.value, o), {});
  return { hour: Number(parts.hour), minute: Number(parts.minute), month: Number(parts.month), label: `${parts.hour}:${parts.minute}` };
}

export function mumbaiSky(date = new Date()) {
  const { hour } = istParts(date);
  if (hour >= 7 && hour < 17) return 'day';
  if ((hour >= 17 && hour < 19) || (hour >= 5 && hour < 7)) return 'dusk';
  return 'night';
}

// WMO codes: drizzle 51-57, rain 61-67, showers 80-82, thunderstorm 95-99.
const RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]);
const LABELS = { 51: 'drizzle', 53: 'drizzle', 55: 'drizzle', 61: 'light rain', 63: 'rain', 65: 'heavy rain', 80: 'showers', 81: 'showers', 82: 'heavy showers', 95: 'thunderstorm', 96: 'thunderstorm', 99: 'thunderstorm',
  0: 'clear', 1: 'mostly clear', 2: 'partly cloudy', 3: 'overcast', 45: 'haze', 48: 'haze' };

function summarise(current) {
  const code = current?.weather_code;
  const raining = RAIN_CODES.has(code) || (current?.precipitation ?? 0) > 0.05;
  return {
    raining,
    temperature: typeof current?.temperature_2m === 'number' ? Math.round(current.temperature_2m) : null,
    label: LABELS[code] || (raining ? 'rain' : 'humid'),
  };
}

export async function fetchMumbaiWeather() {
  const forced = param('weather');
  if (forced === 'rain' || forced === 'clear') {
    return { raining: forced === 'rain', temperature: null, label: forced === 'rain' ? 'rain' : 'clear', forced: true };
  }
  try {
    const cached = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (cached && Date.now() - cached.at < TTL) return cached.weather;
  } catch { /* private mode */ }
  try {
    const response = await fetch(URL_);
    if (!response.ok) return null;
    const weather = summarise((await response.json()).current);
    try { localStorage.setItem(KEY, JSON.stringify({ at: Date.now(), weather })); } catch { /* quota */ }
    return weather;
  } catch {
    return null;
  }
}
