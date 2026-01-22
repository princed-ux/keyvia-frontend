import React from "react";
import style from "../styles/ListingModal.module.css"; // Uses same styles
import { X } from "lucide-react";

const ListingModalSkeleton = ({ onClose }) => {
  return (
    <div className={style.overlay} onClick={onClose}>
      <div className={style.modalContainer} onClick={(e) => e.stopPropagation()} style={{overflow: 'hidden'}}>
        
        {/* Fake Header */}
        <div className={style.topControls} style={{borderBottom: '1px solid #eee'}}>
            <div className={style.skeleton} style={{width: '100px', height: '20px', borderRadius: '4px'}}></div>
            <div className={style.skeleton} style={{width: '80px', height: '30px', borderRadius: '4px'}}></div>
            <button className={style.closeIconBtn} onClick={onClose}><X size={20} /></button>
        </div>

        {/* Fake Image Grid */}
        <div className={style.imageGrid} style={{opacity: 0.7}}>
            <div className={`${style.mainImage} ${style.skeleton}`}></div>
            <div className={style.subImages}>
                <div className={`${style.imageWrapper} ${style.skeleton}`}></div>
                <div className={`${style.imageWrapper} ${style.skeleton}`}></div>
                <div className={`${style.imageWrapper} ${style.skeleton}`}></div>
                <div className={`${style.imageWrapper} ${style.skeleton}`}></div>
            </div>
        </div>

        <div className={style.contentLayout}>
            {/* Fake Details (Left) */}
            <div className={style.leftColumn}>
                <div className={style.skeleton} style={{width: '60%', height: '40px', marginBottom: '10px'}}></div>
                <div className={style.skeleton} style={{width: '40%', height: '20px', marginBottom: '30px'}}></div>
                
                <div style={{display: 'flex', gap: '20px', marginBottom: '30px'}}>
                    <div className={style.skeleton} style={{width: '80px', height: '60px', borderRadius: '8px'}}></div>
                    <div className={style.skeleton} style={{width: '80px', height: '60px', borderRadius: '8px'}}></div>
                    <div className={style.skeleton} style={{width: '80px', height: '60px', borderRadius: '8px'}}></div>
                </div>

                <div className={style.skeleton} style={{width: '100%', height: '150px', borderRadius: '8px'}}></div>
            </div>

            {/* Fake Agent Sidebar (Right) */}
            <div className={style.rightColumn}>
                <div className={style.stickyCard} style={{height: '300px'}}>
                    <div style={{display: 'flex', gap: '15px', marginBottom: '20px'}}>
                        <div className={style.skeleton} style={{width: '60px', height: '60px', borderRadius: '50%'}}></div>
                        <div style={{flex: 1}}>
                            <div className={style.skeleton} style={{width: '80%', height: '20px', marginBottom: '8px'}}></div>
                            <div className={style.skeleton} style={{width: '50%', height: '15px'}}></div>
                        </div>
                    </div>
                    <div className={style.skeleton} style={{width: '100%', height: '45px', borderRadius: '8px', marginBottom: '10px'}}></div>
                    <div className={style.skeleton} style={{width: '100%', height: '45px', borderRadius: '8px'}}></div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ListingModalSkeleton;