import { useState } from "react";
import { motion } from "framer-motion";
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const [origins, setOrigins] = useState(["MAD", "LON", "FRA"]);
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [directFlight, setDirectFlight] = useState(false);
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState(null);

  const fetchFlights = async () => {
    setLoading(true);
    setError(null);
    setFlights([]);
    setSelectedDestination(null);

    try {
      const response = await fetch(
        `http://localhost:5000/api/flights?origins=${origins.join(",")}&departureDate=${departureDate}&returnDate=${returnDate}&nonStop=${directFlight}`
      );
      const data = await response.json();

      if (!data.flights || data.flights.length === 0) {
        setFlights([]);
        return;
      }

      // Ordenar por precio total de menor a mayor
      const sortedFlights = data.flights.sort((a, b) => a.totalCostEUR - b.totalCostEUR);
      setFlights(sortedFlights);
    } catch (err) {
      setError("Error conectando con el backend");
    }

    setLoading(false);
  };

  const addOrigin = () => setOrigins([...origins, ""]);

  const removeOrigin = (index) => {
    if (origins.length > 1) {
      setOrigins(origins.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="container-fluid min-vh-100 bg-light text-dark d-flex align-items-center justify-content-center">
      <div className="container bg-white p-5 rounded shadow-lg position-relative" style={{ maxWidth: '1000px' }}>
        <motion.h1
          className="text-center mb-4 fw-bold text-primary"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          FlyndMe - Encuentra tu Mejor Destino ✈️
        </motion.h1>

        <div className="row">
          <div className="col-md-10 mx-auto bg-light p-4 rounded shadow-sm">
            <h2 className="mb-3 text-dark">Aeropuertos de Origen</h2>
            {origins.map((origin, index) => (
              <div key={index} className="input-group mb-2">
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => {
                    const newOrigins = [...origins];
                    newOrigins[index] = e.target.value.toUpperCase();
                    setOrigins(newOrigins);
                  }}
                  className="form-control text-center"
                  placeholder="Código IATA"
                />
                <button className="btn btn-outline-danger" onClick={() => removeOrigin(index)}>✖</button>
              </div>
            ))}
            <button className="btn btn-outline-primary w-100 mt-2" onClick={addOrigin}>+ Añadir Origen</button>
          </div>
        </div>

        <div className="row mt-4">
          <div className="col-md-6">
            <label className="form-label">Fecha de ida:</label>
            <input type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} className="form-control" />
          </div>
          <div className="col-md-6">
            <label className="form-label">Fecha de vuelta:</label>
            <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className="form-control" />
          </div>
        </div>

        <div className="form-check mt-3">
          <input type="checkbox" checked={directFlight} onChange={() => setDirectFlight(!directFlight)} className="form-check-input" />
          <label className="form-check-label">Solo vuelos directos</label>
        </div>

        <button className="btn btn-primary w-100 mt-4" onClick={fetchFlights}>🔍 Buscar Destino Más Barato</button>

        {loading && <p className="mt-3 text-warning text-center fs-5">🔄 Buscando vuelos...</p>}
        {error && <p className="mt-3 text-danger text-center fs-5">❌ {error}</p>}

        {flights.length > 0 && (
          <div className="mt-5">
            <h2 className="text-center text-success">📊 Ranking de Destinos</h2>
            <div className="row justify-content-center">
              {flights.map((destination, index) => (
                <div key={index} className={`col-md-4 mb-3 ${index === 0 ? 'border border-danger p-2 rounded shadow-lg bg-light' : ''}`} onClick={() => setSelectedDestination(destination)}>
                  <div className="card shadow-sm border-0 h-100">
                    <div className="card-body text-center d-flex flex-column justify-content-center">
                      <h3 className={`card-title ${index === 0 ? 'text-danger fw-bold' : 'text-primary'}`}>{index + 1}. 🌍 {destination.destination}</h3>
                      <p className="text-muted fs-5">💰 <strong>TOTAL: {destination.totalCostEUR.toFixed(2)} EUR</strong></p>
                      <p className="text-muted fs-6">💳 <strong>PPP: {destination.averageCostPerTraveler} EUR</strong></p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedDestination && (
          <motion.div 
            className="position-fixed top-50 start-50 translate-middle bg-white p-4 border rounded shadow-lg"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <h3 className="text-center text-primary">✈️ Desglose de Precios para {selectedDestination.destination}</h3>
            <ul className="list-group mt-3">
              {selectedDestination.flights.map((flight, idx) => (
                <li key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                  Desde {flight.origin} - {selectedDestination.destination} <strong>{flight.priceEUR.toFixed(2)} EUR</strong>
                </li>
              ))}
            </ul>
            <button className="btn btn-danger w-100 mt-3" onClick={() => setSelectedDestination(null)}>Cerrar</button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default App;
