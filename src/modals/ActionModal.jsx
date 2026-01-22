import React, { useState } from "react";
import { X, ChevronRight, ChevronLeft, Check, Calendar, MessageSquare, FileText } from "lucide-react";
import style from "../styles/ActionModal.module.css";
import dayjs from "dayjs";

const ActionModal = ({ type, listing, agentName, onClose, onSubmit }) => {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(0); // Index of selected date
  const [selectedTime, setSelectedTime] = useState("10:00 AM");
  const [tourDates, setTourDates] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: `I am interested in ${listing.address || 'this property'}.`,
    income: "", // For application
    creditScore: "" // For application
  });

  // Generate next 14 days for the Tour Picker
  React.useEffect(() => {
    const dates = [];
    for (let i = 0; i < 14; i++) {
      dates.push(dayjs().add(i, 'day'));
    }
    setTourDates(dates);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setStep(2); // Show success screen
    setTimeout(() => {
      onSubmit();
    }, 2000);
  };

  const handleScroll = (direction) => {
    const container = document.getElementById('date-scroller');
    if(container) {
        const scrollAmount = 200;
        container.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  // --- RENDER SUCCESS STATE ---
  if (step === 2) {
    return (
      <div className={style.overlay} onClick={onClose}>
        <div className={style.modal} onClick={e => e.stopPropagation()}>
          <div className={style.successState}>
            <div className={style.successIcon}>
                <Check size={40} color="white" />
            </div>
            <h3>Request Sent!</h3>
            <p>The {agentName ? 'agent' : 'owner'} has received your inquiry.</p>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER MAIN MODAL ---
  return (
    <div className={style.overlay} onClick={onClose}>
      <div className={style.modal} onClick={e => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className={style.header}>
            <h3>
                {type === 'tour' && "Request a tour"}
                {type === 'message' && "Contact Agent"}
                {type === 'application' && "Start Application"}
            </h3>
            <button onClick={onClose} className={style.closeBtn}><X size={20}/></button>
        </div>

        <div className={style.body}>
            {/* PROPERTY SUMMARY CARD (Like Screenshot) */}
            <div className={style.propertySummary}>
                <img 
                    src={listing.photos?.[0]?.url || listing.photos?.[0] || "/placeholder.png"} 
                    alt="Property" 
                    className={style.propThumb}
                />
                <div className={style.propDetails}>
                    <div className={style.propAddress}>
                        {listing.address}, {listing.city} {listing.zip_code}
                    </div>
                    <div className={style.propStats}>
                        <b>{listing.bedrooms}</b> bd | <b>{listing.bathrooms}</b> ba | <b>{listing.square_footage}</b> sqft
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                
                {/* --- TOUR SPECIFIC UI --- */}
                {type === 'tour' && (
                    <div className={style.tourSection}>
                        <div className={style.tipBox}>
                            <div className={style.bulbIcon}>💡</div>
                            <p>Tip: Selecting multiple times helps schedule your tour faster.</p>
                        </div>

                        <label className={style.sectionLabel}>Select a date</label>
                        
                        <div className={style.datePickerWrapper}>
                            <button type="button" className={style.scrollBtn} onClick={() => handleScroll('left')}><ChevronLeft size={20}/></button>
                            <div className={style.dateScroller} id="date-scroller">
                                {tourDates.map((date, index) => (
                                    <div 
                                        key={index} 
                                        className={`${style.dateCard} ${selectedDate === index ? style.activeDate : ''}`}
                                        onClick={() => setSelectedDate(index)}
                                    >
                                        <span className={style.dayName}>{index === 0 ? 'TODAY' : date.format('ddd').toUpperCase()}</span>
                                        <span className={style.dayNum}>{date.format('MMM D')}</span>
                                    </div>
                                ))}
                            </div>
                            <button type="button" className={style.scrollBtn} onClick={() => handleScroll('right')}><ChevronRight size={20}/></button>
                        </div>

                        <label className={style.sectionLabel}>Select a time</label>
                        <select 
                            className={style.selectInput} 
                            value={selectedTime} 
                            onChange={(e) => setSelectedTime(e.target.value)}
                        >
                            <option>9:00 AM</option>
                            <option>10:00 AM</option>
                            <option>11:00 AM</option>
                            <option>1:00 PM</option>
                            <option>2:00 PM</option>
                            <option>4:00 PM</option>
                            <option>5:00 PM</option>
                        </select>
                    </div>
                )}

                {/* --- CONTACT / APPLICATION FIELDS --- */}
                <div className={style.formFields}>
                    <div className={style.inputGroup}>
                        <label>Name <span className={style.required}>*</span></label>
                        <input 
                            type="text" 
                            required 
                            className={style.textInput} 
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                    
                    <div className={style.inputGroup}>
                        <label>Phone <span className={style.required}>*</span></label>
                        <input 
                            type="tel" 
                            required 
                            className={style.textInput} 
                            value={formData.phone}
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                        />
                    </div>

                    <div className={style.inputGroup}>
                        <label>Email <span className={style.required}>*</span></label>
                        <input 
                            type="email" 
                            required 
                            className={style.textInput} 
                            value={formData.email} // Pre-fill this if you have user data
                            onChange={e => setFormData({...formData, email: e.target.value})}
                        />
                    </div>

                    {/* Extra fields for Application */}
                    {type === 'application' && (
                         <div className={style.row}>
                            <div className={style.inputGroup}>
                                <label>Annual Income</label>
                                <input type="number" className={style.textInput} placeholder="$" />
                            </div>
                            <div className={style.inputGroup}>
                                <label>Credit Score</label>
                                <input type="number" className={style.textInput} placeholder="e.g. 720" />
                            </div>
                         </div>
                    )}

                    <div className={style.inputGroup}>
                        <label>Message</label>
                        <textarea 
                            rows={3}
                            className={style.textArea} 
                            value={formData.message}
                            onChange={e => setFormData({...formData, message: e.target.value})}
                        />
                    </div>
                </div>

                <div className={style.footer}>
                    <button type="submit" className={style.submitBtn}>
                        {type === 'tour' ? 'Request Tour' : type === 'application' ? 'Send Application' : 'Send Message'}
                    </button>
                    <p className={style.disclaimer}>
                        By pressing {type === 'tour' ? 'Request Tour' : 'Send'}, you agree that Keyvia and real estate professionals may call/text you about your inquiry.
                    </p>
                </div>

            </form>
        </div>
      </div>
    </div>
  );
};

export default ActionModal;