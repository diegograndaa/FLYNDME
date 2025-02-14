import { useState } from "react";

function App() {
  const [origins, setOrigins] = useState(["MAD", "JFK"]); // Ejemplo inicial: Madrid y Nueva York
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFlights = async () => {
    setLoading(true);
    setError(null);
    setFlights([]);

    try {
      const results = await Promise.all(
        origins.map(async (origin) => {
          const response = await fetch(`http://localhost:5000/api/flights/${origin}`);
          return response.json();
        })
      );

      let destinations = {};
      results.forEach((data, index) => {
        if (data.data) {
          data.data.forEach((flight) => {
            if (!destinations[flight.destination] || parseFloat(flight.price.total) < parseFloat(destinations[flight.destination].price.total)) {
              destinations[flight.destination] = { ...flight, origin: origins[index] };
            }
          });
        }
      });

      setFlights(Object.values(destinations));
    } catch (err) {
      setError("Error conectando con el backend");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-10">
      <h1 className="text-4xl font-bold">FlyndMe - Encuentra el destino más barato</h1>

      <div className="mt-5 bg-gray-800 p-6 rounded-lg w-full max-w-3xl shadow-lg">
        <h2 className="text-xl font-semibold mb-3">Aeropuertos de origen</h2>
        <div className="flex flex-wrap gap-2">
          {origins.map((origin, index) => (
            <input
              key={index}
              type="text"
              value={origin}
              onChange={(e) => {
                const newOrigins = [...origins];
                newOrigins[index] = e.target.value.toUpperCase();
                setOrigins(newOrigins);
              }}
              className="p-3 border border-gray-500 rounded bg-gray-700 text-white w-40"
              placeholder="Código IATA"
            />
          ))}
          <button 
            onClick={() => setOrigins([...origins, ""])} 
            className="p-3 bg-blue-500 text-white rounded-lg"
          >
            + Añadir Origen
          </button>
        </div>

        <button 
          onClick={fetchFlights} 
          className="mt-5 w-full bg-blue-600 hover:bg-blue-700 p-3 rounded-lg text-lg transition-all"
        >
          🔍 Buscar Destino Más Barato
        </button>
      </div>

      {loading && <p className="mt-5 text-yellow-400">🔄 Buscando vuelos...</p>}
      {error && <p className="mt-5 text-red-500">❌ {error}</p>}

      <div className="mt-5 w-full max-w-3xl">
        {flights.length > 0 ? (
          <div className="bg-gray-800 p-5 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-3">✈️ Destinos Más Baratos</h2>
            <ul className="list-none">
              {flights.map((flight, index) => (
                <li key={index} className="mt-2 p-3 border-b border-gray-600">
                  <span className="text-green-400 font-semibold">{flight.price.total}€</span> → 
                  <strong className="ml-2">{flight.origin}</strong> a <strong>{flight.destination}</strong>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          !loading && !error && <p className="text-gray-400">No hay vuelos disponibles</p>
        )}
      </div>
    </div>
  );
}

export default App;
