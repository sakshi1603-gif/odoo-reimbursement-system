import React from "react";
import "./Dashboard.css";

const Dashboard = () => {
  const expenses = [
    { id: 1, title: "Travel", amount: "₹1500", status: "Approved" },
    { id: 2, title: "Food", amount: "₹500", status: "Pending" },
    { id: 3, title: "Hotel", amount: "₹3000", status: "Rejected" },
  ];

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <h1>Welcome, Aarchi 👋</h1>
        <button className="add-btn">+ Submit Expense</button>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="card gradient1">
          <h3>Total Expenses</h3>
          <p>₹5000</p>
        </div>

        <div className="card gradient2">
          <h3>Approved</h3>
          <p>₹3000</p>
        </div>

        <div className="card gradient3">
          <h3>Pending</h3>
          <p>₹2000</p>
        </div>
      </div>

      {/* Expense Table */}
      <div className="expense-table">
        <h2>Recent Expenses</h2>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {expenses.map((exp) => (
              <tr key={exp.id}>
                <td>{exp.id}</td>
                <td>{exp.title}</td>
                <td>{exp.amount}</td>
                <td>
                  <span className={`status ${exp.status.toLowerCase()}`}>
                    {exp.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;