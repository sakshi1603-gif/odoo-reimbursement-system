import React from "react";
import "./AdminPanel.css";

const AdminPanel = () => {
  return (
    <div className="admin-container">
      <h1>Admin Dashboard</h1>

      <div className="card-container">
        <div className="card">Total Users: 120</div>
        <div className="card">Pending Requests: 8</div>
        <div className="card">Approved: 54</div>
        <div className="card">Rejected: 10</div>
      </div>

      <div className="table-section">
        <h2>Users</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>Aarchi</td>
              <td>Admin</td>
            </tr>
            <tr>
              <td>2</td>
              <td>Rahul</td>
              <td>Employee</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPanel;