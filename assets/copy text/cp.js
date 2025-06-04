"https://openweathermap.org/img/wn/" + iconCode + "@2x.png"; // 1
const forecastCard =
    "<div class='col'><div class='bg-3 rounded-2 p-3 text-center h-100 d-flex flex-column justify-content-between'><div class='fw-semibold' style='font-size: 0.95rem;'>" +
    displayDay +
    "</div><img src='" +
    iconUrl +
    "' width='120px' alt='" +
    iconText +
    "' class='mx-auto' onerror='this.onerror=null; this.src=" +
    "https://placehold.co/120x120/01798c/ffffff?text=" +
    encodeURIComponent(iconText) +
    "'; this.alt='" +
    iconText +
    "';><div style='font-size: 0.9rem;'>" +
    maxTemp +
    "° / " +
    minTemp +
    "°C</div></div></div>";
currentLocationDisplay.textContent = dataGeografis.name + ", " + dataGeografis.country; // 3
weatherSummary.textContent = "Langit diperkirakan " + current.weather[0].description + ". Suhu tertinggi akan mencapai " + todayForecast.temp.max.toFixed(1) + "°C."; //4
weatherSummary.textContent = "Langit diperkirakan " + current.weather[0].description + "."; //5
windSpeed.innerHTML = (current.wind_speed * 3.6).toFixed(1) + " <span>km/jam</span>"; // 6
humidityPercentage.textContent = current.humidity + "%"; //7
visibilityDistance.textContent = (current.visibility / 1000).toFixed(1) + " KM"; //8
cloudCover.textContent = current.clouds + "%"; // 9
temperatureChartCtx.fillText(tempValue.toFixed(0) + "°C", padding - 8, y); //10
const details = [
    { label: "Tekanan Udara", value: current.pressure + " hPa", type: "pressure" }, //11
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
const card =
    "<div class='weather-detail-card'><img src='" +
        getDetailIconPath(detail.type) +
        "' alt='" +
        detail.label +
        "' class='detail-icon mx-auto' onerror='this.onerror=null; this.src='https://placehold.co/90x90/017082/ffffff?text=i'; this.alt='ikon " +
        detail.label +
        "';' /><div><div class='detail-label'>" +
        detail.label +
        "</div><div class='detail-value'>" +
        detail.value !==
    undefined
        ? detail.value
        : "--" + "</div></div></div>";

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
console.error("Error fetching weather for '" + effectiveLocationName || "lokasi terakhir" + "':", error);
const friendlyErrorMessage =
    error.message.includes("tidak ditemukan") || error.message.includes("Gagal geocoding") ? error.message : "Gagal memuat data untuk " + effectiveLocationName || "lokasi terakhir" + ". Periksa koneksi atau coba lagi.";
chartTooltip.innerHTML = closestPoint.temp.toFixed(1) + "°C<br>" + formattedDate;
chartTooltip.style.left = tooltipLeft + "px";
chartTooltip.style.top = tooltipTop + "px";
if (mapPlaceholder) {
    mapPlaceholder.textContent = "PETA CUACA UNTUK PUKUL " + selectedTime;
}
console.log("Waktu peta diubah menjadi: " + selectedTime);
if (mapPlaceholder) {
    mapPlaceholder.textContent = "PETA CUACA UNTUK PUKUL " + timeLabels[mapTimeSlider.value];
}
