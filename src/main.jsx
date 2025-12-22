import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./context/AuthProvider";
import { SocketProvider } from "./context/SocketProvider.jsx";
import { LoadingProvider } from "./context/LoadingContext"; // ✅ Move here

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "maplibre-gl/dist/maplibre-gl.css";


createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LoadingProvider> {/* ✅ Now available everywhere */}
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <App />
            <ToastContainer
            position="top-right"
            autoClose={3500}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </LoadingProvider>
  </React.StrictMode>
);
