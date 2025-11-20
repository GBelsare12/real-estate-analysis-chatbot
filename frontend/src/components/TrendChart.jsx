import React from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js/auto";

const TrendChart = ({ years, rates, demand }) => {
  if (!years || years.length === 0) return null;

  const data = {
    labels: years,
    datasets: [
      {
        label: "Overall Rate",
        data: rates.overall,
        borderWidth: 3,
      },
      {
        label: "Demand",
        data: demand,
        borderWidth: 3,
      },
    ],
  };

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-body">
        <h5 className="card-title">Price & Demand Trends</h5>
        <Line data={data} />
      </div>
    </div>
  );
};

export default TrendChart;
