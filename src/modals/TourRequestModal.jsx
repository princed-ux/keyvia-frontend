import React, { useState } from "react";
import { X, Lightbulb, ChevronLeft, ChevronRight, PlusCircle, CheckCircle } from "lucide-react";
import style from "../styles/ActionModals.module.css";
import dayjs from "dayjs";

const TourRequestModal = ({ listing, onClose }) => {
  const [step, setStep] = useState(1);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedTime, setSelectedTime] = useState("10:00 AM");

  // Generate next 7 days
  const dates = Array.from({ length: 7 }, (_, i) => dayjs().add(i, 'day'));

  const handleSubmit = (e) => {
    e.preventDefault();
    // Logic to send tour request
    console.log("Tour Requested:", dates[selectedDateIndex].format('YYYY-MM-DD'), selectedTime);
    setStep(2);
    setTimeout(onClose, 2500);
  };

  const scrollDates = (dir) => {
    const el = document.getElementById('date-track');
    if (el) el.scrollBy({ left: dir === 'left' ? -100 : 100, behavior: 'smooth' });
  };

  if (step === 2) {
    return (
      <div className={style.overlay}>
        <div className={style.modal}>
          <div className={style.successContainer}>
            <CheckCircle size={50} className={style.checkIcon} />
            <h3>Tour Requested!</h3>
            <p>The owner will confirm your appointment shortly.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={style.overlay} onClick={onClose}>
      <div className={style.modal} onClick={e => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className={style.header}>
          <h3>Request a tour</h3>
          <button onClick={onClose} className={style.closeBtn}><X size={20}/></button>
        </div>

        <div className={style.body}>
          {/* PROPERTY CARD */}
          <div className={style.propertySummary}>
            <img src={listing.photos?.[0] || "/placeholder.png"} alt="Home" className={style.propThumb} />
            <div className={style.propInfo}>
              <h4>{listing.address || "Property Address"}</h4>
              <div className={style.propStats}>
                <b>{listing.bedrooms}</b> bd | <b>{listing.bathrooms}</b> ba | <b>{listing.square_footage}</b> sqft
              </div>
            </div>
          </div>

          {/* TIP BOX */}
          <div className={style.tipBox}>
            <Lightbulb size={20} className={style.bulbIcon} />
            <p>Tip: Selecting multiple times helps schedule your tour faster.</p>
          </div>

          {/* DATE PICKER */}
          <p className={style.sectionTitle}>Select a date</p>
          <div className={style.dateScrollerContainer}>
             <button type="button" className={style.scrollBtn} onClick={() => scrollDates('left')}><ChevronLeft/></button>
             <div id="date-track" className={style.dateTrack}>
                {dates.map((d, i) => (
                    <div 
                        key={i} 
                        className={`${style.dateCard} ${selectedDateIndex === i ? style.selected : ''}`}
                        onClick={() => setSelectedDateIndex(i)}
                    >
                        <span className={style.dayName}>{i === 0 ? 'TODAY' : d.format('ddd').toUpperCase()}</span>
                        <span className={style.dayNum}>{d.format('MMM D')}</span>
                    </div>
                ))}
             </div>
             <button type="button" className={style.scrollBtn} onClick={() => scrollDates('right')}><ChevronRight/></button>
          </div>

          {/* TIME PICKER */}
          <select 
            className={style.timeSelect} 
            value={selectedTime} 
            onChange={e => setSelectedTime(e.target.value)}
          >
            <option>9:00 AM</option>
            <option>10:00 AM</option>
            <option>11:00 AM</option>
            <option>1:00 PM</option>
            <option>2:00 PM</option>
            <option>4:00 PM</option>
            <option>6:00 PM</option>
          </select>

          <button type="button" className={style.addTimeBtn}>
            <PlusCircle size={18} /> Add a time
          </button>
        </div>

        {/* FOOTER */}
        <div className={style.footer}>
            <button className={style.nextBtn} onClick={handleSubmit}>Request Tour</button>
            <p className={style.disclaimer}>
                By pressing Next, you agree that Keyvia and real estate professionals may call/text you about your inquiry.
            </p>
        </div>
      </div>
    </div>
  );
};

export default TourRequestModal;