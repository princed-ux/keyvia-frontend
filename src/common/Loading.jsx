// src/components/Loading.jsx
import React from "react";
import styles from "../styles/Loading.module.css";

export default function Loading({ text = "Loading" }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        {/* simple cartoon house SVG */}
        <svg
          className={styles.house}
          viewBox="0 0 64 64"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <g fill="none" fillRule="evenodd">
            <path
              d="M8 28 L32 8 L56 28 V52 H8z"
              fill="#0ea5e9"
              stroke="#0369a1"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <rect x="22" y="32" width="20" height="20" rx="2" fill="#ffffff" />
            <rect x="28" y="38" width="8" height="14" rx="1" fill="#0369a1" />
            <circle className={styles.smoke1} cx="14" cy="22" r="2.8" fill="#fff" opacity="0.6"/>
            <circle className={styles.smoke2} cx="18" cy="18" r="2.2" fill="#fff" opacity="0.5"/>
          </g>
        </svg>

        <div className={styles.textRow}>
          <div className={styles.text}>{text}</div>
          <div className={styles.dots}>
            <b>.</b>
            <b>.</b>
            <b>.</b>
          </div>
        </div>
      </div>
    </div>
  );
}
