import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import GameScreen from "./components/GameScreen";
import MainMenu from "./components/MainMenu";
import { Toaster } from "./components/ui/toaster";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainMenu />} />
          <Route path="/game" element={<GameScreen />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;