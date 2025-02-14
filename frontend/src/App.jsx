import { useState } from "react";

function App() {
  const [origins, setOrigins] = useState(["MAD", "LON", "FRA","BCN"]); // Aeropuertos de origen
  const [departureDate, setDepartureDate] = useState(""); // Fecha de ida
  const [returnDate, setReturnDate] = useState(""); // Fecha de vuelta
  const [directFlight, setDirectFlight] = useState(false); // Filtro de vuelos directos
  const [flights, setFlights] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFlights = async () => {
    setLoading(true);
    setError(null);
    setFlights({});

    try {
      const response = await fetch(
        `http://localhost:5000/api/flights?origins=${origins.join(",")}&departureDate=${departureDate}&returnDate=${returnDate}&nonStop=${directFlight}`
      );
      const data = await response.json();

      if (!data.flights || data.flights.length === 0) {
        setFlights({});
        return;
      }

      // Agrupar vuelos por destino
      let groupedFlights = {};
      data.flights.forEach((flight) => {
        const { destination, origin } = flight;
        if (!groupedFlights[destination]) {
          groupedFlights[destination] = [];
        }
        groupedFlights[destination].push(flight);
      });

      setFlights(groupedFlights);
    } catch (err) {
      setError("Error conectando con el backend");
    }

    setLoading(false);
  };

  const addOrigin = () => setOrigins([...origins, ""]); // Añadir un nuevo campo vacío

  const removeOrigin = (index) => {
    if (origins.length > 1) {
      setOrigins(origins.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-10">
      <h1 className="text-4xl font-bold">FlyndMe - Encuentra el destino más barato</h1>

      <div className="mt-5 bg-gray-800 p-6 rounded-lg w-full max-w-3xl shadow-lg">
        <h2 className="text-xl font-semibold mb-3">Aeropuertos de origen</h2>
        <div className="flex flex-wrap gap-2">
          {origins.map((origin, index) => (
            <div key={index} className="flex gap-2 items-center">
              <input
                type="text"
                value={origin}
                onChange={(e) => {
                  const newOrigins = [...origins];
                  newOrigins[index] = e.target.value.toUpperCase();
                  setOrigins(newOrigins);
                }}
                className="p-3 border border-gray-500 rounded bg-gray-700 text-white w-24"
                placeholder="IATA"
              />
              <button 
                onClick={() => removeOrigin(index)} 
                className="p-2 bg-red-500 text-white rounded-lg"
              >
                ✖
              </button>
            </div>
          ))}
          <button 
            onClick={addOrigin} 
            className="p-3 bg-blue-500 text-white rounded-lg"
          >
            + Añadir Origen
          </button>
        </div>

        <div className="mt-5">
          <label className="block text-lg">Fecha de ida:</label>
          <input 
            type="date" 
            value={departureDate} 
            onChange={(e) => setDepartureDate(e.target.value)} 
            className="p-3 border border-gray-500 rounded bg-gray-700 text-white w-full"
          />
        </div>

        <div className="mt-3">
          <label className="block text-lg">Fecha de vuelta:</label>
          <input 
            type="date" 
            value={returnDate} 
            onChange={(e) => setReturnDate(e.target.value)} 
            className="p-3 border border-gray-500 rounded bg-gray-700 text-white w-full"
          />
        </div>

        <div className="mt-3 flex items-center gap-2">
          <input 
            type="checkbox" 
            checked={directFlight} 
            onChange={() => setDirectFlight(!directFlight)} 
            className="w-5 h-5"
          />
          <label className="text-lg">Solo vuelos directos</label>
        </div>

        <button 
          onClick={fetchFlights} 
          className="mt-5 w-full bg-green-600 hover:bg-green-700 p-3 rounded-lg text-lg transition-all"
        >
          🔍 Buscar Destino Más Barato
        </button>
      </div>

      {loading && <p className="mt-5 text-yellow-400">🔄 Buscando vuelos...</p>}
      {error && <p className="mt-5 text-red-500">❌ {error}</p>}

      <div className="mt-5 w-full max-w-3xl">
        {Object.keys(flights).length > 0 ? (
          <div className="bg-gray-800 p-5 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-3">✈️ Destinos Más Baratos</h2>
            {Object.entries(flights).map(([destination, flightList]) => (
              <div key={destination} className="mt-4 p-3 border-b border-gray-600">
                <h3 className="text-lg font-bold">🌍 {destination}</h3>
                <ul>
                  {flightList.map((flight, index) => (
                    <li key={index} className="mt-2">
                      Desde <strong>{flight.origin}</strong>: 
                      <span className="text-green-400 font-semibold"> {flight.price} {flight.currency}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          !loading && !error && <p className="text-gray-400">No hay vuelos disponibles</p>
        )}
      </div>
    </div>
  );
}

export default App;
