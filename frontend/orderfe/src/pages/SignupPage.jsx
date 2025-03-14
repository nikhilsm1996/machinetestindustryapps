import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const Signup = () => {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Validate password when it changes
  useEffect(() => {
    if (formData.password && formData.password.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
    } else {
      setPasswordError("");
    }
  }, [formData.password]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check password length before submitting
    if (formData.password.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
      return;
    }
    
    setError("");
    setIsLoading(true);
    
    try {
      // First register the user
      const registerRes = await fetch("http://localhost:5000/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      const registerData = await registerRes.json();
      if (!registerRes.ok) throw new Error(registerData.message || "Signup failed");
      
      // If registration is successful, automatically log them in
      const loginRes = await fetch("http://localhost:5000/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });
      
      const loginData = await loginRes.json();
      if (!loginRes.ok) throw new Error("Registration successful but auto-login failed. Please log in manually.");
      
      // Save the token and redirect to dashboard
      localStorage.setItem("token", loginData.token);
      navigate("/dashboard");
      window.dispatchEvent(new Event("storage")); 
      
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
          <h3 className="text-center mb-4">Create Account</h3>
          
          {error && (
            <div className="alert alert-danger py-2 mb-3" role="alert">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="name" className="form-label small text-muted">Full Name</label>
              <input
                id="name"
                className="form-control"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="mb-3">
              <label htmlFor="email" className="form-label small text-muted">Email Address</label>
              <input
                id="email"
                className="form-control"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="password" className="form-label small text-muted">Password</label>
              <input
                id="password"
                className={`form-control ${passwordError ? 'is-invalid' : ''}`}
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              {passwordError ? (
                <div className="invalid-feedback">{passwordError}</div>
              ) : (
                <div className="form-text small mt-1">
                  Password must be at least 6 characters long
                </div>
              )}
            </div>
            
            <div className="d-grid">
              <button
                className="btn btn-primary py-2"
                type="submit"
                disabled={isLoading || passwordError}
              >
                {isLoading ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                ) : null}
                {isLoading ? "Creating Account..." : "Sign Up"}
              </button>
            </div>
            
            <div className="text-center mt-3">
              <span className="text-muted small">Already have an account? </span>
              <a href="/login" className="small text-decoration-none">Log in</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;