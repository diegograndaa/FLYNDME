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

async function fetchFlights(origin, destination, departureDate, token) {
    try {
        console.log(`📡 Buscando vuelos desde ${origin} a ${destination} en ${departureDate}...`);
        const response = await axios.get("https://test.api.amadeus.com/v1/shopping/flight-offers", {
            params: { 
                originLocationCode: origin,
                destinationLocationCode: destination,
                departureDate: departureDate,
                adults: 1,
                max: 1
            },
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.data.data || response.data.data.length === 0) {
            return null;
        }

        return {
            origin,
            destination,
            price: parseFloat(response.data.data[0].price.total),
            currency: response.data.data[0].price.currency
        };
    } catch (error) {
        console.error(`❌ Error obteniendo vuelos desde ${origin} a ${destination}:`, error.response?.data || error.message);
        return null;
    }
}

app.get("/api/flights", async (req, res) => {
    let { origins, departureDate, returnDate, nonStop } = req.query;
    
    if (!origins) return res.status(400).json({ error: "Debes proporcionar al menos un aeropuerto de origen." });

    const originList = origins.split(",");
    const token = await getAccessToken();

    if (!token) return res.status(500).json({ error: "No se pudo obtener el token de Amadeus" });

    let allFlights = [];

    for (let origin of originList) {
        const outboundFlights = await fetchFlights(origin, "ANY", departureDate, token);
        if (outboundFlights) allFlights.push(outboundFlights);
        
        if (returnDate) {
            const returnFlights = await fetchFlights("ANY", origin, returnDate, token);
            if (returnFlights) allFlights.push(returnFlights);
        }
    }

    let destinationMap = {};

    for (let flight of allFlights) {
        if (!flight) continue;
        
        if (!destinationMap[flight.destination]) {
            destinationMap[flight.destination] = {
                destination: flight.destination,
                flights: [],
                totalCostEUR: 0
            };
        }

        destinationMap[flight.destination].flights.push(flight);
    }

    let validDestinations = Object.values(destinationMap).filter(dest => {
        let uniqueOrigins = new Set(dest.flights.map(f => f.origin));
        return uniqueOrigins.size === originList.length;
    });

    let sortedDestinations = validDestinations.map(dest => {
        dest.totalCostEUR = dest.flights.reduce((sum, flight) => sum + flight.price, 0);
        dest.averageCostPerTraveler = (dest.totalCostEUR / originList.length).toFixed(2);
        return dest;
    }).sort((a, b) => a.totalCostEUR - b.totalCostEUR);

    res.json({
        flights: sortedDestinations
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));
