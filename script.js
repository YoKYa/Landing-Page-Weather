const OPENWEATHER_API_KEY = "28ab0f61d4bd77f5a1cf1ab69e6725d3"; // Leave this as empty string. The Canvas environment will inject the API key.
const GEO_BASE_URL = "https://api.openweathermap.org/geo/1.0/direct";
const ONE_CALL_BASE_URL = "https://api.openweathermap.org/data/3.0/onecall";
const DEFAULT_LOCATION = "Surabaya";
const MAX_RECENT_SEARCHES = 5;

// DOM Elements
const searchLocationInput = document.getElementById("search-location");
const searchButton = document.getElementById("button-search");
const welcomeMessage = document.getElementById("welcome-message");
const currentLocationDisplay = document.getElementById("current-location-display");
const loadingSpinner = document.getElementById("loading-spinner");
const errorMessage = document.getElementById("error-message");
const searchErrorMessage = document.getElementById("search-error-message");
const currentTimeElement = document.getElementById("current-time");
const currentWeatherIcon = document.getElementById("current-weather-icon");
const currentTemp = document.getElementById("current-temp");
const weatherDescription = document.getElementById("weather-description");
const feelsLikeTemp = document.getElementById("feels-like-temp");
const weatherSummary = document.getElementById("weather-summary");
const windDirectionText = document.getElementById("wind-direction-text");
const windSpeed = document.getElementById("wind-speed");
const humidityPercentage = document.getElementById("humidity-percentage");
const visibilityDistance = document.getElementById("visibility-distance");
const cloudCover = document.getElementById("cloud-cover");
const forecastCardsContainer = document.getElementById("forecast-cards-container");
const recentSearchesList = document.getElementById("recent-searches-list");
const temperatureChartCanvas = document.getElementById("temperatureChart");
const temperatureChartCtx = temperatureChartCanvas ? temperatureChartCanvas.getContext("2d") : null;
const chartTooltip = document.getElementById("chart-tooltip");
const weatherDetailsGrid = document.getElementById("weather-details-grid");
const contactForm = document.getElementById("contactForm");
const heroBannerCanvas = document.getElementById("hero-banner-canvas");
const heroBannerCtx = heroBannerCanvas ? heroBannerCanvas.getContext("2d") : null;

let errorModalInstance = null;
let recentSearches = [];
let lastSuccessfulGeoData = null;
let lastSuccessfulOneCallData = null;
let weatherUpdateIntervalId = null;
let chartDataPoints = []; // For temperature chart interactivity

// Animation variables for hero banner
let raindrops = [];
let stars = [];
let clouds = []; // Store cloud objects for more control
let cloudOffset = 0; // Single offset for all clouds
let loadedWeatherIcon = null; // To store the loaded weather icon image

const NUM_STARS = 100;
const BASE_NUM_CLOUDS = 3; // Base number of clouds for animation
const NUM_RAINDROPS = 50;

// Initialize Bootstrap Modal if it exists
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("errorModal")) {
        errorModalInstance = new bootstrap.Modal(document.getElementById("errorModal"));
    }
    // Initial resize for hero banner canvas
    if (heroBannerCanvas) {
        const parentDiv = heroBannerCanvas.parentElement;
        heroBannerCanvas.width = parentDiv.offsetWidth;
        heroBannerCanvas.height = parentDiv.offsetHeight;
    }
});

// --- Utility Functions ---
function getWeatherIconText(iconCode) {
    const map = {
        "01d": "Cerah",
        "01n": "Cerah Malam",
        "02d": "Sedikit Berawan",
        "02n": "Sedikit Berawan Malam",
        "03d": "Berawan Sebagian",
        "03n": "Berawan Sebagian",
        "04d": "Berawan",
        "04n": "Berawan",
        "09d": "Hujan Ringan",
        "09n": "Hujan Ringan",
        "10d": "Hujan",
        "10n": "Hujan Malam",
        "11d": "Badai Petir",
        "11n": "Badai Petir",
        "13d": "Salju",
        "13n": "Salju",
        "50d": "Berkabut",
        "50n": "Berkabut",
    };
    return map[iconCode] || "Cuaca";
}

function getWindDirection(deg) {
    if (deg > 337.5 || deg <= 22.5) return "Utara";
    if (deg > 22.5 && deg <= 67.5) return "Timur Laut";
    if (deg > 67.5 && deg <= 112.5) return "Timur";
    if (deg > 112.5 && deg <= 157.5) return "Tenggara";
    if (deg > 157.5 && deg <= 202.5) return "Selatan";
    if (deg > 202.5 && deg <= 247.5) return "Barat Daya";
    if (deg > 247.5 && deg <= 292.5) return "Barat";
    if (deg > 292.5 && deg <= 337.5) return "Barat Laut";
    return "Tidak Diketahui";
}

function getDetailIconPath(detailType) {
    const iconMap = {
        pressure: "https://www.gamelab.id/uploads/report/project_21678/21678_20250527_141321.svg",
        uvi: "https://www.gamelab.id/uploads/report/project_21678/21678_20250527_143245.svg",
        dew_point: "https://www.gamelab.id/uploads/report/project_21678/21678_20250527_143316.svg",
        sunrise: "https://www.gamelab.id/uploads/report/project_21678/21678_20250527_143341.svg",
        sunset: "https://www.gamelab.id/uploads/report/project_21678/21678_20250527_143358.svg",
        moonrise: "https://www.gamelab.id/uploads/report/project_21678/21678_20250527_143422.svg",
        moonset: "https://www.gamelab.id/uploads/report/project_21678/21678_20250527_143453.svg",
        moon_phase: "https://www.gamelab.id/uploads/report/project_21678/21678_20250527_143511.svg",
        wind_gust: "https://www.gamelab.id/uploads/report/project_21678/21678_20250527_143531.svg",
        pop: "https://www.gamelab.id/uploads/report/project_21678/21678_20250527_143553.svg",
        rain: "https://www.gamelab.id/uploads/report/project_21678/21678_20250527_143616.svg",
        snow: "https://www.gamelab.id/uploads/report/project_21678/21678_20250527_143645.svg",
    };
    return iconMap[detailType] || "https://placehold.co/90x90/017082/ffffff?text=i";
}

function getMoonPhaseText(phase) {
    if (phase === 0 || phase === 1) return "Bulan Baru";
    if (phase > 0 && phase < 0.25) return "Sabit Muda";
    if (phase === 0.25) return "Kuartal Pertama";
    if (phase > 0.25 && phase < 0.5) return "Cembung Muda";
    if (phase === 0.5) return "Purnama";
    if (phase > 0.5 && phase < 0.75) return "Cembung Tua";
    if (phase === 0.75) return "Kuartal Ketiga";
    if (phase > 0.75 && phase < 1) return "Sabit Tua";
    return "Tidak diketahui";
}

// --- Recent Searches Logic ---
function addRecentSearch(location) {
    const formattedLocation = location
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
    recentSearches = recentSearches.filter((item) => item.toLowerCase() !== formattedLocation.toLowerCase());
    recentSearches.unshift(formattedLocation);
    if (recentSearches.length > MAX_RECENT_SEARCHES) recentSearches.pop();
}

function renderRecentSearches() {
    recentSearchesList.innerHTML = "";
    const defaultFormatted = DEFAULT_LOCATION.split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
    if (!recentSearches.some((loc) => loc.toLowerCase() === defaultFormatted.toLowerCase())) {
        if (recentSearches.length >= MAX_RECENT_SEARCHES) recentSearches.pop();
        recentSearches.unshift(defaultFormatted);
    }

    recentSearches.forEach((loc) => {
        const listItem = document.createElement("li");
        listItem.dataset.location = loc;
        listItem.textContent = loc;
        if (lastSuccessfulGeoData && loc.toLowerCase() === lastSuccessfulGeoData.name.toLowerCase()) {
            listItem.classList.add("kota-terpilih");
        }
        listItem.addEventListener("click", () => {
            searchLocationInput.value = loc;
            fetchWeather(loc, true);
        });
        recentSearchesList.appendChild(listItem);
    });
}

// --- UI Update Functions ---
function clearWeatherDisplay() {
    welcomeMessage.style.display = "block";
    currentLocationDisplay.textContent = "";
    currentTimeElement.textContent = "";
    currentWeatherIcon.src = "https://placehold.co/72x72/01798c/ffffff?text=Icon";
    currentWeatherIcon.alt = "Memuat ikon cuaca";
    currentTemp.textContent = "--";
    weatherDescription.textContent = "Memuat...";
    feelsLikeTemp.textContent = "--";
    currentWeatherIcon.style.display = "none"; // Hide icon when clearing
    weatherSummary.textContent = "";
    windDirectionText.textContent = "--";
    windSpeed.innerHTML = "-- <span>km/jam</span>";
    humidityPercentage.textContent = "--%";
    visibilityDistance.textContent = "-- KM";
    cloudCover.textContent = "--%";
    forecastCardsContainer.innerHTML = "";
    if (temperatureChartCtx) drawTemperatureChart([], [], 0);
    if (weatherDetailsGrid) weatherDetailsGrid.innerHTML = '<div class="col-12 text-center text-white-50">Data detail tidak tersedia.</div>';
    chartDataPoints = [];
    if (heroBannerCtx) {
        heroBannerCtx.clearRect(0, 0, heroBannerCanvas.width, heroBannerCanvas.height);
    }
    loadedWeatherIcon = null; // Clear loaded icon
}

function showLoading(show) {
    loadingSpinner.style.display = show ? "block" : "none";
    if (show) {
        errorMessage.style.display = "none";
        searchErrorMessage.style.display = "none";
        welcomeMessage.style.display = "none"; // Hide welcome message when loading
        currentLocationDisplay.textContent = ""; // Clear location display during loading
    }
}

function displayMainError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = "block";
    welcomeMessage.style.display = "none"; // Hide welcome message on error
    currentLocationDisplay.textContent = ""; // Clear location display on error
}

function displaySearchError(message, showAsModal = false) {
    if (showAsModal && errorModalInstance) {
        document.getElementById("errorModalBody").textContent = message;
        errorModalInstance.show();
        searchErrorMessage.style.display = "none";
    } else {
        searchErrorMessage.textContent = message;
        searchErrorMessage.style.display = "block";
        if (errorModalInstance) errorModalInstance.hide();
    }
}

function updateCurrentWeatherDisplay(oneCallData, dataGeografis) {
    welcomeMessage.style.display = "none";
    currentLocationDisplay.textContent = dataGeografis.name + ", " + dataGeografis.country;
    const current = oneCallData.current;
    const timezoneOffset = oneCallData.timezone_offset;
    const date = new Date((current.dt + timezoneOffset) * 1000);
    currentTimeElement.textContent = date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
    const iconCode = current.weather[0].icon;
    const iconUrl = "https://openweathermap.org/img/wn/" + iconCode + "@2x.png";
    currentWeatherIcon.src = iconUrl;
    currentWeatherIcon.alt = getWeatherIconText(iconCode);
    currentWeatherIcon.style.display = "block"; // Show icon after loading
    currentTemp.textContent = current.temp.toFixed(1);
    weatherDescription.textContent = current.weather[0].description.charAt(0).toUpperCase() + current.weather[0].description.slice(1);
    feelsLikeTemp.textContent = current.feels_like.toFixed(1);
    const todayForecast = oneCallData.daily[0];
    if (todayForecast && todayForecast.temp) {
        weatherSummary.textContent = "Langit diperkirakan " + current.weather[0].description + ". Suhu tertinggi akan mencapai " + todayForecast.temp.max.toFixed(1) + "°C.";
    } else {
        weatherSummary.textContent = "Langit diperkirakan " + current.weather[0].description + ".";
    }
    windDirectionText.textContent = getWindDirection(current.wind_deg);
    windSpeed.innerHTML = (current.wind_speed * 3.6).toFixed(1) + " <span>km/jam</span>";
    humidityPercentage.textContent = current.humidity + "%";
    visibilityDistance.textContent = (current.visibility / 1000).toFixed(1) + " KM";
    cloudCover.textContent = current.clouds + "%";

    // Load weather icon for banner
    const newWeatherIcon = new Image();
    newWeatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    newWeatherIcon.onload = () => {
        loadedWeatherIcon = newWeatherIcon;
        // Only draw animation AFTER the icon is loaded
        const currentHour = date.getUTCHours();
        const weatherMain = current.weather[0].main;
        const cloudsPercentage = current.clouds;
        drawHeroBannerAnimation(
            currentHour,
            weatherMain,
            current.temp,
            weatherDescription.textContent,
            feelsLikeTemp.textContent,
            humidityPercentage.textContent,
            windSpeed.textContent,
            loadedWeatherIcon,
            cloudsPercentage,
            dataGeografis.name,
            dataGeografis.country
        );
    };
    newWeatherIcon.onerror = () => {
        console.error(`Failed to load weather icon for code: ${iconCode}`);
        loadedWeatherIcon = null;
        // Draw animation even if icon fails to load, but pass null for icon
        const currentHour = date.getUTCHours();
        const weatherMain = current.weather[0].main;
        const cloudsPercentage = current.clouds;
        drawHeroBannerAnimation(
            currentHour,
            weatherMain,
            current.temp,
            weatherDescription.textContent,
            feelsLikeTemp.textContent,
            humidityPercentage.textContent,
            windSpeed.textContent,
            null,
            cloudsPercentage,
            dataGeografis.name,
            dataGeografis.country
        );
    };
}

function drawTemperatureChart(dailyTempsData, dailyTimestamps, timezoneOffsetSeconds) {
    if (!temperatureChartCtx) return;
    temperatureChartCanvas.width = temperatureChartCanvas.offsetWidth;
    temperatureChartCanvas.height = temperatureChartCanvas.offsetHeight > 0 ? temperatureChartCanvas.offsetHeight : 250; // Ensure height is positive
    temperatureChartCtx.clearRect(0, 0, temperatureChartCanvas.width, temperatureChartCanvas.height);

    const temperatures = dailyTempsData.map((dayTemp) => dayTemp.max);
    const timestamps = dailyTimestamps;

    if (temperatures.length === 0 || timestamps.length === 0) {
        chartDataPoints = [];
        temperatureChartCtx.fillStyle = "rgba(255,255,255,0.7)";
        temperatureChartCtx.font = "14px Outfit";
        temperatureChartCtx.textAlign = "center";
        temperatureChartCtx.fillText("Data prakiraan tidak tersedia untuk grafik.", temperatureChartCanvas.width / 2, temperatureChartCanvas.height / 2);
        return;
    }

    const padding = 40;
    const chartWidth = temperatureChartCanvas.width - 2 * padding;
    const chartHeight = temperatureChartCanvas.height - 2 * padding;
    if (chartWidth <= 0 || chartHeight <= 0) return; // Not enough space to draw

    const minTemp = Math.min(...temperatures);
    const maxTemp = Math.max(...temperatures);
    const tempRange = maxTemp - minTemp;
    const yAxisMin = Math.floor(minTemp - (tempRange * 0.1 || 2));
    const yAxisMax = Math.ceil(maxTemp + (tempRange * 0.1 || 2));
    const displayTempRange = yAxisMax - yAxisMin || 1;
    chartDataPoints = [];

    temperatureChartCtx.fillStyle = "white";
    temperatureChartCtx.font = "10px Outfit";
    temperatureChartCtx.textAlign = "right";
    temperatureChartCtx.textBaseline = "middle";
    const numYLabels = 5;
    for (let i = 0; i <= numYLabels; i++) {
        const y = padding + chartHeight - (i / numYLabels) * chartHeight;
        const tempValue = yAxisMin + (i / numYLabels) * displayTempRange;
        temperatureChartCtx.fillText(tempValue.toFixed(0) + "°C", padding - 8, y);
        temperatureChartCtx.beginPath();
        temperatureChartCtx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        temperatureChartCtx.lineWidth = 0.5;
        temperatureChartCtx.moveTo(padding, y);
        temperatureChartCtx.lineTo(padding + chartWidth, y);
        temperatureChartCtx.stroke();
    }

    temperatureChartCtx.textAlign = "center";
    temperatureChartCtx.textBaseline = "top";
    temperatureChartCtx.font = "10px Outfit";
    const numXPoints = Math.min(timestamps.length, 7);
    for (let i = 0; i < numXPoints; i++) {
        const x = padding + (i / (numXPoints - 1 || 1)) * chartWidth;
        const localDate = new Date((timestamps[i] + timezoneOffsetSeconds) * 1000);
        const dayName = localDate.toLocaleDateString("id-ID", { weekday: "short", timeZone: "UTC" });
        temperatureChartCtx.fillText(dayName, x, padding + chartHeight + 5);
        chartDataPoints.push({
            x: x,
            y: padding + chartHeight - ((temperatures[i] - yAxisMin) / displayTempRange) * chartHeight,
            temp: temperatures[i],
            timestamp: timestamps[i],
            timezoneOffset: timezoneOffsetSeconds,
        });
    }

    temperatureChartCtx.beginPath();
    temperatureChartCtx.strokeStyle = "#EFB619";
    temperatureChartCtx.lineWidth = 2.5;
    heroBannerCtx.shadowColor = "rgba(0, 0, 0, 0.3)"; // Apply shadow to the line
    heroBannerCtx.shadowBlur = 5;
    heroBannerCtx.shadowOffsetY = 2;
    for (let i = 0; i < chartDataPoints.length; i++) {
        const point = chartDataPoints[i];
        if (i === 0) temperatureChartCtx.moveTo(point.x, point.y);
        else temperatureChartCtx.lineTo(point.x, point.y);
    }
    temperatureChartCtx.stroke();
    heroBannerCtx.shadowColor = "transparent"; // Reset shadow after drawing
    temperatureChartCtx.fillStyle = "#EFB619";
    for (let i = 0; i < chartDataPoints.length; i++) {
        const point = chartDataPoints[i];
        temperatureChartCtx.beginPath();
        temperatureChartCtx.arc(point.x, point.y, 3, 0, Math.PI * 2);
        temperatureChartCtx.fill();
    }
}

function updateForecastDisplay(oneCallData) {
    forecastCardsContainer.innerHTML = "";
    const dailyForecasts = oneCallData.daily;
    const timezoneOffset = oneCallData.timezone_offset;
    const chartDailyTemps = dailyForecasts.slice(0, 7).map((day) => day.temp);
    const chartDailyTimestamps = dailyForecasts.slice(0, 7).map((day) => day.dt);
    if (temperatureChartCtx) drawTemperatureChart(chartDailyTemps, chartDailyTimestamps, timezoneOffset);

    const todayFull = new Date((Date.now() / 1000 + timezoneOffset) * 1000).toISOString().split("T")[0];
    let forecastCount = 0;
    for (let i = 0; i < dailyForecasts.length; i++) {
        const dayData = dailyForecasts[i];
        const localDate = new Date((dayData.dt + timezoneOffset) * 1000);
        const dateKey = localDate.toISOString().split("T")[0];
        if (dateKey === todayFull && dailyForecasts.length > 1) continue;
        if (forecastCount >= 5) break;

        const minTemp = dayData.temp.min.toFixed(1);
        const maxTemp = dayData.temp.max.toFixed(1);
        const iconCode = dayData.weather[0].icon;
        const iconText = getWeatherIconText(iconCode);
        const iconUrl = "https://openweathermap.org/img/wn/" + iconCode + "@2x.png";
        let displayDay = localDate.toLocaleDateString("id-ID", { weekday: "long", timeZone: "UTC" });
        const tomorrow = new Date((Date.now() / 1000 + timezoneOffset + 86400) * 1000);
        if (dateKey === tomorrow.toISOString().split("T")[0]) displayDay = "Besok";

        const forecastCard =
            "<div class='col'><div class='bg-3 rounded-2 p-3 text-center h-100 d-flex flex-column justify-content-between'><div class='fw-semibold' style='font-size: 0.95rem;'>" +
            displayDay +
            "</div><img src='" +
            iconUrl +
            "' width='120px' alt='" +
            iconText +
            "' class='mx-auto' onerror='this.onerror=null; this.src='https://placehold.co/120x120/01798c/ffffff?text=" +
            encodeURIComponent(iconText) +
            "'; this.alt='" +
            iconText +
            "';><div style='font-size: 0.9rem;'>" +
            maxTemp +
            "° / " +
            minTemp +
            "°C</div></div></div>";
        forecastCardsContainer.insertAdjacentHTML("beforeend", forecastCard);
        forecastCount++;
    }
}

function updateWeatherDetailsDisplay(oneCallData, timezoneOffsetSeconds) {
    if (!weatherDetailsGrid) return;
    weatherDetailsGrid.innerHTML = "";
    const current = oneCallData.current;
    const today = oneCallData.daily[0];
    const details = [
        { label: "Tekanan Udara", value: current.pressure + " hPa", type: "pressure" },
        { label: "Indeks UV", value: current.uvi, type: "uvi" },
        { label: "Titik Embun", value: current.dew_point.toFixed(1) + " °C", type: "dew_point" },
        { label: "Hembusan Angin", value: current.wind_gust ? (current.wind_gust * 3.6).toFixed(1) + " km/j" : "--", type: "wind_gust" },
        { label: "Terbit Matahari", value: new Date((today.sunrise + timezoneOffsetSeconds) * 1000).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }), type: "sunrise" },
        { label: "Terbenam Matahari", value: new Date((today.sunset + timezoneOffsetSeconds) * 1000).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }), type: "sunset" },
        { label: "Terbit Bulan", value: new Date((today.moonrise + timezoneOffsetSeconds) * 1000).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }), type: "moonrise" },
        { label: "Terbenam Bulan", value: new Date((today.moonset + timezoneOffsetSeconds) * 1000).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }), type: "moonset" },
        { label: "Fase Bulan", value: getMoonPhaseText(today.moon_phase), type: "moon_phase" },
        { label: "Peluang Presipitasi", value: (today.pop * 100).toFixed(0) + "%", type: "pop" },
        { label: "Volume Hujan", value: today.rain ? today.rain + " mm" : "0 mm", type: "rain" },
        { label: "Volume Salju", value: today.snow ? today.snow + " mm" : "0 mm", type: "snow" },
    ];
    details.forEach((detail) => {
        const col = document.createElement("div");
        col.className = "col";
        const card =
            "<div class='weather-detail-card'><img src='" +
            getDetailIconPath(detail.type) +
            "' alt='" +
            detail.label +
            "' class='detail-icon mx-auto' onerror='this.onerror=null; this.src='https://placehold.co/90x90/017082/ffffff?text=i'; this.alt='ikon " +
            detail.label +
            "'; /><div><div class='detail-label'>" +
            detail.label +
            "</div><div class='detail-value'>" +
            (detail.value !== undefined ? detail.value : "--") +
            "</div></div></div>";
        col.innerHTML = card;
        weatherDetailsGrid.appendChild(col);
    });
}

// --- Hero Banner Animation Logic ---
let animationFrameId = null; // To store the animation frame ID for cancellation

function drawHeroBannerAnimation(currentHour, weatherMain, currentTemperature, weatherDescriptionText, feelsLikeTemperature, humidityPercentage, windSpeedText, weatherIconImage, cloudsPercentage, cityName, countryName) {
    if (!heroBannerCtx) return;

    const width = heroBannerCanvas.width;
    const height = 720;

    // Clear canvas
    heroBannerCtx.clearRect(0, 0, width, height);

    // Define colors from the app's palette
    const color1 = "#00424c"; // Dark Teal
    const color2 = "#015f6e"; // Medium Teal
    const color3 = "#017082"; // Slightly lighter teal (from search card)
    const color4 = "#01798c"; // Lighter Teal (bg-4)
    const color5 = "#efb619"; // Gold/Yellow

    // Draw ground
    heroBannerCtx.fillStyle = color2; // Use a medium teal for the ground
    heroBannerCtx.fillRect(0, height * 0.75, width, height * 0.25); // Make ground slightly flatter

    // Draw hill (more subtle, using app colors)
    heroBannerCtx.beginPath();
    heroBannerCtx.arc(width / 2, height * 0.75, width * 0.6, 0, Math.PI, true);
    heroBannerCtx.closePath();
    heroBannerCtx.fillStyle = color3; // Use a slightly lighter teal for the hill
    heroBannerCtx.fill();

    // Determine time of day and sky color
    let skyColorTop, skyColorBottom;
    let isDay = true;
    if (currentHour >= 6 && currentHour < 12) {
        // Morning (Sunrise/Daybreak)
        skyColorTop = "#87CEEB"; // Light blue
        skyColorBottom = color4; // Lighter Teal
    } else if (currentHour >= 12 && currentHour < 18) {
        // Afternoon (Midday)
        skyColorTop = "#00BFFF"; // Deep sky blue
        skyColorBottom = color4; // Lighter Teal
    } else if (currentHour >= 18 && currentHour < 21) {
        // Evening (Sunset)
        skyColorTop = color5; // Gold
        skyColorBottom = color1; // Dark Teal
        isDay = false;
    } else {
        // Night
        skyColorTop = color1; // Dark Teal
        skyColorBottom = color2; // Medium Teal
        isDay = false;
    }

    // Draw sky gradient
    const skyGradient = heroBannerCtx.createLinearGradient(0, 0, 0, height * 0.75);
    skyGradient.addColorStop(0, skyColorTop);
    skyGradient.addColorStop(1, skyColorBottom);
    heroBannerCtx.fillStyle = skyGradient;
    heroBannerCtx.fillRect(0, 0, width, height * 0.75);

    // Draw sun/moon based on time of day
    if (isDay) {
        // Sun with a glow
        const sunX = width * 0.8;
        const sunY = height * 0.2;
        const sunRadius = 50;

        // Radial gradient for glow
        const sunGlow = heroBannerCtx.createRadialGradient(sunX, sunY, sunRadius * 0.8, sunX, sunY, sunRadius * 1.5);
        sunGlow.addColorStop(0, "rgba(255, 215, 0, 0.8)"); // Gold with opacity
        sunGlow.addColorStop(1, "rgba(255, 215, 0, 0)"); // Transparent gold
        heroBannerCtx.fillStyle = sunGlow;
        heroBannerCtx.beginPath();
        heroBannerCtx.arc(sunX, sunY, sunRadius * 1.5, 0, Math.PI * 2);
        heroBannerCtx.fill();

        // Solid sun disc
        heroBannerCtx.beginPath();
        heroBannerCtx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
        heroBannerCtx.fillStyle = color5; // Gold
        heroBannerCtx.fill();
    } else {
        // Moon with a subtle glow
        const moonX = width * 0.8;
        const moonY = height * 0.2;
        const moonRadius = 40;

        // Radial gradient for glow
        const moonGlow = heroBannerCtx.createRadialGradient(moonX, moonY, moonRadius * 0.8, moonX, moonY, moonRadius * 1.2);
        moonGlow.addColorStop(0, "rgba(240, 230, 140, 0.6)"); // Khaki with opacity
        moonGlow.addColorStop(1, "rgba(240, 230, 140, 0)"); // Transparent khaki
        heroBannerCtx.fillStyle = moonGlow;
        heroBannerCtx.beginPath();
        heroBannerCtx.arc(moonX, moonY, moonRadius * 1.2, 0, Math.PI * 2);
        heroBannerCtx.fill();

        // Solid moon disc
        heroBannerCtx.beginPath();
        heroBannerCtx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
        heroBannerCtx.fillStyle = "#F0E68C"; // Khaki
        heroBannerCtx.fill();

        // Crescent effect (draw a circle to "cut out" a crescent)
        heroBannerCtx.beginPath();
        heroBannerCtx.arc(moonX - 15, moonY - 15, moonRadius, 0, Math.PI * 2);
        heroBannerCtx.fillStyle = skyColorTop; // Match sky color to hide part of the moon
        heroBannerCtx.fill();

        // Stars
        if (stars.length === 0) {
            for (let i = 0; i < NUM_STARS; i++) {
                stars.push({
                    x: Math.random() * width,
                    y: Math.random() * height * 0.6,
                    radius: Math.random() * 1.5 + 0.5,
                    opacity: Math.random() * 0.5 + 0.5,
                    twinkleSpeed: Math.random() * 0.05 + 0.01,
                });
            }
        }
        stars.forEach((star) => {
            heroBannerCtx.beginPath();
            heroBannerCtx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            heroBannerCtx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
            heroBannerCtx.fill();
            star.opacity += star.twinkleSpeed;
            if (star.opacity > 1 || star.opacity < 0.5) {
                star.twinkleSpeed *= -1;
            }
        });
    }

    // Manage clouds based on cloud cover
    const targetNumClouds = Math.round((cloudsPercentage / 25) * BASE_NUM_CLOUDS); // Scale clouds based on percentage (0-100)
    if (clouds.length < targetNumClouds) {
        // Add new clouds if needed
        for (let i = clouds.length; i < targetNumClouds; i++) {
            clouds.push({
                x: Math.random() * width,
                y: Math.random() * height * 0.4,
                size: Math.random() * 0.5 + 0.5, // Scale factor for cloud size
                speed: (Math.random() * 0.5 + 0.2) * (Math.random() > 0.5 ? 1 : -1), // Random speed and direction
            });
        }
    } else if (clouds.length > targetNumClouds) {
        // Remove excess clouds
        clouds = clouds.slice(0, targetNumClouds);
    }

    // Draw and animate clouds
    clouds.forEach((cloud) => {
        let cloudColor = "rgba(240, 248, 255, 0.7)"; // Default light, semi-transparent
        if (weatherMain === "Rain" || weatherMain === "Drizzle" || weatherMain === "Thunderstorm") {
            cloudColor = "rgba(105, 105, 105, 0.9)"; // Darker, less transparent for rain
        } else if (weatherMain === "Fog" || weatherMain === "Mist" || weatherMain === "Haze") {
            cloudColor = "rgba(200, 200, 200, 0.8)"; // Gray, more opaque for fog
        } else if (weatherMain === "Clouds") {
            cloudColor = `rgba(240, 248, 255, ${0.4 + (cloudsPercentage / 100) * 0.5})`; // Opacity based on percentage
        } else if (isDay) {
            cloudColor = "rgba(240, 248, 255, 0.3)"; // Very light, transparent clouds
        }

        drawCloud(heroBannerCtx, cloud.x, cloud.y, cloudColor, cloud.size);
        cloud.x += cloud.speed;
        // Loop clouds around the canvas
        if (cloud.speed > 0 && cloud.x > width + 100) {
            cloud.x = -150;
            cloud.y = Math.random() * height * 0.4; // Randomize y for new entry
        } else if (cloud.speed < 0 && cloud.x < -150) {
            cloud.x = width + 100;
            cloud.y = Math.random() * height * 0.4; // Randomize y for new entry
        }
    });

    // Draw rain/thunderstorm effects
    if (weatherMain === "Rain" || weatherMain === "Drizzle" || weatherMain === "Thunderstorm") {
        if (raindrops.length === 0) {
            for (let i = 0; i < NUM_RAINDROPS; i++) {
                raindrops.push({
                    x: Math.random() * width,
                    y: Math.random() * height * 0.7,
                    length: Math.random() * 10 + 5,
                    speed: Math.random() * 5 + 3,
                });
            }
        }

        raindrops.forEach((drop) => {
            heroBannerCtx.beginPath();
            heroBannerCtx.moveTo(drop.x, drop.y);
            heroBannerCtx.lineTo(drop.x, drop.y + drop.length);
            heroBannerCtx.strokeStyle = "rgba(173, 216, 230, 0.8)"; // LightBlue with opacity
            heroBannerCtx.lineWidth = 2;
            heroBannerCtx.stroke();

            drop.y += drop.speed;
            if (drop.y > height * 0.7) {
                drop.y = -drop.length;
                drop.x = Math.random() * width;
            }
        });

        if (weatherMain === "Thunderstorm") {
            // Simple lightning effect
            if (Math.random() < 0.01) {
                // 1% chance per frame
                heroBannerCtx.beginPath();
                heroBannerCtx.moveTo(width * 0.4 + Math.random() * width * 0.2, 0);
                heroBannerCtx.lineTo(width * 0.4 + Math.random() * width * 0.2, height * 0.3);
                heroBannerCtx.lineTo(width * 0.4 + Math.random() * width * 0.2, height * 0.2);
                heroBannerCtx.lineTo(width * 0.5 + Math.random() * width * 0.1, height * 0.6);
                heroBannerCtx.strokeStyle = "#FFFF00"; // Yellow
                heroBannerCtx.lineWidth = 3;
                heroBannerCtx.stroke();
            }
        }
    } else {
        raindrops = []; // Clear raindrops if not raining
    }

    // Draw Weather Icon (top-left)
    if (weatherIconImage && weatherIconImage.complete) {
        const iconSize = 72;
        const iconX = width * 0.1;
        const iconY = height * 0.2;
        heroBannerCtx.drawImage(weatherIconImage, iconX, iconY, iconSize, iconSize);
    }

    // Draw Temperature (next to icon)
    if (currentTemperature !== undefined && currentTemperature !== null) {
        heroBannerCtx.fillStyle = "white";
        heroBannerCtx.font = "bold 48px Outfit";
        heroBannerCtx.textAlign = "left";
        heroBannerCtx.textBaseline = "middle";
        heroBannerCtx.shadowColor = "rgba(0, 0, 0, 0.5)"; // Add shadow for better readability
        heroBannerCtx.shadowBlur = 5;
        heroBannerCtx.shadowOffsetX = 2;
        heroBannerCtx.shadowOffsetY = 2;
        heroBannerCtx.fillText(`${currentTemperature.toFixed(1)}°C`, width * 0.1 + 80, height * 0.2 + 36); // Position next to icon
        heroBannerCtx.shadowColor = "transparent"; // Reset shadow
    }

    // Draw Weather Description (below temperature)
    if (weatherDescriptionText) {
        heroBannerCtx.fillStyle = "white";
        heroBannerCtx.font = "24px Outfit";
        heroBannerCtx.textAlign = "left";
        heroBannerCtx.textBaseline = "top";
        heroBannerCtx.shadowColor = "rgba(0, 0, 0, 0.5)";
        heroBannerCtx.shadowBlur = 5;
        heroBannerCtx.shadowOffsetX = 2;
        heroBannerCtx.shadowOffsetY = 2;
        heroBannerCtx.fillText(weatherDescriptionText, width * 0.1, height * 0.2 + 80); // Position below icon/temp
        heroBannerCtx.shadowColor = "transparent";
    }

    // Draw Feels Like Temperature (below description)
    if (feelsLikeTemperature) {
        heroBannerCtx.fillStyle = "white";
        heroBannerCtx.font = "18px Outfit";
        heroBannerCtx.textAlign = "left";
        heroBannerCtx.textBaseline = "top";
        heroBannerCtx.shadowColor = "rgba(0, 0, 0, 0.5)";
        heroBannerCtx.shadowBlur = 5;
        heroBannerCtx.shadowOffsetX = 2;
        heroBannerCtx.shadowOffsetY = 2;
        heroBannerCtx.fillText(`Terasa seperti ${feelsLikeTemperature}°`, width * 0.1, height * 0.2 + 120);
        heroBannerCtx.shadowColor = "transparent";
    }

    // Draw Humidity (below feels like)
    if (humidityPercentage) {
        heroBannerCtx.fillStyle = "white";
        heroBannerCtx.font = "18px Outfit";
        heroBannerCtx.textAlign = "left";
        heroBannerCtx.textBaseline = "top";
        heroBannerCtx.shadowColor = "rgba(0, 0, 0, 0.5)";
        heroBannerCtx.shadowBlur = 5;
        heroBannerCtx.shadowOffsetX = 2;
        heroBannerCtx.shadowOffsetY = 2;
        heroBannerCtx.fillText(`Kelembapan: ${humidityPercentage}`, width * 0.1, height * 0.2 + 150);
        heroBannerCtx.shadowColor = "transparent";
    }

    // Draw Wind Speed (below humidity)
    if (windSpeedText) {
        heroBannerCtx.fillStyle = "white";
        heroBannerCtx.font = "18px Outfit";
        heroBannerCtx.textAlign = "left";
        heroBannerCtx.textBaseline = "top";
        heroBannerCtx.shadowColor = "rgba(0, 0, 0, 0.5)";
        heroBannerCtx.shadowBlur = 5;
        heroBannerCtx.shadowOffsetX = 2;
        heroBannerCtx.shadowOffsetY = 2;
        heroBannerCtx.fillText(`Angin: ${windSpeedText}`, width * 0.1, height * 0.2 + 180);
        heroBannerCtx.shadowColor = "transparent";
    }

    // Draw City Name and Country (bottom left, adjusted for new layout)
    if (cityName && countryName) {
        heroBannerCtx.fillStyle = "white";
        heroBannerCtx.font = "bold 24px Outfit";
        heroBannerCtx.textAlign = "left"; // Align to left
        heroBannerCtx.textBaseline = "bottom";
        heroBannerCtx.shadowColor = "rgba(0, 0, 0, 0.5)";
        heroBannerCtx.shadowBlur = 5;
        heroBannerCtx.shadowOffsetX = 2;
        heroBannerCtx.shadowOffsetY = 2;
        heroBannerCtx.fillText(`${cityName}, ${countryName}`, width * 0.1, height - 20); // Position at bottom left with padding
        heroBannerCtx.shadowColor = "transparent";
    }

    // Request next animation frame
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId); // Cancel previous frame to prevent multiple loops
    }
    animationFrameId = requestAnimationFrame(() =>
        drawHeroBannerAnimation(currentHour, weatherMain, currentTemperature, weatherDescriptionText, feelsLikeTemperature, humidityPercentage, windSpeedText, weatherIconImage, cloudsPercentage, cityName, countryName)
    );
}

// Helper function to draw a cloud (more stylized)
function drawCloud(ctx, x, y, color, size = 1) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 25 * size, 0, Math.PI * 2);
    ctx.arc(x + 35 * size, y, 30 * size, 0, Math.PI * 2);
    ctx.arc(x + 70 * size, y, 28 * size, 0, Math.PI * 2);
    ctx.arc(x + 15 * size, y + 15 * size, 27 * size, 0, Math.PI * 2);
    ctx.arc(x + 55 * size, y + 15 * size, 32 * size, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
}

// --- API Fetching Logic ---
async function getGeoCoordinates(locationName) {
    const geoResponse = await fetch(GEO_BASE_URL + "?q=" + encodeURIComponent(locationName) + "&limit=1&appid=" + OPENWEATHER_API_KEY);
    if (!geoResponse.ok) throw new Error("Gagal geocoding (Status: " + geoResponse.status + ")");
    const geoDataArray = await geoResponse.json();
    if (geoDataArray.length === 0) throw new Error("Lokasi '" + locationName + "' tidak ditemukan.");
    const firstGeoData = geoDataArray[0];
    return { name: firstGeoData.name, country: firstGeoData.country, lat: firstGeoData.lat, lon: firstGeoData.lon };
}

async function getOpenWeatherData(lat, lon) {
    const oneCallResponse = await fetch(ONE_CALL_BASE_URL + "?lat=" + lat + "&lon=" + lon + "&appid=" + OPENWEATHER_API_KEY + "&units=metric&lang=id&exclude=minutely,alerts");
    if (!oneCallResponse.ok) throw new Error("Gagal mengambil data cuaca (Status: " + oneCallResponse.status + ")");
    return await oneCallResponse.json();
}

async function fetchWeather(locationNameToFetch, isManualSearch = false) {
    showLoading(true);
    errorMessage.style.display = "none";
    if (OPENWEATHER_API_KEY === "") {
        // Check if API key is truly empty
        displayMainError("Kunci API OpenWeatherMap belum dikonfigurasi. Silakan tambahkan kunci API Anda.");
        showLoading(false);
        return;
    }

    let geoDataToUse = null;
    let effectiveLocationName = locationNameToFetch;
    try {
        if (locationNameToFetch) {
            geoDataToUse = await getGeoCoordinates(locationNameToFetch);
            effectiveLocationName = geoDataToUse.name;
        } else if (lastSuccessfulGeoData) {
            geoDataToUse = lastSuccessfulGeoData;
            effectiveLocationName = geoDataToUse.name;
        } else {
            effectiveLocationName = DEFAULT_LOCATION;
            geoDataToUse = await getGeoCoordinates(effectiveLocationName);
        }
        const weatherData = await getOpenWeatherData(geoDataToUse.lat, geoDataToUse.lon);
        searchErrorMessage.style.display = "none";
        if (errorModalInstance) errorModalInstance.hide();
        updateCurrentWeatherDisplay(weatherData, geoDataToUse);
        updateForecastDisplay(weatherData);
        updateWeatherDetailsDisplay(weatherData, weatherData.timezone_offset);
        if (isManualSearch) {
            addRecentSearch(geoDataToUse.name);
            searchLocationInput.value = "";
        }
        lastSuccessfulGeoData = geoDataToUse;
        lastSuccessfulOneCallData = weatherData;
        renderRecentSearches();
    } catch (error) {
        console.error("Error fetching weather for '" + effectiveLocationName || "lokasi terakhir" + "':", error);
        const friendlyErrorMessage =
            error.message.includes("tidak ditemukan") || error.message.includes("Gagal geocoding") ? error.message : "Gagal memuat data untuk " + effectiveLocationName || "lokasi terakhir" + ". Periksa koneksi atau coba lagi.";
        if (isManualSearch) displaySearchError(friendlyErrorMessage, true);
        else displayMainError(friendlyErrorMessage);

        if (lastSuccessfulOneCallData && lastSuccessfulGeoData && !isManualSearch) {
            updateCurrentWeatherDisplay(lastSuccessfulOneCallData, lastSuccessfulGeoData);
            updateForecastDisplay(lastSuccessfulOneCallData);
            updateWeatherDetailsDisplay(lastSuccessfulOneCallData, lastSuccessfulOneCallData.timezone_offset);
            renderRecentSearches();
        } else if (!lastSuccessfulOneCallData && !lastSuccessfulGeoData) {
            clearWeatherDisplay();
            if (weatherDetailsGrid) weatherDetailsGrid.innerHTML = '<div class="col-12 text-center text-white-50">Data detail tidak tersedia.</div>';
        }
    } finally {
        showLoading(false);
    }
}

// --- Event Listeners ---
if (searchButton) {
    searchButton.addEventListener("click", () => {
        const location = searchLocationInput.value.trim();
        if (location) fetchWeather(location, true);
        else displaySearchError("Silakan masukkan nama lokasi.", false);
    });
}

if (searchLocationInput) {
    searchLocationInput.addEventListener("keyup", (event) => {
        if (event.key === "Enter") searchButton.click();
    });
}

if (temperatureChartCanvas) {
    temperatureChartCanvas.addEventListener("mousemove", (e) => {
        if (!chartDataPoints || chartDataPoints.length === 0) return;
        const rect = temperatureChartCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        let closestPoint = null;
        let minDist = Infinity;
        const hoverThreshold = 15; // pixels

        for (const point of chartDataPoints) {
            const dist = Math.sqrt(Math.pow(mouseX - point.x, 2) + Math.pow(mouseY - point.y, 2));
            if (dist < minDist && dist < hoverThreshold) {
                minDist = dist;
                closestPoint = point;
            }
        }

        if (closestPoint) {
            chartTooltip.style.display = "block";
            const localDate = new Date((closestPoint.timestamp + closestPoint.timezoneOffset) * 1000);
            const formattedDate = localDate.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
            chartTooltip.innerHTML = closestPoint.temp.toFixed(1) + "°C<br>" + formattedDate;
            let tooltipLeft = e.clientX - chartTooltip.offsetWidth / 2;
            let tooltipTop = e.clientY - chartTooltip.offsetHeight - 15;
            if (tooltipLeft < 5) tooltipLeft = 5;
            if (tooltipLeft + chartTooltip.offsetWidth > window.innerWidth - 5) tooltipLeft = window.innerWidth - chartTooltip.offsetWidth - 5;
            if (tooltipTop < 5) tooltipTop = e.clientY + 15;
            if (tooltipTop + chartTooltip.offsetHeight > window.innerHeight - 5) tooltipTop = window.innerHeight - chartTooltip.offsetHeight - 5;
            chartTooltip.style.left = tooltipLeft + "px";
            chartTooltip.style.top = tooltipTop + "px";
        } else {
            chartTooltip.style.display = "none";
        }
    });
    temperatureChartCanvas.addEventListener("mouseout", () => {
        chartTooltip.style.display = "none";
    });
}

if (contactForm) {
    contactForm.addEventListener("submit", function (event) {
        event.preventDefault();
        const fullName = document.getElementById("contactFullName").value;
        const email = document.getElementById("contactEmail").value;
        const subject = document.getElementById("contactSubject").value;
        const message = document.getElementById("contactMessage").value;
        if (fullName && email && subject && message) {
            if (errorModalInstance) {
                document.getElementById("errorModalLabel").textContent = "Pesan Terkirim!";
                document.getElementById("errorModalBody").textContent = "Terima kasih telah menghubungi kami. Pesan Anda telah berhasil dikirim.";
                errorModalInstance.show();
            }
            contactForm.reset();
        } else {
            if (errorModalInstance) {
                document.getElementById("errorModalLabel").textContent = "Form Tidak Lengkap";
                document.getElementById("errorModalBody").textContent = "Mohon lengkapi semua field yang wajib diisi.";
                errorModalInstance.show();
            }
        }
    });
}

// --- Initial Load and Interval ---
document.addEventListener("DOMContentLoaded", () => {
    renderRecentSearches();
    fetchWeather(DEFAULT_LOCATION, true); // Fetch for default on load

    if (weatherUpdateIntervalId) clearInterval(weatherUpdateIntervalId);
    weatherUpdateIntervalId = setInterval(() => {
        const locationToUpdate = lastSuccessfulGeoData ? lastSuccessfulGeoData.name : DEFAULT_LOCATION;
        fetchWeather(locationToUpdate, false); // Auto-refresh without treating as manual search
    }, 5 * 60 * 1000); // Refresh every 5 minutes

    window.addEventListener("resize", () => {
        // Resize hero banner canvas
        if (heroBannerCanvas) {
            const parentDiv = heroBannerCanvas.parentElement;
            heroBannerCanvas.width = parentDiv.offsetWidth;
            heroBannerCanvas.height = parentDiv.offsetHeight;
            // Redraw hero banner if data is available
            if (lastSuccessfulOneCallData) {
                const currentHour = new Date((lastSuccessfulOneCallData.current.dt + lastSuccessfulOneCallData.timezone_offset) * 1000).getUTCHours();
                const weatherMain = lastSuccessfulOneCallData.current.weather[0].main;
                const cloudsPercentage = lastSuccessfulOneCallData.current.clouds;
                drawHeroBannerAnimation(
                    currentHour,
                    weatherMain,
                    lastSuccessfulOneCallData.current.temp,
                    weatherDescription.textContent,
                    feelsLikeTemp.textContent,
                    humidityPercentage.textContent,
                    windSpeed.textContent,
                    loadedWeatherIcon,
                    cloudsPercentage,
                    lastSuccessfulGeoData.name,
                    lastSuccessfulGeoData.country
                );
            }
        }

        // Resize temperature chart
        if (lastSuccessfulOneCallData && temperatureChartCtx) {
            const chartDailyTemps = lastSuccessfulOneCallData.daily.slice(0, 7).map((day) => day.temp);
            const chartDailyTimestamps = lastSuccessfulOneCallData.daily.slice(0, 7).map((day) => day.dt);
            const timezoneOffset = lastSuccessfulOneCallData.timezone_offset;
            drawTemperatureChart(chartDailyTemps, chartDailyTimestamps, timezoneOffset);
        } else if (temperatureChartCtx) {
            drawTemperatureChart([], [], 0); // Draw empty chart if no data
        }
    });
});
