import React from 'react';
import ReactDOM from 'react-dom/client';
// Import the main application component
import App from './RealEstateChatbot.jsx'; 

// Create the root element and render the main App component inside it.
const rootElement = document.getElementById('root');
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <React.StrictMode>
            {/* The main application component that contains the dashboard */}
            <App /> 
        </React.StrictMode>
    );
} else {
    // This error will only show in the console if the div id="root" is missing from index.html
    console.error("Failed to find the root element with ID 'root' in index.html. Check your public/index.html file.");
}