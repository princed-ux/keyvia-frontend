import React from "react";
import { Link } from "react-router-dom";
import HeaderWrapper from "../components/HeaderWrapper.jsx";
import style from "../styles/home.module.css";

import searchIcon from "../assets/vector-3.png";
import stars from "../assets/stars.png";
import base1 from "../assets/base-1.png";
import base2 from "../assets/base-2.png";
import homeBg from "../assets/Header.png";

const Home = () => {
  return (
    <>
      <HeaderWrapper backgroundImage={homeBg}>
        <h1 className={style.text}>Find your next home</h1>
        <p>Browse thousands of listings or pickup where you left off</p>
        <div className={style.searchBox}>
          <img className={style.searchIcon} src={searchIcon} alt="search" />
          <input
            className={style.input}
            type="text"
            placeholder="Enter an address, neighborhood, city, or ZIP code"
          />
          <button className={style.searchBtn}>
            <i style={{ color: "#fff" }} className="fa-solid fa-arrow-right"></i>
          </button>
        </div>
        <div style={{ marginTop: "30px" }}>
          <button className={style.getStartedBtn}>Get Started</button>
        </div>
      </HeaderWrapper>

      {/* rest of Home page sections */}
      <div style={{ marginLeft: "70px" }}>
        <div className={style.starsSection}>
          <img src={stars} alt="3-stars" />
        </div>
        <div>
          <h2 className={style.sectionTitle}>Explore Your Options</h2>
          <p className={style.sectionSubtitle}>Start your property journey here</p>
        </div>
        <section className={style.infoSection}>
          <div className={style.infoCard}>
            <img src={base1} alt="" />
            <h2>Buy a Home</h2>
            <p>Browse thousands of homes for sale</p>
            <Link className={style.links} to="/buy">
              Explore to Buy
              <i className={`${style.solid} fa-solid fa-arrow-right`}></i>
            </Link>
          </div>
          <div className={style.infoCard}>
            <img src={base2} alt="" />
            <h2>Sell a Home</h2>
            <p>List your property and reach potential buyers</p>
            <Link className={style.links} to="/sell">
              List Your Property
              <i className={`${style.solid} fa-solid fa-arrow-right`}></i>
            </Link>
          </div>
          <div className={style.infoCard}>
            <img src={base1} alt="" />
            <h2>Rent a Home</h2>
            <p>Find apartments and homes for rent</p>
            <Link className={style.links} to="/rent">
              Explore Rentals
              <i className={`${style.solid} fa-solid fa-arrow-right`}></i>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
};

export default Home;
