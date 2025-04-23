import { useState, useEffect } from "react";
import axios from "axios";
import cloudy from "./assets/cloudy.gif";
import rainy from "./assets/rainy.gif";
import thunder from "./assets/thunder.gif";
import snow from "./assets/snow.gif";
import mist from "./assets/mist.gif";
import fog from "./assets/fog.gif";
import uv from "./assets/uv.png";

function App() {
  const [city, setCity] = useState("Chennai"); // Default to Chennai, changeable
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState("");
  const [unit, setUnit] = useState("F"); // Default to Fahrenheit
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode

  useEffect(() => {
    // Update current date and time every second and fetch weather on mount
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    fetchWeather(); // Fetch weather on initial load
    return () => clearInterval(timer);
  }, []);

  const fetchWeather = async (lat, lon) => {
    try {
      let url = `http://localhost:5000/weather?city=${city}`;
      if (lat && lon) {
        url = `http://localhost:5000/weather?lat=${lat}&lon=${lon}`;
      }
      console.log("Fetching weather with URL:", url); // Debug log
      const res = await axios.get(url);
      console.log("Weather API Response:", res.data); // Debug log
      setWeather(res.data);
      setError("");
    } catch (err) {
      console.error("Weather Fetch Error:", err.response?.data || err.message);
      setError(err.response?.data?.error || "City not found or API failed.");
      setWeather(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (city.trim()) {
      fetchWeather();
    }
  };

  // Fetch user's location and weather
  const fetchLocationWeather = async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { latitude, longitude } = position.coords;
      console.log("User Coordinates:", { latitude, longitude }); // Debug log

      // Reverse geocode to get city name using OpenWeatherMap's reverse geocoding API
      try {
        const geoRes = await axios.get(
          `http://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${process.env.REACT_APP_OPENWEATHERMAP_API_KEY}`
        );
        console.log("Reverse Geocoding Response:", geoRes.data); // Debug log
        if (geoRes.data && geoRes.data.length > 0) {
          const cityName = geoRes.data[0].name;
          setCity(cityName); // Update the search bar with the city name
          setError("");
          await fetchWeather(); // Fetch weather for the detected city
        } else {
          setError("Could not determine city from location. Using coordinates instead.");
          setCity("Unknown Location"); // Update search bar with a placeholder
          await fetchWeather(latitude, longitude); // Fallback to coordinates
        }
      } catch (err) {
        console.error("Reverse Geocoding Error:", err.response?.data || err.message);
        // setError("Failed to fetch city from location. Using coordinates instead.");
        setCity("Unknown Location"); // Update search bar with a placeholder
        await fetchWeather(latitude, longitude); // Fallback to coordinates
      }
    } catch (err) {
      console.error("Geolocation Error:", err.message);
      setError("Unable to retrieve your location. Please allow location access.");
    }
  };

  // Convert Celsius to Fahrenheit or return Celsius based on unit
  const getTemperature = (celsius) => {
    return unit === "F"
      ? Math.round((celsius * 9) / 5 + 32)
      : Math.round(celsius);
  };

  const handleUnitChange = (newUnit) => {
    setUnit(newUnit);
  };

  // Map weather conditions to GIFs
  const getWeatherEmoji = (condition) => {
    const weatherMap = {
      Clear: "https://cdn.pixabay.com/animation/2024/10/31/17/30/17-30-40-673_512.gif",
      Clouds: cloudy,
      Rain: rainy,
      Drizzle: rainy,
      Thunderstorm: thunder,
      Snow: snow,
      Mist: mist,
      Fog: fog,
      default: "https://cdn.pixabay.com/animation/2024/10/31/17/30/17-30-40-673_512.gif",
    };
    const normalizedCondition = condition
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    // If current time is after 6 PM IST (evening), check noon forecast for dominant condition
    const currentHourIST = new Date().getUTCHours() + 5 + 30 / 60; // IST is UTC+5:30
    if (currentHourIST >= 18 && weather && weather.forecast.length > 0) {
      const noonCondition = weather.forecast[0].weather[0].main;
      const normalizedNoonCondition = noonCondition
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      if (normalizedNoonCondition === "Clear") return weatherMap.Clear;
    }
    return weatherMap[normalizedCondition] || weatherMap.default;
  };

  // Format date and time
  const formatDateTime = (date) => {
    return date.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZoneName: "short",
    });
  };

  // Toggle theme
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={`min-h-screen p-2 sm:p-4 font-sans ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"}`}>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-2 sm:mb-4">
        <div className="w-full sm:w-auto mb-2 sm:mb-0">
          <div className="w-full">
            <h1 className="text-3xl font-bold justify-center text-center">SKY CAST</h1>
          </div>
        </div>
        <div className="flex space-x-1 sm:space-x-2">
          <button
            onClick={fetchLocationWeather}
            className={`px-2 sm:px-3 py-1 ${isDarkMode ? "bg-gray-700" : "bg-gray-300"} rounded-lg text-sm sm:text-base flex items-center`}
          >
            <span className="mr-1">📍</span>
          </button>
          <button
            onClick={() => handleUnitChange("C")}
            className={`px-2 sm:px-3 py-1 ${unit === "C" ? "bg-blue-600" : isDarkMode ? "bg-gray-700" : "bg-gray-300"} rounded-lg text-sm sm:text-base`}
          >
            °C
          </button>
          <button
            onClick={() => handleUnitChange("F")}
            className={`px-2 sm:px-3 py-1 ${unit === "F" ? "bg-blue-600" : isDarkMode ? "bg-gray-700" : "bg-gray-300"} rounded-lg text-sm sm:text-base`}
          >
            °F
          </button>
          <button
            onClick={toggleTheme}
            className={`px-2 py-1 ${isDarkMode ? "border-yellow-400 text-yellow-400" : "border-blue-400 text-blue-400"} rounded text-sm sm:text-base hover:underline`}
          >
            {isDarkMode ? "☀️" : "🌙"}
          </button>
          <button className="text-sm sm:text-base">⚙️</button>
        </div>
      </div>

      {error && <p className={`mb-2 sm:mb-4 ${isDarkMode ? "text-red-500" : "text-red-700"} text-sm sm:text-base`}>{error}</p>}

      {weather && (
        <>
          {/* Two-column layout */}
          <div className="flex flex-col lg:flex-row justify-between">
            {/* Left Column: Current Weather */}
            <div className={`w-full lg:w-1/3 mb-4 lg:mb-0 ${isDarkMode ? "bg-gray-700" : "bg-gray-300"} p-2 sm:p-4 rounded-lg mr-2 sm:mr-6`}>
              <form onSubmit={handleSubmit} className="flex items-center mb-2 sm:mb-4">
                <input
                  type="text"
                  placeholder="Search for place"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={`px-2 sm:px-4 py-1 sm:py-2 ${isDarkMode ? "bg-gray-800" : "bg-gray-200"} rounded-3xl w-full sm:w-96 focus:outline-none text-sm sm:text-base`}
                />
                <button
                  type="submit"
                  className="px-2 sm:px-6 py-1 sm:py-2 ml-2 sm:ml-6 bg-blue-600 rounded-3xl hover:bg-blue-700 text-sm sm:text-base"
                >
                  Search
                </button>
              </form>

              <div className="text-2xl sm:text-6xl mb-1 sm:mb-2 flex items-center ml-2 sm:ml-4">
                <img
                  src={getWeatherEmoji(weather.current.weather[0].main)}
                  alt={weather.current.weather[0].main}
                  className="w-16 sm:w-48 h-16 sm:h-48 mr-1 sm:mr-2"
                />
                {getTemperature(weather.current.main.temp)}°{unit}
              </div>
              <div className="flex items-center mb-1 sm:mb-2 ml-2 sm:ml-4">
                <div>
                  <div className="text-xl sm:text-4xl font-bold mt-2 sm:mt-6 mb-1">{weather.current.name}</div>
                  <div className="border-b-2 border-white pb-1 sm:pb-2"></div>
                  <div className="mt-2 sm:mt-6 text-sm sm:text-xl">
                    {formatDateTime(
                      new Date(weather.current.dt * 1000)
                    )}
                  </div>
                </div>
              </div>
              <div className={`text-${isDarkMode ? "gray-400" : "gray-600"} ml-2 sm:ml-4 mt-1 sm:mt-5 text-sm sm:text-base`}>
                {weather.current.weather[0].main} Day
              </div>
            </div>

            {/* Right Column: Vertical Stack of 6-Day Forecast, Today's Highlights, Additional Weather Details */}
            <div className={`w-full lg:w-2/3 ${isDarkMode ? "bg-gray-800" : "bg-white"} p-2 sm:p-4 rounded-lg`}>
              {/* 6-Day Forecast (Top) */}
              <div className="mb-2 sm:mb-6 mt-2 sm:mt-4">
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 sm:gap-4">
                  {weather.forecast.map((item, index) => {
                    const day = new Date(item.dt_txt).toLocaleDateString(undefined, {
                      weekday: "short",
                    });

                    return (
                      <div
                        key={index}
                        className={`text-center ${isDarkMode ? "bg-gray-700" : "bg-gray-100"} p-1 sm:p-2 rounded-lg py-4 sm:py-16 transform transition duration-300 hover:translate-y-1 sm:hover:translate-y-4 text-xs sm:text-sm`}
                      >
                        <div className="text-xs sm:text-sm">{day}</div>
                        <div className="text-lg sm:text-2xl">
                          <img
                            src={getWeatherEmoji(item.weather[0].main)}
                            alt={item.weather[0].main}
                            className="w-8 sm:w-12 h-8 sm:h-12 mx-auto"
                          />
                        </div>
                        <div className="text-xs sm:text-base">
                          {getTemperature(item.main.temp)}°{unit}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Today's Highlights (Middle) */}
              <h2 className="text-lg sm:text-xl font-semibold mt-2 sm:mt-6 mb-2 sm:mb-4">Today's Highlights</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-6">
                <div className={`bg-${isDarkMode ? "gray-700" : "gray-200"} p-2 sm:p-4 rounded-lg text-center`}>
                  <h3 className="text-sm sm:text-md mb-1 sm:mb-2">UV Index</h3>
                  <img src={uv} alt="" className="h-12 sm:h-16 ml-12 sm:ml-24" />
                  <div className="text-lg sm:text-2xl flex items-center justify-center">
                    <span>UV</span>
                    <span className="ml-1">5</span>
                  </div>
                  <div className="flex justify-center mt-1 sm:mt-2">
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                      <span
                        key={i}
                        className={`w-1 sm:w-2 h-1 sm:h-2 ${isDarkMode ? "gray-400" : "gray-600"} rounded-full mx-0.5 sm:mx-1`}
                      ></span>
                    ))}
                  </div>
                </div>
                <div className={`bg-${isDarkMode ? "gray-700" : "gray-200"} p-2 sm:p-4 rounded-lg text-center`}>
                  <h3 className="text-sm sm:text-md mb-1 sm:mb-2">Wind Status</h3>
                  <div className="text-xl sm:text-4xl mt-2 sm:mt-8">{weather.current.wind.speed} km/h</div>
                </div>
                <div className={`bg-${isDarkMode ? "gray-700" : "gray-200"} p-2 sm:p-4 rounded-lg text-center`}>
                  <h3 className="text-sm sm:text-md mb-1 sm:mb-2">Sunrise & Sunset</h3>
                  <div className="text-lg sm:text-2xl mt-2 sm:mt-6">
                    ☀️ {new Date(weather.current.sys.sunrise * 1000).toLocaleTimeString()}
                  </div>
                  <div className="text-lg sm:text-2xl">
                    🌙 {new Date(weather.current.sys.sunset * 1000).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {/* Additional Weather Details (Bottom) */}
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-6 mt-2 sm:mt-6">
                  <div className={`bg-${isDarkMode ? "gray-700" : "gray-200"} p-2 sm:p-4 rounded-lg text-center`}>
                    <h3 className="text-sm sm:text-md mb-1 sm:mb-2">Humidity</h3>
                    <div className="text-xl sm:text-4xl mt-2 sm:mt-6">{weather.current.main.humidity}%</div>
                    <div className={`text-${isDarkMode ? "gray-400" : "gray-600"} mt-1 sm:mt-4 text-sm sm:text-base`}>
                      📶 {weather.current.main.humidity ? "" : "No data"}
                    </div>
                  </div>
                  <div className={`bg-${isDarkMode ? "gray-700" : "gray-200"} p-2 sm:p-4 rounded-lg text-center`}>
                    <h3 className="text-sm sm:text-md mb-1 sm:mb-2">Visibility</h3>
                    <div className="text-xl sm:text-4xl mt-2 sm:mt-6">5.2 km</div> {/* Mocked, replace with API data */}
                    <div className={`text-${isDarkMode ? "gray-400" : "gray-600"} mt-1 sm:mt-4 text-sm sm:text-base`}>📶 No data</div>
                  </div>
                  <div className={`bg-${isDarkMode ? "gray-700" : "gray-200"} p-2 sm:p-4 rounded-lg text-center`}>
                    <h3 className="text-sm sm:text-md mb-1 sm:mb-2">Air Quality</h3>
                    <div className="text-xl sm:text-4xl mt-2 sm:mt-6">105</div> {/* Mocked, replace with API data */}
                    <div className={`text-${isDarkMode ? "gray-400" : "gray-600"} mt-1 sm:mt-4 text-sm sm:text-base`}>📶 No data</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;