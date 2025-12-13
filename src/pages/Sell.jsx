import React from "react";
import HeaderWrapper from "../components/HeaderWrapper.jsx";
import sellBg from "../assets/sellImg.png";
import style from "../styles/sell.module.css";
import rectangle_4793 from "../assets/rectangle-4793.png";
import base_1 from "../assets/base-1.png";
import base_2 from "../assets/base-2.png";

const Sell = () => {
  return (
    <>
      <HeaderWrapper backgroundImage={sellBg}>
        <h1>Sell Your Property</h1>
        <p>Reach thousands of buyers on Keyvia</p>
      </HeaderWrapper>

      <main className={style.homeMain}>
        <h1>Sell your Home With Confidence</h1>
        <p>We provide maximum visibility for your property with zero hassle.</p>

        <div>
          <button className={style.getStartedBtn}>Get Started</button>
        </div>

        <section className={style.howItWorksSection}>
          <h2>How It Works</h2>
          <div className={style.mainContainer}>
            <div>
              <img width={"700px"} src={rectangle_4793} alt="" />
            </div>
            <div className={style.mainSteps}>
              <div className={style.stepsContainer}>
              <div className={style.step}>
                <span>Step 1</span>
                <h4>Create Your Account</h4>
              </div>
            </div>
            <div className={style.stepsContainer}>
              <div className={style.step}>
                <span>Step 2</span>
                <h4>Add Property Details</h4>
              </div>
            </div>
            <div className={style.stepsContainer}>
              <div className={style.step}>
                <span>Step 3</span>
                <h4>Upload Photos & Pricing</h4>
              </div>
            </div>
            <div className={style.stepsContainer}>
              <div className={style.step}>
                <span>Step 4</span>
                <h4>Publish & Manage Offers</h4>
              </div>
            </div>
            </div>
          </div>
        </section>

        <section className={style.howItWorksSection}>
          <h2>Why Sell With Us</h2>

          <div className={style.whySellMain}>
            <div className={style.whySellContainer}>
              <div>
                <img src={base_1} alt="" />
              </div>
              <div className={style.whySellItem}>
                <h4>Wide Reach</h4>
                <p>
                  Listed across top platform and seen by qualified buyers</p>
              </div>
            </div>
            <div className={style.whySellContainer}>
              <div>
                <img src={base_2} alt="" />
              </div>
              <div className={style.whySellItem}>
                <h4>Fast Listing</h4>
                <p>
                  Create a listing in minutes </p>
              </div>
            </div>
            <div className={style.whySellContainer}>
              <div>
                <img src={base_1} alt="" />
              </div>
              <div className={style.whySellItem}>
                <h4>Expert Support</h4>
                <p>
                  Work with licensed agents or list independently </p>
              </div>
            </div>
            <div className={style.whySellContainer}>
              <div>
                <img src={base_2} alt="" />
              </div>
              <div className={style.whySellItem}>
                <h4>Real-Time Analytics</h4>
                <p>
                  Track views, interest, and offers </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
    </>
  );
};

export default Sell;
