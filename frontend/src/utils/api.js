import axios from "axios";

const API_BASE = "http://127.0.0.1:8000/api";

export const fetchQuery = async (query) => {
  const res = await axios.post(`${API_BASE}/query/`, {
    query,
    use_llm: false,
  });
  return res.data;
};

