import React from "react";
import "./ApprovalRules.css";

const ApprovalRules = () => {
  return (
    <div className="rules-container">
      <h1>Approval Rules</h1>

      <form className="rule-form">
        <input type="text" placeholder="Department" />
        <input type="number" placeholder="Max Amount" />
        <select>
          <option>Manager</option>
          <option>Admin</option>
        </select>

        <button type="submit">Add Rule</button>
      </form>
    </div>
  );
};

export default ApprovalRules;