import { Routes as Router, Route } from "react-router-dom";
import "./App.css";
import HomePage from "./pages/HomePage.jsx";
import ChatPage from "./pages/ChatPage.jsx";

function App() {
  return (
    <div className="App">
      <Router>
        <Route path="/" element={<HomePage />} />
        <Route path="/chats" element={<ChatPage />} />
      </Router>
    </div>
  );
}

export default App;
