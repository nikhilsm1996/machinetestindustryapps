import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Homepage";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/LoginPage";
import Signup from "./pages/SignupPage";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css"; // Make sure to create this file with the styles below

const App = () => {
  return (
    <Router>
      <div className="app-wrapper">
        <Navbar />
        <main className="content-container">
          <div className="container mt-4">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
            </Routes>
          </div>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;