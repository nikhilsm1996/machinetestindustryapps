import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      const res = await fetch("http://localhost:5000/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      
      localStorage.setItem("token", data.token);
      window.dispatchEvent(new Event("storage")); // ✅ Ensures navbar updates
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <div className="card shadow-sm" style={{ maxWidth: "400px", width: "100%" }}>
        <div className="card-body p-4">
          <h3 className="text-center mb-4">Login</h3>
          
          {error && (
            <div className="alert alert-danger py-2 mb-3" role="alert">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label small text-muted">Email</label>
              <input
                id="email"
                className="form-control"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                required
              />
            </div>
            
            <div className="mb-4">
              <div className="d-flex justify-content-between">
                <label htmlFor="password" className="form-label small text-muted">Password</label>
                <Link to="/forgot-password" className="small text-decoration-none">Forgot password?</Link>
              </div>
              <input
                id="password"
                className="form-control"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="d-grid">
              <button
                className="btn btn-primary py-2"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                ) : null}
                {isLoading ? "Logging in..." : "Login"}
              </button>
            </div>
            
            <div className="text-center mt-3">
              <span className="text-muted small">Don't have an account? </span>
              <Link to="/signup" className="small text-decoration-none">Sign up</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
