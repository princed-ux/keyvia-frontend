import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthProvider";
import style from "../styles/signup.module.css";
import { Timer } from "lucide-react";
import Swal from "sweetalert2"; // Import Swal here

const SignupVerifyOtp = () => {
  // 1. Get the function
  const { signupVerifyOtp, signupResendOtp } = useAuth();
  
  // 2. Try to get email from session, or default to empty
  const [storedEmail, setStoredEmail] = useState(
    sessionStorage.getItem("signupEmail") || ""
  );

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (index, e) => {
    const value = e.target.value;
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1].focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setVerifying(true);
    const code = otp.join("");

    // 🛑 BULLETPROOF CHECK:
    // If we don't have the email in the UI, ask for it HERE before calling AuthProvider
    let currentEmail = storedEmail;
    
    if (!currentEmail) {
       const { value: userEmail } = await Swal.fire({
          title: "Confirm Email",
          text: "Please confirm your email address:",
          input: "email",
          inputPlaceholder: "name@example.com",
          allowOutsideClick: false,
       });
       if (!userEmail) {
         setVerifying(false); 
         return; 
       }
       currentEmail = userEmail;
       setStoredEmail(userEmail); // Update state
       sessionStorage.setItem("signupEmail", userEmail); // Update session
    }

    try {
      // Pass BOTH code AND email to the verify function
      await signupVerifyOtp(code, currentEmail);
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = () => {
    setTimer(60);
    setCanResend(false);
    setOtp(["", "", "", "", "", ""]);
    signupResendOtp();
  };

  return (
    <div className={style.container}>
      <div className={style.right} style={{ width: "100%", maxWidth: "500px", margin: "0 auto" }}>
        <form onSubmit={handleSubmit} className={style.form}>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <h2>Check Your Email</h2>
            <p className="text-muted">
              We sent a code to <b>{storedEmail || "your email"}</b>. 
              Enter it below to verify your account.
            </p>
          </div>

          <div className={style.otpContainer}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(index, e)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={style.otpBox}
              />
            ))}
          </div>

          <div className={style.timerSection}>
            {timer > 0 ? (
              <p className={style.timerText}>
                <Timer size={16} /> Resend in <span className={style.highlight}>00:{timer < 10 ? `0${timer}` : timer}</span>
              </p>
            ) : (
              <p className={style.expiredText}>Code expired.</p>
            )}
          </div>

          <button
            type="submit"
            className={style.button}
            disabled={verifying || otp.join("").length < 6}
          >
            {verifying ? "Verifying..." : "Verify Code"}
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={!canResend}
            className={style.resendButton}
          >
            Resend Code
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignupVerifyOtp;