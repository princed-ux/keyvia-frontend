import React, { useState, useEffect, createContext, useContext } from "react";
import { WifiOff, RefreshCw, CheckCircle2 } from "lucide-react";

const NetworkStatusContext = createContext();

export const NetworkStatusProvider = ({ children }) => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setIsRetrying(false);
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Manual Retry Handler
  const handleRetry = () => {
    setIsRetrying(true);
    // Simulate a check delay (1.5s) to let the user see the animation
    setTimeout(() => {
      if (navigator.onLine) {
        setIsOffline(false);
        setIsRetrying(false);
      } else {
        // Still offline - strictly speaking we don't need to do anything,
        // but we could try a reload if you really want to force a server hit:
        // window.location.reload(); 
        setIsRetrying(false);
      }
    }, 1500);
  };

  return (
    <NetworkStatusContext.Provider value={{ isOffline }}>
      {/* 1. Inject Styles for Animation */}
      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulseRing {
          0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.2); }
          70% { box-shadow: 0 0 0 20px rgba(220, 38, 38, 0); }
          100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-slide-up { animation: slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-pulse-ring { animation: pulseRing 2s infinite; }
        .animate-spin-slow { animation: spin 1s linear infinite; }
      `}</style>

      {/* 2. The Overlay */}
      {isOffline && (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(255, 255, 255, 0.6)', // Light transparency
            backdropFilter: 'blur(12px)', // Heavy blur for "glass" effect
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 999999,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
        }}>
            
            {/* 3. The Card */}
            <div className="animate-slide-up" style={{
                backgroundColor: '#fff',
                padding: '40px',
                borderRadius: '24px',
                boxShadow: '0 20px 60px -10px rgba(0, 0, 0, 0.15), 0 10px 20px -5px rgba(0,0,0,0.05)',
                maxWidth: '420px',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                border: '1px solid rgba(0,0,0,0.05)'
            }}>
                
                {/* Icon Container with Pulse */}
                <div className="animate-pulse-ring" style={{
                    backgroundColor: '#FEF2F2',
                    padding: '24px',
                    borderRadius: '50%',
                    marginBottom: '24px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#DC2626'
                }}>
                    <WifiOff size={48} strokeWidth={2.5} />
                </div>

                <h2 style={{ 
                    color: '#111827', 
                    fontSize: '22px', 
                    fontWeight: '700', 
                    marginBottom: '12px',
                    letterSpacing: '-0.5px'
                }}>
                    Connection Lost
                </h2>
                
                <p style={{ 
                    color: '#6B7280', 
                    fontSize: '15px', 
                    lineHeight: '1.6', 
                    marginBottom: '32px' 
                }}>
                    We can't seem to reach the internet. Check your connection and we'll automatically reconnect you when it's back.
                </p>

                {/* Interactive Button */}
                <button 
                    onClick={handleRetry} 
                    disabled={isRetrying}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                        width: '100%',
                        padding: '14px 24px',
                        backgroundColor: isRetrying ? '#E5E7EB' : '#0F172A',
                        color: isRetrying ? '#9CA3AF' : '#FFFFFF',
                        border: 'none',
                        borderRadius: '12px',
                        fontWeight: '600',
                        fontSize: '15px',
                        cursor: isRetrying ? 'default' : 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: isRetrying ? 'none' : '0 4px 12px rgba(15, 23, 42, 0.2)'
                    }}
                    onMouseEnter={(e) => !isRetrying && (e.currentTarget.style.transform = 'translateY(-1px)')}
                    onMouseLeave={(e) => !isRetrying && (e.currentTarget.style.transform = 'translateY(0)')}
                >
                    {isRetrying ? (
                        <>
                            <RefreshCw size={18} className="animate-spin-slow" />
                            Checking...
                        </>
                    ) : (
                        "Try Again"
                    )}
                </button>
            </div>
        </div>
      )}

      {children}
    </NetworkStatusContext.Provider>
  );
};

export const useNetworkStatus = () => useContext(NetworkStatusContext);