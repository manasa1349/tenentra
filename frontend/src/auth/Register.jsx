import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/api";
import "../styles/auth.css";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    tenantName: "",
    subdomain: "",
    adminEmail: "",
    adminFullName: "",
    adminPassword: "",
    confirmPassword: "",
    terms: false,
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");

    if (form.adminPassword !== form.confirmPassword) {
      return setError("Passwords do not match");
    }

    if (!form.terms) {
      return setError("You must accept Terms & Conditions");
    }

    setLoading(true);

    try {
      await api.post("/auth/register-tenant", {
        tenantName: form.tenantName,
        subdomain: form.subdomain,
        adminEmail: form.adminEmail,
        adminFullName: form.adminFullName,
        adminPassword: form.adminPassword,
      });

      setSuccess("Registration successful. Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Register Tenant</h2>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <label>Organization Name</label>
        <input
          name="tenantName"
          required
          value={form.tenantName}
          onChange={handleChange}
        />

        <label>Subdomain</label>
        <input
          name="subdomain"
          required
          placeholder="yourcompany"
          value={form.subdomain}
          onChange={handleChange}
        />
        <small>{form.subdomain}.yourapp.com</small>

        <label>Admin Email</label>
        <input
          type="email"
          name="adminEmail"
          required
          value={form.adminEmail}
          onChange={handleChange}
        />

        <label>Admin Full Name</label>
        <input
          name="adminFullName"
          required
          value={form.adminFullName}
          onChange={handleChange}
        />

        <label>Password</label>
        <input
          type="password"
          name="adminPassword"
          required
          value={form.adminPassword}
          onChange={handleChange}
        />
        <small>
          Min 8 characters, include uppercase, lowercase & number
        </small>

        <label>Confirm Password</label>
        <input
          type="password"
          name="confirmPassword"
          required
          value={form.confirmPassword}
          onChange={handleChange}
        />

        <label className="checkbox">
          <input
            type="checkbox"
            name="terms"
            checked={form.terms}
            onChange={handleChange}
          />
          I agree to Terms & Conditions
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>

        <p className="auth-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}