import React from "react";
import { useNavigate } from "react-router-dom";
import { X, UserRoundCog, UserRoundPen, ArrowRightLeft } from "lucide-react";
import style from "../styles/AuthModal.module.css";
import { useAuth } from "../context/AuthProvider";
import { Link } from "react-router-dom";

const SwitchRoleModal = ({ onClose }) => {
  const navigate = useNavigate();
  let { user } = useAuth();

  const getSettingsLink = () => {
    if (!user) return "/login";
    if (user.role === "agent") return "/dashboard/settings/account";
    if (user.role === "owner") return "/owner/dashboard/settings/account";
    return "/settings";
  };

  return (
    <div className={style.overlay} onClick={onClose}>
      <div className={style.modal} onClick={(e) => e.stopPropagation()}>
        <button className={style.closeBtn} onClick={onClose}>
          <X size={24} />
        </button>

        <div className={style.iconWrapper}>
          <ArrowRightLeft size={40} className={style.shieldIcon} />
        </div>

        <h2>Switch Role?</h2>
        <p>Switch to a Buyer profile to perform this action.</p>

        <div className={style.actions}>
          <Link to={getSettingsLink()} className={style.settingsBtn} target="_blank" rel="noopener noreferrer">
            <UserRoundCog size={22} /> Go to Settings
          </Link>
        </div>

        <div className={style.footer}>
          <small>Change your role in settings, then re-login to take effect.</small>
        </div>
      </div>
    </div>
  );
};

export default SwitchRoleModal;
