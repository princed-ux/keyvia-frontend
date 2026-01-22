// ../components/AuthModal.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { X, LogIn, UserPlus, ShieldCheck } from "lucide-react";
import style from "../styles/AuthModal.module.css";

const AuthModal = ({ onClose }) => {
  const navigate = useNavigate();

  return (
    <div className={style.overlay} onClick={onClose}>
      <div className={style.modal} onClick={(e) => e.stopPropagation()}>
        <button className={style.closeBtn} onClick={onClose}>
          <X size={24} />
        </button>

        <div className={style.iconWrapper}>
          <ShieldCheck size={40} className={style.shieldIcon} />
        </div>

        <h2>Start a Conversation</h2>
        <p>Please log in or create an account to contact this agent securely.</p>

        <div className={style.actions}>
          <button 
            className={style.loginBtn} 
            onClick={() => navigate('/login')}
          >
            <LogIn size={18} /> Log In
          </button>
          
          <button 
            className={style.signupBtn} 
            onClick={() => navigate('/signup')}
          >
            <UserPlus size={18} /> Sign Up
          </button>
        </div>

        <div className={style.footer}>
          <small>Safe & Secure Messaging</small>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;