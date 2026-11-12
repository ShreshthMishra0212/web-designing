const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

const form = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const statusEl = document.getElementById("status");
const weatherEl = document.getElementById("weather");
const unitButtons = document.querySelectorAll(".unit-toggle button");
const WEATHER_CODES = {
  0: { label: "Clear sky", day: "☀️", night: "🌙" },
  1: { label: "Mostly clear", day: "🌤️", night: "🌙" },
  2: { label: "Partly cloudy", day: "⛅", night: "☁️" },
  3: { label: "Overcast", day: "☁️", night: "☁️" },
  45: { label: "Foggy", day: "🌫️", night: "🌫️" },
  48: { label: "Freezing fog", day: "🌫️", night: "🌫️" },
  51: { label: "Light drizzle", day: "🌦️", night: "🌧️" },
  53: { label: "Drizzle", day: "🌦️", night: "🌧️" },
  55: { label: "Heavy drizzle", day: "🌧️", night: "🌧️" },
  56: { label: "Freezing drizzle", day: "🌧️", night: "🌧️" },
  57: { label: "Heavy freezing drizzle", day: "🌧️", night: "🌧️" },
  61: { label: "Light rain", day: "🌦️", night: "🌧️" },
  63: { label: "Rain", day: "🌧️", night: "🌧️" },
  65: { label: "Heavy rain", day: "🌧️", night: "🌧️" },
  66: { label: "Freezing rain", day: "🌧️", night: "🌧️" },
  67: { label: "Heavy freezing rain", day: "🌧️", night: "🌧️" },
  71: { label: "Light snow", day: "🌨️", night: "🌨️" },
  73: { label: "Snow", day: "❄️", night: "❄️" },
  75: { label: "Heavy snow", day: "❄️", night: "❄️" },
  77: { label: "Snow grains", day: "❄️", night: "❄️" },
  80: { label: "Light showers", day: "🌦️", night: "🌧️" },
  81: { label: "Showers", day: "🌧️", night: "🌧️" },
  82: { label: "Violent showers", day: "⛈️", night: "⛈️" },
  85: { label: "Light snow showers", day: "🌨️", night: "🌨️" },
  86: { label: "Heavy snow showers", day: "🌨️", night: "🌨️" },
  95: { label: "Thunderstorm", day: "⛈️", night: "⛈️" },
  96: { label: "Thunderstorm with hail", day: "⛈️", night: "⛈️" },
  99: { label: "Severe thunderstorm with hail", day: "⛈️", night: "⛈️" },
};
let currentPlace = null;
let unit = "celsius";

function describeWeather(code, isDay = true) {
  const info = WEATHER_CODES[code] || { label: "Unknown", day: "🌡️", night: "🌡️" };
  return { label: info.label, icon: isDay ? info.day : info.night };
}

function showStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
  statusEl.hidden = false;
}

function hideStatus() {
  statusEl.hidden = true;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}). Please try again.`);
  }
  return response.json();
}
async function findCity(name) {
  const params = new URLSearchParams({ name, count: 1, language: "en", format: "json" });
  const data = await fetchJson(`${GEOCODING_URL}?${params}`);

  if (!data.results || data.results.length === 0) {
    throw new Error(`Couldn't find "${name}". Check the spelling and try again.`);
  }

  const { name: cityName, admin1, country, latitude, longitude } = data.results[0];
  const label = [cityName, admin1, country].filter(Boolean).join(", ");
  return { label, latitude, longitude };
}

async function getWeather({ latitude, longitude }) {
  const useFahrenheit = unit === "fahrenheit";

  const params = new URLSearchParams({
    latitude,
    longitude,
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day",
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    forecast_days: 6,
    timezone: "auto",
    temperature_unit: unit,
    wind_speed_unit: useFahrenheit ? "mph" : "kmh",
  });

  return fetchJson(`${FORECAST_URL}?${params}`);
}
function renderWeather(place, data) {
  const { current, daily, current_units } = data;
  const degree = unit === "celsius" ? "°C" : "°F";
  const { label, icon } = describeWeather(current.weather_code, current.is_day === 1);

  document.getElementById("place").textContent = place.label;
  document.getElementById("icon").textContent = icon;
  document.getElementById("temp").textContent = `${Math.round(current.temperature_2m)}${degree}`;
  document.getElementById("description").textContent = label;
  document.getElementById("feels").textContent = `${Math.round(current.apparent_temperature)}${degree}`;
  document.getElementById("humidity").textContent = `${current.relative_humidity_2m}%`;
  document.getElementById("wind").textContent = `${Math.round(current.wind_speed_10m)} ${current_units.wind_speed_10m}`;

  const forecastList = document.getElementById("forecast");
  forecastList.innerHTML = "";

  for (let i = 1; i < daily.time.length; i++) {
    const day = new Date(`${daily.time[i]}T00:00:00`).toLocaleDateString(undefined, { weekday: "short" });
    const { label: dayLabel, icon: dayIcon } = describeWeather(daily.weather_code[i]);

    const item = document.createElement("li");
    item.innerHTML = `
      <span class="day">${day}</span>
      <span>${dayIcon}</span>
      <span>${dayLabel}</span>
      <span class="range">${Math.round(daily.temperature_2m_max[i])}° <span class="low">${Math.round(daily.temperature_2m_min[i])}°</span></span>
    `;
    forecastList.appendChild(item);
  }

  hideStatus();
  weatherEl.hidden = false;
}
async function loadWeatherFor(place) {
  showStatus("Fetching the latest weather…");
  weatherEl.hidden = true;

  try {
    const data = await getWeather(place);
    renderWeather(place, data);
  } catch (error) {
    showStatus(error.message || "Something went wrong. Please try again.", true);
  }
}

async function searchCity(name) {
  showStatus("Looking up that city…");
  weatherEl.hidden = true;

  try {
    currentPlace = await findCity(name);
    localStorage.setItem("lastCity", name);
    await loadWeatherFor(currentPlace);
  } catch (error) {
    showStatus(error.message || "Something went wrong. Please try again.", true);
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = cityInput.value.trim();
  if (name) searchCity(name);
});

unitButtons.forEach((button) => {
  button.addEventListener("click", () => {
    unit = button.dataset.unit;
    localStorage.setItem("unit", unit);
    unitButtons.forEach((b) => b.classList.toggle("active", b === button));
    if (currentPlace) loadWeatherFor(currentPlace);
  });
});

(function init() {
  try {
    const savedUnit = localStorage.getItem("unit");
    if (savedUnit === "celsius" || savedUnit === "fahrenheit") {
      unit = savedUnit;
      unitButtons.forEach((b) => b.classList.toggle("active", b.dataset.unit === unit));
    }

    const lastCity = localStorage.getItem("lastCity");
    if (lastCity) {
      cityInput.value = lastCity;
      searchCity(lastCity);
    }
  } catch {
  }
})();