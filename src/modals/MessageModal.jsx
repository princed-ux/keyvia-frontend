import React, { useState, useEffect } from "react";
import { X, CheckCircle, Mail, User } from "lucide-react";
import style from "../styles/ActionModals.module.css";

const MessageModal = ({ listing, onClose, currentUser }) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: `I am interested in ${listing.address}. Is it still available?`
  });

  useEffect(() => {
    if (currentUser) {
      setForm(prev => ({ ...prev, name: currentUser.name || "", email: currentUser.email || "" }));
    }
  }, [currentUser]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Message Sent:", form);
    setStep(2);
    setTimeout(onClose, 2500);
  };

  if (step === 2) {
    return (
      <div className={style.overlay}>
        <div className={style.modal}>
          <div className={style.successContainer}>
            <CheckCircle size={50} className={style.checkIcon} />
            <h3>Message Sent</h3>
            <p>The {listing.agent ? 'agent' : 'owner'} will respond to your email.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={style.overlay} onClick={onClose}>
      <div className={style.modal} onClick={e => e.stopPropagation()}>
        <div className={style.header}>
          <h3>Contact {listing.agent ? 'Agent' : 'Owner'}</h3>
          <button onClick={onClose} className={style.closeBtn}><X size={20}/></button>
        </div>

        <div className={style.body}>
            <div className={style.propertySummary}>
                <img src={listing.photos?.[0] || "/placeholder.png"} alt="Home" className={style.propThumb} />
                <div className={style.propInfo}>
                    <h4>{listing.address}</h4>
                    <div className={style.propStats}>${Number(listing.price).toLocaleString()}</div>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className={style.inputWrapper}>
                    <label className={style.label}>Name</label>
                    <div className={style.inputContainer}>
                        <input required type="text" className={style.inputField} value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                        <div className={style.inputIconRight}><User size={16}/></div>
                    </div>
                </div>
                <div className={style.inputWrapper}>
                    <label className={style.label}>Email</label>
                    <div className={style.inputContainer}>
                        <input required type="email" className={style.inputField} value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                        <div className={style.inputIconRight}><Mail size={16}/></div>
                    </div>
                </div>
                <div className={style.inputWrapper}>
                    <label className={style.label}>Message</label>
                    <textarea required rows={4} className={style.textArea} value={form.message} onChange={e => setForm({...form, message: e.target.value})} />
                </div>
            </form>
        </div>

        <div className={style.footer}>
            <button className={style.nextBtn} onClick={handleSubmit}>Send Message</button>
        </div>
      </div>
    </div>
  );
};

export default MessageModal;