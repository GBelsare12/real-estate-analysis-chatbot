import React, { useState } from "react";

const QueryBox = ({ onSubmit }) => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim() !== "") {
      onSubmit(query);
      setQuery("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <div className="d-flex">
        <input
          className="form-control form-control-lg"
          type="text"
          placeholder="Ask: Analyze Wakad..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="btn btn-primary btn-lg ms-2" type="submit">
          Search
        </button>
      </div>
    </form>
  );
};

export default QueryBox;
