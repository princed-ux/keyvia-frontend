import { useEffect } from "react";
import { useGlobalRefresh } from "../context/GlobalRefreshContext";

/**
 * Automatically runs the fetchFunction when the Global Refresh triggers.
 * @param {Function} fetchFunction - The function to call (e.g., fetchApplications)
 */
const useAutoFetch = (fetchFunction) => {
  const { refreshVersion } = useGlobalRefresh();

  useEffect(() => {
    // Run immediately on mount
    fetchFunction();
    
    // And run whenever the global version changes (Socket event received)
  }, [refreshVersion]); 
};

export default useAutoFetch;