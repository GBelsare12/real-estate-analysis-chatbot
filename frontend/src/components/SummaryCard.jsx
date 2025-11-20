import React from "react";

const SummaryCard = ({ summary }) => {
  if (!summary) return null;

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-body">
        <h5 className="card-title">Summary</h5>
        <p className="card-text">{summary}</p>
      </div>
    </div>
  );
};

export default SummaryCard;
