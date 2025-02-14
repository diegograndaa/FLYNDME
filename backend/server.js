const express = require('express');
const cors = require('cors');
require('dotenv').config();
const axios = require("axios");

console.log("🔍 API Key cargada:", process.env.AMADEUS_API_KEY);
console.log("🔍 API Secret cargada:", process.env.AMADEUS_API_SECRET ? "(Oculta)" : "No encontrada");

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send("✅ FlyndMe API funcionando correctamente!");
});

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
        return response.data.access_token;
    } catch (error) {
        console.error("❌ Error obteniendo el token de Amadeus:", error.response?.data || error.message);
        return null;
    }
}

// Función para realizar solicitudes con reintento y espera en caso de error 429
async function fetchFlightsWithRetry(origin, departureDate, duration, nonStop, token, retries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`📡 Intento ${attempt}: Buscando vuelos desde ${origin}...`);

            const response = await axios.get("https://test.api.amadeus.com/v1/shopping/flight-destinations", {
                params: { 
                    origin,
                    departureDate, 
                    duration,
                    nonStop: nonStop === "true" ? true : false
                },
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.errors) {
                console.error(`⚠️ Error en la respuesta de Amadeus para ${origin}:`, response.data.errors);
                return [];
            }

            return response.data.data.map(flight => ({
                origin,
                destination: flight.destination,
                departureDate: flight.departureDate,
                returnDate: flight.returnDate || null,
                price: flight.price.total,
                currency: response.data.meta.currency
            }));

        } catch (error) {
            if (error.response?.status === 429 && attempt < retries) {
                console.warn(`⚠️ Límite de solicitudes excedido para ${origin}. Reintentando en ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay)); // Espera antes de reintentar
                delay *= 2; // Incremento exponencial del tiempo de espera
            } else {
                console.error(`❌ Error obteniendo vuelos desde ${origin}:`, error.response?.data || error.message);
                return [];
            }
        }
    }
    return [];
}

// Endpoint para obtener vuelos desde múltiples aeropuertos con reintentos
app.get("/api/flights", async (req, res) => {
    let { origins, departureDate, returnDate, nonStop } = req.query;
    
    if (!origins) return res.status(400).json({ error: "Debes proporcionar al menos un aeropuerto de origen." });

    const originList = origins.split(","); // Convertimos los aeropuertos en una lista
    const token = await getAccessToken();

    if (!token) return res.status(500).json({ error: "No se pudo obtener el token de Amadeus" });

    const isValidDate = (date) => /^\d{4}-\d{2}-\d{2}$/.test(date);
    if (!departureDate || !isValidDate(departureDate)) {
        return res.status(400).json({ error: "La fecha de salida debe estar en formato YYYY-MM-DD", received: departureDate });
    }

    let duration = returnDate ? Math.max(1, (new Date(returnDate) - new Date(departureDate)) / (1000 * 60 * 60 * 24)) : 3;
    
    let allFlights = [];

    for (let origin of originList) {
        const flights = await fetchFlightsWithRetry(origin, departureDate, duration, nonStop, token);
        allFlights = allFlights.concat(flights);
    }

    res.json({ flights: allFlights });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));
