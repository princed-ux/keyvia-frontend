import React from "react";
import Navbar from "../layout/Navbar.jsx";
import style from "../styles/headerWrapper.module.css";

const HeaderWrapper = ({ backgroundImage, children }) => {
  return (
    <div
      className={style.pageWrapper}
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <Navbar />
      <main className={style.homeMain}>{children}</main>
    </div>
  );
};

export default HeaderWrapper;
