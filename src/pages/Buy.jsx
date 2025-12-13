import React from "react";
import HeaderWrapper from "../components/HeaderWrapper.jsx";
import buyBg from "../assets/stroll.jpg";

const Buy = () => {
  return (
    <>
      <HeaderWrapper backgroundImage={buyBg}>
        <h1>Buy Your Dream Home</h1>
        <p>Thousands of listings available for you</p>
      </HeaderWrapper>

      <main style={{ padding: "40px" }}>
        {/* Your buy page content */}
      </main>
    </>
  );
};

export default Buy;
