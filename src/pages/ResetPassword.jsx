import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import styles from "../styles/reset.module.css";

// Optional GIFs - swap these for your own assets if you'd like
const lockGif = "https://media.giphy.com/media/3o7TKrK0z6gRjK3k4s/giphy.gif"; // lock animation
const successGif = "https://media.giphy.com/media/111ebonMs90YLu/giphy.gif"; // confetti

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Password strength (very simple estimator)
  const getStrength = (pw) => {
    if (!pw) return { label: "Empty", score: 0 };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const labels = ["Very weak", "Weak", "Okay", "Good", "Strong"];
    return { label: labels[score], score };
  };

  const { label: strengthLabel, score: strengthScore } = getStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!password || !confirmPassword) {
      setMessage("Please fill in both fields.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      // You can change this URL to your API endpoint or use your context function
      const res = await axios.post(
        `http://localhost:5000/reset-password/${token}`,
        { password }
      );

      // Handle both data.success and conventional status / message patterns
      const success = res?.data?.success ?? res?.status === 200;
      const respMsg = res?.data?.message || "Password reset successful.";

      if (success) {
        // SweetAlert with GIF + auto-redirect
        await Swal.fire({
          title: "Password reset!",
          html: `<div style="display:flex;flex-direction:column;align-items:center">
                   <img src="${successGif}" alt="success" style="width:120px;height:120px;margin-bottom:8px;"/>
                   <div>${respMsg}</div>
                 </div>`,
          showConfirmButton: true,
          confirmButtonText: "Go to Login",
          width: 520,
        });
        navigate("/login");
      } else {
        setMessage(respMsg || "Something went wrong. Please try again.");
      }
    } catch (err) {
      console.error("Reset error:", err);
      const serverMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "An unexpected error occurred.";
      setMessage(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.left}>
          <img src={lockGif} alt="secure lock" className={styles.heroGif} />
          <h1>Reset your password</h1>
          <p className={styles.lead}>
            Choose a strong password to keep your account secure.
          </p>

          <ul className={styles.tips}>
            <li>Use at least 8 characters</li>
            <li>Mix uppercase, lowercase, digits, and symbols</li>
            <li>Avoid reusing old passwords</li>
          </ul>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <h2 className={styles.formTitle}>Set a new password</h2>

          <label htmlFor="password" className={styles.label}>
            New password
          </label>
          <div className={styles.inputRow}>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              className={styles.input}
              autoComplete="new-password"
              aria-describedby="pw-strength"
              required
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((s) => !s)}
              className={styles.showBtn}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <div id="pw-strength" className={styles.strengthRow}>
            <div className={styles.strengthBars}>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`${styles.strengthBar} ${
                    i < strengthScore ? styles.active : ""
                  }`}
                />
              ))}
            </div>
            <div className={styles.strengthLabel}>{strengthLabel}</div>
          </div>

          <label htmlFor="confirm" className={styles.label}>
            Confirm password
          </label>
          <div className={styles.inputRow}>
            <input
              id="confirm"
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className={styles.input}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              aria-label={showConfirm ? "Hide password" : "Show password"}
              onClick={() => setShowConfirm((s) => !s)}
              className={styles.showBtn}
            >
              {showConfirm ? "Hide" : "Show"}
            </button>
          </div>

          {message && <div className={styles.message}>{message}</div>}

          <button
            type="submit"
            className={styles.submit}
            disabled={loading}
            aria-disabled={loading}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>

          <div className={styles.helpRow}>
            <small>
              Remembered your password?{" "}
              <a href="/login" className={styles.link}>
                Sign in
              </a>
            </small>
            <small className={styles.helpNote}>
              This link will expire — if it does, request a new reset from the
              login page.
            </small>
          </div>
        </form>
      </div>
    </div>
  );
}
