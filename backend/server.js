const express = require('express');
const cors = require('cors');
require('dotenv').config();
const axios = require("axios");

// Verificar si las credenciales de Amadeus están cargadas correctamente
console.log("🔍 API Key cargada:", process.env.AMADEUS_API_KEY);
console.log("🔍 API Secret cargada:", process.env.AMADEUS_API_SECRET ? "(Oculta)" : "No encontrada");

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send("✅ FlyndMe API funcionando correctamente!");
});

// Función para obtener el token de Amadeus
async function getAccessToken() {
    try {
        const response = await axios.post(
            'https://test.api.amadeus.com/v1/security/oauth2/token',
            new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: process.env.AMADEUS_API_KEY,
                client_secret: process.env.AMADEUS_API_SECRET
            }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        console.log("🔑 Token obtenido:", response.data.access_token);
        return response.data.access_token;
    } catch (error) {
        console.error("❌ Error obteniendo el token de Amadeus:", error.response?.data || error.message);
        return null;
    }
}

// Endpoint para obtener vuelos baratos desde un aeropuerto con fechas de ida y duración
app.get("/api/flights/:origin", async (req, res) => {
    const { origin } = req.params;
    let { departureDate, returnDate, nonStop } = req.query;
    const token = await getAccessToken();

    if (!token) return res.status(500).json({ error: "No se pudo obtener el token de Amadeus" });

    // Validar que las fechas están en formato YYYY-MM-DD
    const isValidDate = (date) => /^\d{4}-\d{2}-\d{2}$/.test(date);

    if (!departureDate || !isValidDate(departureDate)) {
        console.error("❌ ERROR: La fecha de salida no es válida:", departureDate);
        return res.status(400).json({ error: "La fecha de salida debe estar en formato YYYY-MM-DD", received: departureDate });
    }

    // Calcular duración si hay fecha de regreso
    let duration = returnDate ? Math.max(1, (new Date(returnDate) - new Date(departureDate)) / (1000 * 60 * 60 * 24)) : 3;

    console.log("📡 Enviando solicitud a Amadeus con estos parámetros:", {
        origin,
        departureDate,
        duration,
        nonStop: nonStop === "true" ? true : false
    });

    try {
        const response = await axios.get("https://test.api.amadeus.com/v1/shopping/flight-destinations", {
            params: { 
                origin,
                departureDate, 
                duration,  // Se envía duración en lugar de returnDate
                nonStop: nonStop === "true" ? true : false
            },
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log("✈️ Respuesta de Amadeus:", response.data);
        if (response.data.errors) {
            console.error("⚠️ Error en la respuesta de Amadeus:", response.data.errors);
            return res.status(500).json({ error: "No se pudieron obtener los vuelos", details: response.data.errors });
        }
        res.json(response.data);
    } catch (error) {
        console.error("❌ Error en la solicitud a Amadeus:", error.response?.data || error.message);
        res.status(500).json({ error: "Error en la solicitud a Amadeus", details: error.response?.data });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));
