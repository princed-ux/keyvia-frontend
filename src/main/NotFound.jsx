// NotFound.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import style from "../styles/not-found.module.css";

const NotFound = () => {
  const navigate = useNavigate();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    if (window.history.length > 1) {
      setCanGoBack(true);
    }
  }, []);

  const lottie =
    "https://lottie.host/f9373c87-ac64-405d-be06-63444f8f3eb4/PTQYU0a6C9.lottie";

  return (
    <div className={style.container}>
      <div className={style.lottieContainer}>
        <DotLottieReact
  src={lottie}
  loop
  autoplay
  className={style.lotties}
/>

      </div>

      <h1 className={style.title}>404</h1>
      <p className={style.subtitle}>
        Hmm… we can’t seem to find the page you’re looking for.<br />
        The link might be broken or the page may have been removed.
      </p>

      <div className={style.actions}>
        {canGoBack && (
          <button onClick={() => navigate(-1)} className={style.secondary}>
           <i class="fa-solid fa-arrow-left pe-2"></i> Go Back
          </button>
        )}
        <Link to="/" className={style.primary}>
          <i className="fa-solid fa-house pe-2"></i> Go Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
