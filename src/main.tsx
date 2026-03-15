import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const hostname = window.location.hostname;
const isPreviewHost =
  /(?:^|\.)lovableproject\.com$/i.test(hostname) ||
  (/(?:^|\.)lovable\.app$/i.test(hostname) && hostname.includes('--'));

if (isPreviewHost && "serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister();
    });
  });

  if ("caches" in window) {
    caches.keys().then((keys) => {
      keys.forEach((key) => {
        caches.delete(key);
      });
    });
  }
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
