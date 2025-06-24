// src/App.js
import React, { useState } from "react";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

function App() {
  const [page, setPage] = useState("login");
  
  return (
    <div>
      {page === "login" ? (
        <Login onSwitch={() => setPage("signup")} />
      ) : (
        <Signup onSwitch={() => setPage("login")} />
      )}
    </div>
  );
}

export default App;
