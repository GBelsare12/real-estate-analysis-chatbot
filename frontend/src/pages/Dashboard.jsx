import React, { useState } from "react";
import QueryBox from "../components/QueryBox";
import SummaryCard from "../components/SummaryCard";
import TrendChart from "../components/TrendChart";
import DataTable from "../components/DataTable";
import Loader from "../components/Loader";
import { fetchQuery } from "../utils/api";

const Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [chart, setChart] = useState(null);
  const [table, setTable] = useState([]);

  const handleQuery = async (text) => {
    try {
      setLoading(true);
      const res = await fetchQuery(text);

      setSummary(res.summary);
      setChart(res.chart);
      setTable(res.table);
    } catch (e) {
      alert("Error fetching data");
    }
    setLoading(false);
  };

  return (
    <div className="container-fluid" style={{ marginLeft: "260px" }}>
      <div className="p-4">
        <QueryBox onSubmit={handleQuery} />
        {loading && <Loader />}
        {!loading && (
          <>
            <SummaryCard summary={summary} />
            {chart && (
              <TrendChart
                years={chart.years}
                rates={chart.rates}
                demand={chart.demand}
              />
            )}
            <DataTable table={table} />
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
