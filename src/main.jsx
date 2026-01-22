import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./index.css";
import App from "./App";

// --- Context Providers ---
import { AuthProvider } from "./context/AuthProvider";
import { SocketProvider } from "./context/SocketProvider.jsx";
import { LoadingProvider } from "./context/LoadingContext"; 
import { CallProvider } from "./context/CallProvider"; 
import { NetworkStatusProvider } from "./context/NetworkStatusProvider"; // ✅ IMPORT NEW PROVIDER
import { GlobalRefreshProvider } from "./context/GlobalRefreshContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "maplibre-gl/dist/maplibre-gl.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LoadingProvider> 
      {/* ✅ ADD GLOBAL NETWORK CHECK HERE */}
      <NetworkStatusProvider>
        <BrowserRouter>
          <AuthProvider>
            <SocketProvider>
              <GlobalRefreshProvider>
              <CallProvider>
                <App />
                {/* <ToastContainer
                  position="top-right"
                  autoClose={3500}
                  hideProgressBar={false}
                  newestOnTop={false}
                  closeOnClick
                  rtl={false}
                  pauseOnFocusLoss
                  draggable
                  pauseOnHover
                /> */}
              </CallProvider>
              </GlobalRefreshProvider>
            </SocketProvider>
          </AuthProvider>
        </BrowserRouter>
      </NetworkStatusProvider>
    </LoadingProvider>
  </React.StrictMode>
);