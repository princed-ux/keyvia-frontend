import React, { useState } from "react";
import client from "../api/axios"; 
import { X, CheckCircle, Lock, User, DollarSign, Briefcase, Users, MapPin, Bed, Bath, Square } from "lucide-react";
import style from "../styles/ActionModals.module.css";
import Swal from "sweetalert2";

// Helper to get initials if no image
const getInitials = (name) => {
  return name ? name.charAt(0).toUpperCase() : "U";
};

const ApplicationModal = ({ listing, onClose, currentUser }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    annual_income: "",
    credit_score: "",
    move_in_date: "",
    occupants_count: 1,
    // Default message is set here
    message: `I am interested in ${listing.address}, ${listing.city}. Please review my application.`
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await client.post('/api/applications', {
        listing_id: listing.product_id,
        annual_income: Number(form.annual_income),
        credit_score: Number(form.credit_score),
        move_in_date: form.move_in_date,
        occupants_count: Number(form.occupants_count),
        message: form.message
      });

      setStep(2); 
      setTimeout(onClose, 2500);

    } catch (err) {
      console.error("Application Failed:", err);
      Swal.fire({
        icon: 'error',
        title: 'Application Failed',
        text: err.response?.data?.message || 'Something went wrong. Please try again.',
        confirmButtonColor: '#09707d'
      });
    } finally {
      setLoading(false);
    }
  };

  if (step === 2) {
    return (
      <div className={style.overlay}>
        <div className={style.modal}>
          <div className={style.successContainer}>
            <CheckCircle size={50} className={style.checkIcon} />
            <h3>Application Sent!</h3>
            <p>Your application has been sent to the {listing.agent ? 'agent' : 'owner'}.</p>
          </div>
        </div>
      </div>
    );
  }

  // Parse photos safely
  const coverImage = Array.isArray(listing.photos) 
    ? (listing.photos[0]?.url || listing.photos[0]) 
    : (JSON.parse(listing.photos || "[]")[0]?.url || "/placeholder.png");

  return (
    <div className={style.overlay} onClick={onClose}>
      <div className={style.modal} onClick={e => e.stopPropagation()}>
        <div className={style.header}>
          <h3>Apply for this Property</h3>
          <button onClick={onClose} className={style.closeBtn}><X size={20}/></button>
        </div>

        <div className={style.body}>
          
          {/* ✅ 1. PROPERTY CONTEXT CARD (Matches Screenshot) */}
          <div className={style.propertyContext} style={{display:'flex', gap:'15px', marginBottom:'20px', paddingBottom:'20px', borderBottom:'1px solid #f1f5f9'}}>
              <img 
                src={coverImage} 
                alt="Property" 
                style={{width:'100px', height:'80px', objectFit:'cover', borderRadius:'8px'}} 
              />
              <div style={{display:'flex', flexDirection:'column', justifyContent:'center'}}>
                  <h4 style={{margin:'0 0 4px 0', fontSize:'16px', color:'#1e293b'}}>{listing.address}</h4>
                  <p style={{margin:'0 0 8px 0', fontSize:'14px', color:'#64748b'}}>{listing.city}, {listing.country}</p>
                  <div style={{display:'flex', gap:'12px', fontSize:'13px', fontWeight:'600', color:'#334155'}}>
                      <span><strong>{listing.bedrooms}</strong> bd</span>
                      <span style={{color:'#cbd5e1'}}>|</span>
                      <span><strong>{listing.bathrooms}</strong> ba</span>
                      <span style={{color:'#cbd5e1'}}>|</span>
                      <span><strong>{Number(listing.square_footage).toLocaleString()}</strong> sqft</span>
                  </div>
              </div>
          </div>

          {/* ✅ 2. USER INFO BAR (Handles Avatar URL vs Initials) */}
          <div className={style.userInfoBar}>
            <div className={style.userAvatar}>
                {currentUser?.avatar_url ? (
                    <img src={currentUser.avatar_url} alt="User" style={{width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover'}} />
                ) : (
                    <div style={{width:'100%', height:'100%', borderRadius:'50%', background:'#09707D', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold'}}>
                        {getInitials(currentUser?.name)}
                    </div>
                )}
            </div>
            <div className={style.userDetails}>
                <span className={style.userName}>Applying as <strong>{currentUser?.name || "Guest"}</strong></span>
                <span className={style.userEmail}>{currentUser?.email}</span>
            </div>
            <Lock size={14} className={style.lockIcon}/>
          </div>

          <form onSubmit={handleSubmit}>
            <div className={style.gridRow}>
                {/* ANNUAL INCOME */}
                <div className={style.inputWrapper}>
                    <label className={style.label}>Annual Income ($)</label>
                    <div className={style.inputContainer}>
                        <input 
                            required type="number" min="0"
                            className={style.inputField}
                            value={form.annual_income}
                            onChange={e => setForm({...form, annual_income: e.target.value})}
                            placeholder="e.g. 85000"
                        />
                        <div className={style.inputIconRight}><DollarSign size={16}/></div>
                    </div>
                </div>

                {/* CREDIT SCORE */}
                <div className={style.inputWrapper}>
                    <label className={style.label}>Credit Score</label>
                    <div className={style.inputContainer}>
                        <input 
                            required type="number" min="300" max="850"
                            className={style.inputField}
                            value={form.credit_score}
                            onChange={e => setForm({...form, credit_score: e.target.value})}
                            placeholder="e.g. 720"
                        />
                        <div className={style.inputIconRight}><Briefcase size={16}/></div>
                    </div>
                </div>
            </div>

            <div className={style.gridRow}>
                {/* MOVE IN DATE */}
                <div className={style.inputWrapper}>
                    <label className={style.label}>Desired Move-in</label>
                    <div className={style.inputContainer}>
                        <input 
                            required type="date"
                            className={style.inputField}
                            value={form.move_in_date}
                            onChange={e => setForm({...form, move_in_date: e.target.value})}
                        />
                    </div>
                </div>

                {/* OCCUPANTS */}
                <div className={style.inputWrapper}>
                    <label className={style.label}>Occupants</label>
                    <div className={style.inputContainer}>
                        <input 
                            required type="number" min="1" max="10"
                            className={style.inputField}
                            value={form.occupants_count}
                            onChange={e => setForm({...form, occupants_count: e.target.value})}
                        />
                        <div className={style.inputIconRight}><Users size={16}/></div>
                    </div>
                </div>
            </div>

            {/* ✅ 3. MESSAGE (Read-Only / Not Clickable) */}
            <div className={style.inputWrapper}>
                <label className={style.label}>Message (Standard)</label>
                <textarea 
                    rows={2} 
                    className={style.textArea}
                    value={form.message}
                    readOnly // 👈 Prevents editing
                    style={{
                        backgroundColor: '#f8fafc', 
                        color: '#64748b', 
                        cursor: 'not-allowed', 
                        border: '1px solid #e2e8f0',
                        resize: 'none'
                    }}
                />
            </div>
            
            <div className={style.footer}>
                <button type="submit" className={style.nextBtn} disabled={loading}>
                    {loading ? "Sending..." : "Submit Application"}
                </button>
                <p className={style.disclaimer}>
                    By submitting, you agree to share your profile and financial summary with the agent.
                </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApplicationModal;