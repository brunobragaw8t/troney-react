import { useState } from "react";
import { Button } from "./components/ui/button/button";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <h1>Vite + React</h1>

      <div className="card">
        <Button
          type="button"
          onClick={() => setCount((count) => count + 1)}
          label={`count is ${count}`}
          variant="primary"
        />

        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
    </>
  );
}

export default App;
