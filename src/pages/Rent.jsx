import React from "react";
import HeaderWrapper from "../components/HeaderWrapper.jsx";
import rentBg from "../assets/home.jpg";

const Rent = () => {
  return (
    <>
      <HeaderWrapper backgroundImage={rentBg}>
        <h1>Find Your Next Rental</h1>
        <p>Explore apartments, houses, and condos for rent</p>
      </HeaderWrapper>

      <main style={{ padding: "40px" }}>
        <h2>Browse Rentals</h2>
        <p>Filter by price, location, and property type to find your ideal rental.</p>
        {/* Rent page content goes here */}
      </main>
    </>
  );
};

export default Rent;
