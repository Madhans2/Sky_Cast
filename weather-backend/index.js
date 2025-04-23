import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(cors());

const API_KEY = "eb679d183a353aa2aa10174fb9d9e148"; // Your OpenWeatherMap API key

app.get("/weather", async (req, res) => {
  const { city, lat, lon } = req.query;

  // Validate query parameters
  if (!city && !(lat && lon)) {
    return res.status(400).json({ error: "City or coordinates (lat and lon) are required." });
  }

  try {
    let currentWeatherUrl;
    let forecastUrl;

    // Construct API URLs based on whether city or coordinates are provided
    if (city) {
      currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;
      forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`;
    } else {
      currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
      forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    }

    console.log("Current Weather URL:", currentWeatherUrl); // Debug log
    console.log("Forecast URL:", forecastUrl); // Debug log

    // Fetch current weather and forecast data in parallel
    const [currentRes, forecastRes] = await Promise.all([
      axios.get(currentWeatherUrl),
      axios.get(forecastUrl),
    ]);

    console.log("Current Weather Response:", currentRes.data); // Debug log
    console.log("Forecast Response:", forecastRes.data); // Debug log

    // Filter forecast: one result per day at 12:00 PM
    const forecast = forecastRes.data.list.filter(item =>
      item.dt_txt.includes("12:00:00")
    );

    res.json({
      current: currentRes.data,
      forecast,
    });
  } catch (error) {
    console.error("Weather API Error:", error.response?.data || error.message);
    res.status(500).json({ error: "City not found or API failed: " + (error.response?.data?.message || error.message) });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));