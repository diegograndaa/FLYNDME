const express = require('express');
const cors = require('cors');
require('dotenv').config();
const axios = require("axios");

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

        console.log("🔑 Token obtenido:", response.data.access_token); // Log para verificar el token
        return response.data.access_token;
    } catch (error) {
        console.error("❌ Error obteniendo el token de Amadeus:", error.response?.data || error.message);
        return null;
    }
}

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send("✅ FlyndMe API funcionando correctamente!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));

app.get("/api/flights/:origin", async (req, res) => {
    const { origin } = req.params;
    const token = await getAccessToken();

    if (!token) return res.status(500).json({ error: "No se pudo obtener el token de Amadeus" });

    try {
        const response = await axios.get("https://test.api.amadeus.com/v1/shopping/flight-destinations", {
            params: { origin },
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log("✈️ Respuesta de Amadeus:", response.data); // Log para verificar la respuesta de Amadeus
        res.json(response.data);
    } catch (error) {
        console.error("❌ Error obteniendo vuelos:", error.response?.data || error.message);
        res.status(500).json({ error: "No se pudieron obtener los vuelos" });
    }
});
 
