import React, { createContext, useContext, useState } from "react";
import Loading from "../common/Loading";

const LoadingContext = createContext();

export const useLoading = () => useContext(LoadingContext);

export const LoadingProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);

  const showLoading = () => setLoading(true);
  const hideLoading = () => setLoading(false);

  return (
    <LoadingContext.Provider value={{ loading, showLoading, hideLoading }}>
      {children}
      {loading && <Loading />} {/* ✅ Fullscreen overlay */}
    </LoadingContext.Provider>
  );
};
