// src/App.js
import React from "react";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

function App() {
  return (
    <div>
      <Login />
      {/* <Signup />  // 둘 중 하나만 노출하려면 분기문 작성 */}
    </div>
  );
}

export default App;
