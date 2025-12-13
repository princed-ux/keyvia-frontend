import React, { useState } from "react";
import style from "../styles/AccountSettings.module.css";
import defaultAvatar from "../assets/person.png";

const AccountSettings = () => {
  const [formData, setFormData] = useState({
    name: "John Doe",
    email: "johndoe@email.com",
    phone: "+1 234 567 890",
  });

  const [avatar, setAvatar] = useState(defaultAvatar);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => setAvatar(ev.target.result);
    reader.readAsDataURL(file);

    setSelectedFile(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // 🟦 Replace with API call or context update
    alert("Changes saved successfully!");
  };

  return (
    <div className={style.container}>
      <h2 className={style.heading}>Account Settings</h2>

      <form onSubmit={handleSubmit} className={style.form}>
        {/* Profile Picture */}
        <div className={style.avatarSection}>
          <img src={avatar} alt="Profile" className={style.avatar} />
          <label htmlFor="avatarInput" className={style.avatarLabel}>
            Change Photo
          </label>
          <input
            id="avatarInput"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className={style.fileInput}
          />
        </div>

        {/* Fields */}
        <div className={style.formGroup}>
          <label htmlFor="name">Full Name</label>
          <input
            id="name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className={style.formGroup}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className={style.formGroup}>
          <label htmlFor="phone">Phone Number</label>
          <input
            id="phone"
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>

        <button type="submit" className={style.saveBtn}>
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default AccountSettings;
