import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const navigate = useNavigate();
  
    const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    };
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      setError("");
      try {
        console.log("after try in fe")
        const res = await fetch("http://localhost:5000/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Login failed");
        localStorage.setItem("token", data.token);
        console.log("before navigate")
        navigate("/dashboard");
      } catch (err) {
        setError(err.message);
      }
    };
  
    return (
      <div className="container mt-5">
        <h2>Login</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input className="form-control my-2" type="email" name="email" placeholder="Email" onChange={handleChange} required />
          <input className="form-control my-2" type="password" name="password" placeholder="Password" onChange={handleChange} required />
          <button className="btn btn-primary" type="submit">Login</button>
        </form>
      </div>
    );
  };

  export default Login