import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import style from "../styles/Settings.module.css";

const Settings = () => {
  return (
    <>
      <div className={style.settingsNav}>
        <NavLink
          to="account"
          className={({ isActive }) =>
            isActive ? `${style.link} ${style.active}` : style.link
          }
        > <i className="fa-regular fa-user"></i>
          Account Settings
        </NavLink>

        <NavLink
          to="notifications"
          className={({ isActive }) =>
            isActive ? `${style.link} ${style.active}` : style.link
          }
        > <i className="fa-regular fa-bell"></i>
          Notification Preferences
        </NavLink>

        <NavLink
          to="language&region"
          className={({ isActive }) =>
            isActive ? `${style.link} ${style.active}` : style.link
          }
        > <i className="fa-solid fa-globe"></i>
          Language & Region
        </NavLink>

        <NavLink
          to="privacy&security"
          className={({ isActive }) =>
            isActive ? `${style.link} ${style.active}` : style.link
          }
        > <i className="fa-solid fa-lock"></i>
          Privacy & Security
        </NavLink>

        <NavLink
          to="listings"
          className={({ isActive }) =>
            isActive ? `${style.link} ${style.active}` : style.link
          }
        > <i className="fa-regular fa-folder"></i>
          Manage Listings / Data
        </NavLink>
      </div>

      <div className={style.settingsContent}>
        <Outlet />
      </div>
    </>
  );
};

export default Settings;
