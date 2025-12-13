// src/pages/VerifyEmail.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // "verifying" | "success" | "error"
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/auth/verify?token=${token}`,
          { withCredentials: true }
        );

        if (res.data?.success) {
          const msg = res.data.message || "Your email has been successfully verified!";
          setStatus("success");
          setMessage(msg);

          Swal.fire({
            icon: "success",
            title: "✅ Email Verified!",
            text: msg,
            timer: 4000,
            timerProgressBar: true,
            showConfirmButton: false,
          });

          // ⏳ Redirect after success
          setTimeout(() => navigate("/login"), 4000);
        } else {
          throw new Error(res.data?.message || "Verification failed");
        }
      } catch (err) {
        console.error("Verification error:", err);
        const errorMsg =
          err.response?.data?.message || err.message || "Something went wrong";
        setStatus("error");
        setMessage(errorMsg);

        // 🎯 Handle specific messages nicely
        let alertTitle = "❌ Verification Failed";
        let alertIcon = "error";

        if (errorMsg.includes("already verified")) {
          alertTitle = "✅ Already Verified";
          alertIcon = "info";
        } else if (errorMsg.includes("expired")) {
          alertTitle = "⏰ Link Expired";
        } else if (errorMsg.includes("invalid")) {
          alertTitle = "⚠️ Invalid Link";
        }

        Swal.fire({
          icon: alertIcon,
          title: alertTitle,
          text: errorMsg,
          timer: 4000,
          timerProgressBar: true,
          showConfirmButton: false,
        });

        // ✅ Only redirect if already verified (to login)
        if (errorMsg.includes("already verified")) {
          setTimeout(() => navigate("/login"), 4000);
        }
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#f0f4f8",
        textAlign: "center",
        padding: "20px",
      }}
    >
      {status === "verifying" && (
        <>
          <h2>Verifying your email...</h2>
          <img
            src="/assets/loading.gif"
            alt="Loading..."
            style={{ width: 120, marginTop: 20 }}
          />
        </>
      )}

      {status === "success" && (
        <>
          <h2 style={{ color: "#4a90e2" }}>✅ Email Verified!</h2>
          <p>{message}</p>
          <img
            src="/assets/success.gif"
            alt="Success"
            style={{ width: 200, marginTop: 20 }}
          />
          <p style={{ marginTop: 10 }}>Redirecting to login...</p>
        </>
      )}

      {status === "error" && (
        <>
          <h2 style={{ color: "#e74c3c" }}>❌ Verification Failed</h2>
          <p>{message}</p>
          <img
            src="/assets/error.gif"
            alt="Error"
            style={{ width: 200, marginTop: 20 }}
          />
          <p style={{ marginTop: 10 }}>
            {message.includes("already verified")
              ? "Your account is already verified. Redirecting to login..."
              : message.includes("expired")
              ? "Your verification link has expired. Please request a new one."
              : "Please check your link or try signing up again."}
          </p>
        </>
      )}
    </div>
  );
}
