import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { FaChartLine, FaHome, FaMoon, FaDownload, FaSearch, FaUpload, FaFileExcel, FaTimesCircle } from "react-icons/fa";

// Register Chart.js components required for the Line chart
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// --- Global Config & Utility ---
const API_BASE = "http://127.0.0.1:8000/api";

// API Call for Query
const fetchQuery = async (query) => {
    try {
        const res = await axios.post(`${API_BASE}/query/`, {
            query,
            use_llm: false, 
        });
        return res.data;
    } catch (error) {
        console.error("API Fetch Error:", error.response ? error.response.data : error.message);
        const errorMsg = error.response?.data?.error || "Could not connect to Django API. Check your backend terminal.";
        throw new Error(errorMsg);
    }
};

// API Call for Upload
const uploadDataset = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await axios.post(`${API_BASE}/upload/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return res.data;
    } catch (error) {
        console.error("Upload Error:", error.response ? error.response.data : error.message);
        const errorMsg = error.response?.data?.error || "Upload failed. Ensure file is .xlsx or .csv.";
        throw new Error(errorMsg);
    }
};


const CHART_COLORS = [
    'rgb(79, 70, 229)',  // Indigo
    'rgb(239, 68, 68)',  // Red
    'rgb(16, 185, 129)', // Emerald
    'rgb(245, 158, 11)', // Amber
    'rgb(59, 130, 246)', // Blue
];

// --- 2. Shared Components ---

// Loader Component
const Loader = () => (
    <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 dark:border-indigo-300"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Processing query... This may take a moment.</span>
    </div>
);

// File Upload Component (NEW)
const FileUpload = ({ setLoading, setNotification }) => {
    const fileInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setNotification({ message: `Uploading ${file.name}...`, type: 'info' });
        setLoading(true);
        
        try {
            const res = await uploadDataset(file);
            setNotification({ message: res.message + " Please submit a new query.", type: 'success' });
        } catch (error) {
            setNotification({ message: error.message, type: 'error' });
        }
        
        setLoading(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; // Clear file input
        }
    };

    return (
        <div className="mt-8">
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Dataset Source</h4>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx,.xls,.csv"
                className="hidden"
                id="file-upload"
                // The issue here is the disabled prop usage. Fixed in file block.
            />
            <label htmlFor="file-upload" className="w-full cursor-pointer p-2 rounded-lg text-sm transition duration-200 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex justify-center items-center shadow-md">
                <FaUpload className="w-4 h-4 mr-2" /> Upload New Dataset
            </label>
            <p className="text-xs text-gray-400 mt-1">Accepts .xlsx, .xls, .csv</p>
        </div>
    );
};


// Sidebar Component (Includes File Upload and Dark/Light Mode Toggle)
const Sidebar = ({ isDark, toggleDark, setLoading, setNotification }) => (
    <div className={`fixed h-full w-64 p-5 flex flex-col ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-800 text-white'} shadow-2xl z-10 transition-colors duration-300`}>
        <h1 className="text-xl font-bold mb-8 flex items-center">
            <FaHome className="w-6 h-6 mr-2 text-indigo-400" />
            Real Estate AI
        </h1>
        
        <div className="flex-grow">
            <div className="flex items-center p-3 rounded-lg bg-indigo-700 font-medium transition duration-150">
                <FaChartLine className="mr-2" /> Dashboard
            </div>
            
            <FileUpload setLoading={setLoading} setNotification={setNotification} />

            <div className="mt-8 text-xs text-gray-400">
                Project Status: Running
            </div>
        </div>

        <button 
            onClick={toggleDark}
            className="w-full mt-4 p-2 rounded-lg text-sm transition duration-200 hover:bg-indigo-700 bg-indigo-600 text-white font-semibold flex justify-center items-center shadow-md"
        >
            <FaMoon className="w-5 h-5 mr-2" />
            {isDark ? 'Light Mode' : 'Dark Mode'}
        </button>
    </div>
);


// QueryBox Component (Unchanged)
const QueryBox = ({ onSubmit, disabled }) => {
    const [query, setQuery] = useState("Compare Ambegaon Budruk and Aundh demand trends");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim() !== "") {
            onSubmit(query);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mb-8">
            <div className="flex space-x-3">
                <input
                    className="flex-grow p-4 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 shadow-lg text-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white transition duration-150"
                    type="text"
                    placeholder="E.g., Analyze Wakad price trends or Compare areas..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    disabled={disabled}
                />
                <button
                    className={`px-8 py-3 rounded-xl text-white font-semibold text-lg transition duration-200 shadow-md ${disabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    type="submit"
                    disabled={disabled}
                >
                    <FaSearch className="inline-block mr-2" /> Search
                </button>
            </div>
        </form>
    );
};

// SummaryCard Component
const SummaryCard = ({ summary, area }) => (
    <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6 mb-8 border border-indigo-400/50 transition-colors duration-300">
        <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-4">
            Analysis Summary: {area || 'Loading...'}
        </h2>
        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
            {summary || "Submit a query to see the real estate analysis summary here."}
        </p>
    </div>
);

// Shared function to handle chart download (Bonus Requirement)
const handleChartDownload = (chartRef, filename) => {
    const chartInstance = chartRef.current;
    
    if (chartInstance && chartInstance.toBase64Image) {
        const imageURL = chartInstance.toBase64Image('image/png', 1.0);
        
        const a = document.createElement('a');
        a.href = imageURL;
        a.download = `${filename}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
};

// Common function for chart options
const getChartOptions = (title, yAxesId) => {
    const isDark = document.documentElement.classList.contains('dark');
    const color = isDark ? 'rgb(156, 163, 175)' : 'rgb(107, 114, 128)';
    const gridColor = 'rgba(209, 213, 219, 0.1)';

    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: { color: color }
            },
            title: {
                display: true,
                text: title,
                color: isDark ? 'rgb(209, 213, 219)' : 'rgb(55, 65, 81)'
            },
        },
        scales: {
            x: {
                title: { display: true, text: 'Year', color: color },
                ticks: { color: color },
                grid: { color: gridColor }
            },
            yRate: {
                type: 'linear',
                display: true,
                position: 'left',
                title: { display: true, text: 'Avg Rate (INR)', color: CHART_COLORS[0] },
                ticks: { color: color },
                grid: { color: gridColor }
            },
            yDemand: {
                type: 'linear',
                display: yAxesId === 'yDemand', // Only show demand axis if needed
                position: 'right',
                title: { display: true, text: 'Demand (Units)', color: CHART_COLORS[1] },
                ticks: { color: color },
                grid: { drawOnChartArea: false }
            },
        }
    };
};

// Component for Single Area Analysis (Rates + Demand on one chart)
const TrendChart = ({ chart, areaName }) => { 
    const chartRef = useRef(null); 

    if (!chart || !chart.years || chart.years.length === 0) {
        return <div className="p-8 bg-white dark:bg-gray-800 shadow-xl rounded-xl text-center text-gray-500 dark:text-gray-400">No trend data available for this query.</div>;
    }

    const chartData = {
        labels: chart.years,
        datasets: [
            {
                label: "Weighted Avg Rate (INR)",
                data: chart.rates.overall,
                borderColor: CHART_COLORS[0],
                backgroundColor: 'rgba(79, 70, 229, 0.2)',
                borderWidth: 3,
                tension: 0.3,
                yAxisID: 'yRate',
            },
            {
                label: "Total Demand (Units Sold)",
                data: chart.demand,
                borderColor: CHART_COLORS[1],
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                borderWidth: 3,
                tension: 0.3,
                yAxisID: 'yDemand',
            },
        ],
    };

    return (
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6 mb-8 border border-indigo-400/50 transition-colors duration-300">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Price & Demand Trends</h3>
                <button
                    onClick={() => handleChartDownload(chartRef, `${areaName}_trend_chart`)}
                    className="px-4 py-2 text-sm rounded-lg text-white bg-green-600 hover:bg-green-700 transition duration-150 flex items-center shadow-md"
                >
                    <FaDownload className="w-4 h-4 mr-2" /> Download Chart (PNG)
                </button>
            </div>
            <div className="h-[400px] w-full">
                <Line ref={chartRef} data={chartData} options={getChartOptions(`Price & Demand Trends for ${areaName}`, 'yDemand')} />
            </div>
        </div>
    );
};

// Component for Multi-Area Comparison 
const ComparisonChart = ({ multiChartData, areaNames }) => {
    const chartRef = useRef(null);
    
    if (!multiChartData || multiChartData.length < 2) {
        return <div className="p-8 bg-white dark:bg-gray-800 shadow-xl rounded-xl text-center text-gray-500 dark:text-gray-400">Not enough data for comparison.</div>;
    }

    const allYears = multiChartData.flatMap(d => d.chart.years);
    const uniqueYears = Array.from(new Set(allYears)).sort((a, b) => parseInt(a) - parseInt(b));
    
    const datasets = multiChartData.map((data, index) => {
        const rates = data.chart.rates.overall || [];
        const areaYears = data.chart.years;
        
        const rateMap = new Map(areaYears.map((year, i) => [year, rates[i]]));
        const dataPoints = uniqueYears.map(year => rateMap.get(year) || null);

        const colorIndex = index % CHART_COLORS.length;

        return {
            label: `${data.area} - Avg Rate`,
            data: dataPoints,
            borderColor: CHART_COLORS[colorIndex],
            backgroundColor: CHART_COLORS[colorIndex].replace('rgb', 'rgba').replace(')', ', 0.2)'),
            borderWidth: 3,
            tension: 0.3,
            yAxisID: 'yRate',
        };
    });

    const chartData = {
        labels: uniqueYears,
        datasets: datasets,
    };

    return (
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6 mb-8 border border-indigo-400/50 transition-colors duration-300">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Price Comparison: {areaNames.join(' vs ')}</h3>
                <button
                    onClick={() => handleChartDownload(chartRef, 'multi_area_comparison')}
                    className="px-4 py-2 text-sm rounded-lg text-white bg-green-600 hover:bg-green-700 transition duration-150 flex items-center shadow-md"
                >
                    <FaDownload className="w-4 h-4 mr-2" /> Download Chart (PNG)
                </button>
            </div>
            <div className="h-[400px] w-full">
                <Line ref={chartRef} data={chartData} options={getChartOptions(`Price Trends Comparison`, 'yRate')} />
            </div>
        </div>
    );
};


// DataTable Component (Includes Download Table Button)
const DataTable = ({ table }) => {
    if (!table || table.length === 0) {
        return null;
    }

    const headers = Object.keys(table[0]).filter(key => key !== 'id');

    // Function to handle table download as CSV (Bonus Requirement)
    const handleDownloadCSV = () => {
        let csvContent = headers.map(h => `"${h.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}"`).join(',') + '\n';
        
        table.forEach(row => {
            const rowData = headers.map(header => {
                let value = row[header];
                if (value === undefined || value === null) value = '';
                return `"${String(value).replace(/"/g, '""')}"`;
            }).join(',');
            csvContent += rowData + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "real_estate_data_details.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    return (
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6 border border-indigo-400/50 transition-colors duration-300 overflow-x-auto">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Filtered Detailed Data</h3>
                 <button
                    onClick={handleDownloadCSV}
                    className="px-4 py-2 text-sm rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition duration-150 flex items-center shadow-md"
                >
                    <FaDownload className="w-4 h-4 mr-2" /> Download Table (CSV)
                </button>
            </div>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-indigo-50 dark:bg-gray-700">
                    <tr>
                        {headers.map((header) => (
                            <th
                                key={header}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                            >
                                {/* Display headers nicely by capitalizing words */}
                                {header.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {table.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-indigo-50/50 dark:hover:bg-gray-700/50 transition-colors duration-150">
                            {headers.map((header) => (
                                <td key={header} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                    {row[header] === undefined || row[header] === null ? '-' : String(row[header])}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};


// --- 3. Main Application Component (App) ---
const App = () => {
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState("");
    const [singleChartData, setSingleChartData] = useState(null);
    const [comparisonData, setComparisonData] = useState(null); // New state for multi-area data
    const [tableData, setTableData] = useState([]);
    const [areaName, setAreaName] = useState("");
    const [error, setError] = useState(null);
    const [isDark, setIsDark] = useState(true);
    const [notification, setNotification] = useState(null); // State for upload messages

    // Initial dark mode setup (using Tailwind's dark class)
    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDark);
    }, [isDark]);

    const toggleDark = () => setIsDark(prev => !prev);


    const handleQuery = async (text) => {
        setError(null);
        setNotification(null); // Clear notification on new query
        setLoading(true);
        setAreaName("Processing...");
        setComparisonData(null); 
        setSingleChartData(null); 
        
        try {
            const res = await fetchQuery(text);

            if (res.multi_chart_data) {
                // Handle Comparison Response
                setComparisonData(res.multi_chart_data);
                setAreaName(`Comparison: ${res.comparison_areas.join(', ')}`);
                setSummary(res.summary);
                setTableData(res.table || []);
            } else {
                // Handle Single Area Response
                setSingleChartData(res.chart);
                setAreaName(res.area);
                setSummary(res.summary);
                setTableData(res.table);
            }
            
        } catch (e) {
            console.error("Query Error:", e.message);
            setError(e.message);
            setSummary("Could not perform the analysis. Please check your Django backend logs for errors or ensure the area name is valid.");
            setTableData([]);
            setAreaName("Error");
        }
        setLoading(false);
    };

    // Notification UI component inside App
    const NotificationToast = () => {
        if (!notification) return null;
        
        const baseClass = "fixed top-4 right-4 p-4 rounded-lg shadow-xl text-white flex items-center z-50 transition duration-300";
        let colorClass = "";
        
        if (notification.type === 'success') {
            colorClass = "bg-green-600 border border-green-800";
        } else if (notification.type === 'error') {
            colorClass = "bg-red-600 border border-red-800";
        } else {
            colorClass = "bg-indigo-600 border border-indigo-800";
        }
        
        return (
            <div className={`${baseClass} ${colorClass}`}>
                <FaTimesCircle className="mr-2 cursor-pointer" onClick={() => setNotification(null)} />
                <span>{notification.message}</span>
            </div>
        );
    };


    return (
        <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900 font-sans transition-colors duration-300">
            <NotificationToast />

            <Sidebar 
                isDark={isDark} 
                toggleDark={toggleDark} 
                setLoading={setLoading} 
                setNotification={setNotification} 
            />
            <main className="flex-grow ml-64 p-8">
                <div className="max-w-7xl mx-auto">
                    
                    {/* Header */}
                    <header className="mb-10 pt-4">
                        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Real Estate Market Dashboard</h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Ask a question to analyze trends for any locality in the dataset.</p>
                    </header>

                    {/* Query Box */}
                    <QueryBox onSubmit={handleQuery} disabled={loading} />

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 dark:bg-red-900/50 dark:border-red-600 dark:text-red-400" role="alert">
                            <strong className="font-bold">Error! </strong>
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}

                    {/* Content */}
                    {loading ? (
                        <Loader />
                    ) : (
                        <>
                            {/* Initial Message */}
                            {!areaName && !error && (
                                <div className="p-8 text-center text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                                    <p className="text-xl">Welcome! Submit a query like "Analyze Wakad" or "Compare Ambegaon Budruk and Aundh" to get started.</p>
                                    <p className="mt-2 text-sm">Make sure your Django server is running at *http://127.0.0.1:8000* and the *dataset.xlsx* file is accessible in your *data* folder.</p>
                                </div>
                            )}

                            {/* Results */}
                            {areaName && areaName !== "Processing..." && areaName !== "Error" && (
                                <>
                                    <SummaryCard summary={summary} area={areaName} />
                                    
                                    {/* Conditional Chart Rendering */}
                                    {comparisonData ? (
                                        <ComparisonChart 
                                            multiChartData={comparisonData} 
                                            areaNames={areaName.replace('Comparison: ', '').split(', ')}
                                        />
                                    ) : (
                                        <TrendChart chart={singleChartData} areaName={areaName} />
                                    )}

                                    {/* Table (only rendered for single analysis) */}
                                    {!comparisonData && <DataTable table={tableData} />}
                                </>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default App;