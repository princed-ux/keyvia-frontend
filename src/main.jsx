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
import { LoadingProvider } from "./context/LoadingContext"; 
import { CallProvider } from "./context/CallProvider"; // ✅ IMPORT CALL PROVIDER

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "maplibre-gl/dist/maplibre-gl.css";


createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LoadingProvider> 
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            {/* ✅ WRAP APP WITH CALL PROVIDER */}
            {/* Must be inside SocketProvider because it uses the socket */}
            <CallProvider>
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
            </CallProvider>
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </LoadingProvider>
  </React.StrictMode>
);