import { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState("Conectando con el backend...");

  useEffect(() => {
    fetch("http://localhost:5000/")
      .then(response => response.text())
      .then(data => setMessage(data))
      .catch(error => setMessage("❌ Error conectando con el backend"));
  }, []);

  return (
    <div className="text-center p-5">
      <h1 className="text-3xl font-bold">FlyndMe</h1>
      <p className="mt-5">{message}</p>
    </div>
  );
}

export default App;
