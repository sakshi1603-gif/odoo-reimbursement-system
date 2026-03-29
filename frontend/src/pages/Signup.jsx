import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const { signup } = useAuth();

  const [form, setForm] = useState({
    companyName: "",
    country: "",
    currency: "",
    name: "",
    email: "",
    password: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    signup(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input placeholder="Company" onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
      <input placeholder="Country" onChange={(e) => setForm({ ...form, country: e.target.value })} />
      <input placeholder="Currency" onChange={(e) => setForm({ ...form, currency: e.target.value })} />
      <input placeholder="Name" onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input placeholder="Email" onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input type="password" onChange={(e) => setForm({ ...form, password: e.target.value })} />
      <button>Signup</button>
    </form>
  );
}