import React, { useEffect, useState, useMemo } from "react";
import { getNames } from "country-list";
import Swal from "sweetalert2";
import client from "../api/axios";
import styles from "../styles/profile.module.css";
import defaultPerson from "../assets/person.png";
import { useAuth } from "../context/AuthProvider.jsx";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Camera,
  Save,
  X,
  Home,
  DollarSign,
  CheckCircle2,
} from "lucide-react";

const BuyerProfile = () => {
  const { user, updateUser } = useAuth();

  /* ------------------ Countries ------------------ */
  const countries = useMemo(() => {
    return Array.from(new Set(getNames())).sort((a, b) =>
      a.localeCompare(b)
    );
  }, []);

  /* ------------------ Form State ------------------ */
  const [form, setForm] = useState({
    username: "",
    full_name: user?.name || "",
    email: user?.email || "",
    phone: "",
    gender: "",
    country: "",
    city: "",
    bio: "",

    // Buyer Preferences
    preferred_location: "",
    budget_min: "",
    budget_max: "",
    property_type: "",
    move_in_date: "",
  });

  const [initialForm, setInitialForm] = useState({});
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [remoteAvatarUrl, setRemoteAvatarUrl] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [showImageModal, setShowImageModal] = useState(false);

  /* ------------------ Fetch Profile ------------------ */
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await client.get("/api/profile");
      const data = res.data;

      const profileData = {
        username: data.username ?? "",
        full_name: data.full_name ?? user?.name ?? "",
        email: data.email ?? user?.email ?? "",
        phone: data.phone ?? "",
        gender: data.gender ?? "",
        country: data.country ?? "",
        city: data.city ?? "",
        bio: data.bio ?? "",
        preferred_location: data.preferred_location ?? "",
        budget_min: data.budget_min ?? "",
        budget_max: data.budget_max ?? "",
        property_type: data.property_type ?? "",
        move_in_date: data.move_in_date ?? "",
      };

      setForm(profileData);
      setInitialForm(profileData);
      setRemoteAvatarUrl(data.avatar_url || null);

      updateUser({
        name: profileData.full_name,
        avatar_url: data.avatar_url || null,
      });
    } catch (err) {
      console.error("Profile fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line
  }, []);

  /* ------------------ Avatar Handling ------------------ */
  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const onSelectAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      Swal.fire("Invalid file", "Please select an image.", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire("Too large", "Image must be under 5MB.", "error");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  /* ------------------ Form Logic ------------------ */
  const onChange = (e) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = "Required";
    if (!form.phone.trim()) e.phone = "Required";
    if (!form.country) e.country = "Required";
    if (!form.city.trim()) e.city = "Required";

    if (
      form.budget_min &&
      form.budget_max &&
      Number(form.budget_min) > Number(form.budget_max)
    ) {
      Swal.fire(
        "Invalid Budget",
        "Minimum budget cannot exceed maximum budget.",
        "error"
      );
      return false;
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);

        const avatarRes = await client.put("/api/avatar", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const newAvatarUrl = avatarRes.data.avatar_url;
        setRemoteAvatarUrl(newAvatarUrl);
        setAvatarFile(null);
        updateUser({ avatar_url: newAvatarUrl });
      }

      const res = await client.put("/api/profile", form);
      const updatedProfile = res.data.profile;

      setForm(updatedProfile);
      setInitialForm(updatedProfile);
      setEditing(false);
      updateUser({ name: updatedProfile.full_name });

      Swal.fire({
        icon: "success",
        title: "Profile Updated",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire("Error", "Failed to update profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  const onCancel = () => {
    setEditing(false);
    setForm(initialForm);
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const renderInput = (id, label, icon, type = "text", disabled = false) => (
    <div className={styles.inputGroup}>
      <label className={styles.label}>
        {icon} {label}
      </label>
      <input
        id={id}
        type={type}
        className={styles.input}
        value={form[id] || ""}
        onChange={onChange}
        disabled={!editing || disabled}
      />
    </div>
  );

  /* ------------------ UI ------------------ */
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Buyer Profile</h1>
          <p>Manage your account and home-buying preferences</p>
        </div>
      </div>

      <div className={styles.layout}>
        {/* Sidebar */}
        <div className={styles.sidebar}>
          <div className={styles.avatarCard}>
            <div className={styles.avatarWrapper}>
              <img
                src={avatarPreview || remoteAvatarUrl || defaultPerson}
                alt="Avatar"
                className={styles.avatar}
                onClick={() => setShowImageModal(true)}
              />
              {editing && (
                <label className={styles.cameraBtn}>
                  <Camera size={18} />
                  <input type="file" hidden onChange={onSelectAvatar} />
                </label>
              )}
            </div>

            <h2 className={styles.userName}>{form.full_name}</h2>
            <p className={styles.userRole}>Home Buyer</p>

            <div className={styles.locationTag}>
              <MapPin size={14} />
              {form.city || "City"}, {form.country || "Country"}
            </div>

            {/* <div className={styles.statusBadge}>Active Buyer</div> */}

            <button
              className={editing ? styles.cancelBtn : styles.editBtn}
              onClick={editing ? onCancel : () => setEditing(true)}
              disabled={saving}
            >
              {editing ? <><X size={18}/> Cancel</> : <><User size={18}/> Edit Profile</>}
            </button>

            {editing && (
              <button className={styles.saveBtn} onClick={onSave}>
                <Save size={18}/> Save Changes
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className={styles.content}>
          <div className={styles.sectionHeader}>
            <h3><User size={18}/> Personal Information</h3>
          </div>

          <div className={styles.formGrid}>
            {renderInput("full_name", "Full Name", <User size={16} />)}
            {renderInput("username", "Username", <User size={16} />)}
            {renderInput("email", "Email", <Mail size={16} />, "email", true)}
            {renderInput("phone", "Phone", <Phone size={16} />)}
            {renderInput("city", "City", <MapPin size={16} />)}

            <div className={styles.inputGroup}>
              <label className={styles.label}><Globe size={16}/> Country</label>
              <select
                id="country"
                className={styles.select}
                value={form.country}
                onChange={onChange}
                disabled={!editing}
              >
                <option value="">Select Country</option>
                {countries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.sectionHeader} style={{ marginTop: 30 }}>
            <h3><Home size={18}/> Buying Preferences</h3>
          </div>

          <div className={styles.formGrid}>
            {renderInput("budget_min", "Minimum Budget", <DollarSign size={16} />, "number")}
            {renderInput("budget_max", "Maximum Budget", <DollarSign size={16} />, "number")}

            <div className={styles.inputGroup}>
              <label className={styles.label}><Home size={16}/> Property Type</label>
              <select
                id="property_type"
                className={styles.select}
                value={form.property_type}
                onChange={onChange}
                disabled={!editing}
              >
                <option value="">Select Property Type</option>
                <option value="Apartment">Apartment</option>
                <option value="Duplex">Duplex</option>
                <option value="Detached House">Detached House</option>
                <option value="Bungalow">Bungalow</option>
                <option value="Land">Land</option>
              </select>
            </div>

            {renderInput("preferred_location", "Preferred Areas", <MapPin size={16} />)}
            {renderInput("move_in_date", "Target Move-in Date", <CheckCircle2 size={16} />, "date")}
          </div>

          <div className={styles.preferenceSummary}>
            <h4>Search Summary</h4>
            <p>
              {form.property_type || "Any property"} in{" "}
              {form.preferred_location || "any location"} between{" "}
              {form.budget_min || "any"} – {form.budget_max || "any"}
            </p>
          </div>

          <div className={styles.inputGroupFull}>
            <label className={styles.label}>About Me (Optional)</label>
            <textarea
              id="bio"
              rows={4}
              className={styles.textarea}
              value={form.bio}
              onChange={onChange}
              disabled={!editing}
              placeholder="Tell agents what you're looking for..."
            />
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div className={styles.modalOverlay} onClick={() => setShowImageModal(false)}>
          <div className={styles.modalContent}>
            <img src={avatarPreview || remoteAvatarUrl || defaultPerson} alt="Full" />
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerProfile;
