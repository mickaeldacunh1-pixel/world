import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import "@/i18n"; // Import i18n configuration
import App from "@/App";

// Register Service Worker for push notifications (in production only)
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration.scope);
      })
      .catch((error) => {
        // Silently fail - SW is optional for push notifications
        console.log('SW registration skipped:', error.message);
      });
  });
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
