import React, { useState } from "react";
import { useAuth } from "../context/AuthProvider";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import style from "../styles/signup.module.css";
import house from "../assets/tallbuildings.jpg";
import { 
  User, Mail, Lock, Eye, EyeOff, 
  CheckCircle2, Circle, Loader2, ShieldCheck 
} from "lucide-react"; 

const Signup = () => {
  const { signupStart } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showRequirements, setShowRequirements] = useState(false); // Controls visibility

  // Password Criteria
  const [criteria, setCriteria] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "password") {
      setCriteria({
        length: value.length >= 8,
        upper: /[A-Z]/.test(value),
        lower: /[a-z]/.test(value),
        number: /[0-9]/.test(value),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(value)
      });
    }
  };

  const validate = () => {
    if (!formData.name.trim()) return "Full Name is required.";
    if (!formData.email.trim()) return "Email is required.";
    if (!/\S+@\S+\.\S+/.test(formData.email)) return "Invalid email format.";
    
    const allMet = Object.values(criteria).every(Boolean);
    if (!allMet) return "Please meet all password requirements.";

    if (!termsAccepted) return "You must agree to the Terms & Conditions.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return Swal.fire({ 
        icon: "warning", 
        title: "Action Required", 
        text: err,
        confirmButtonColor: "#09707D"
    });

    setSubmitting(true);
    try {
      await signupStart(formData.name, formData.email, formData.password);
    } catch (error) {
       console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={style.container}>
      <div className={style.left}>
        <div className={style.imageOverlay}>
            <div className={style.overlayContent}>
                <h2>Building the Future.</h2>
                <p>Join thousands of agents and owners on the #1 property platform.</p>
            </div>
        </div>
        <img src={house} alt="Modern Architecture" className={style.sideImage} />
      </div>

      <div className={style.right}>
        <form onSubmit={handleSubmit} className={style.form} noValidate>
          
          <div className={style.headerSection}>
            <div className={style.iconCircle}>
                <ShieldCheck size={28} />
            </div>
            <h2>Create Account</h2>
            <p className="text-muted">Enter your details to unlock Keyvia.</p>
          </div>

          <div className={style.inputContainer}>
            <label className={style.label}>Full Name</label>
            <div className={style.inputWrapper}>
              <User size={20} className={style.inputIcon} />
              <input
                name="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                className={style.emailInput}
              />
            </div>
          </div>

          <div className={style.inputContainer}>
            <label className={style.label}>Email Address</label>
            <div className={style.inputWrapper}>
              <Mail size={20} className={style.inputIcon} />
              <input
                name="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange}
                className={style.emailInput}
              />
            </div>
          </div>

          {/* Password Section */}
          <div className={style.inputContainer} style={{ position: 'relative' }}>
            <label className={style.label}>Password</label>
            <div className={style.inputWrapper}>
              <Lock size={20} className={style.inputIcon} />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setShowRequirements(true)} // Show on click
                onBlur={() => setShowRequirements(false)} // Hide on click away
                className={style.emailInput}
              />
              <button
                type="button"
                className={style.eyeToggle}
                onMouseDown={(e) => e.preventDefault()} // Prevents focus loss when clicking eye
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* ✅ FLOATING REQUIREMENT BOX */}
            {showRequirements && (
                <div className={style.requirementBox}>
                    <p className={style.reqTitle}>Your password must contain:</p>
                    <ul className={style.reqList}>
                        <li className={criteria.length ? style.met : style.unmet}>
                            {criteria.length ? <CheckCircle2 size={14} /> : <Circle size={14} />} At least 8 characters
                        </li>
                        <li className={criteria.upper ? style.met : style.unmet}>
                            {criteria.upper ? <CheckCircle2 size={14} /> : <Circle size={14} />} An uppercase letter
                        </li>
                        <li className={criteria.lower ? style.met : style.unmet}>
                            {criteria.lower ? <CheckCircle2 size={14} /> : <Circle size={14} />} A lowercase letter
                        </li>
                        <li className={criteria.number ? style.met : style.unmet}>
                            {criteria.number ? <CheckCircle2 size={14} /> : <Circle size={14} />} A number
                        </li>
                        <li className={criteria.special ? style.met : style.unmet}>
                            {criteria.special ? <CheckCircle2 size={14} /> : <Circle size={14} />} A special character
                        </li>
                    </ul>
                </div>
            )}
          </div>

          <div className={style.termsContainer}>
             <label className={style.checkboxLabel}>
                <input 
                    type="checkbox" 
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                />
                <span className={style.customCheckbox}></span>
                <span className={style.termsText}>
                    I agree to the <Link to="/terms">Terms & Conditions</Link>.
                </span>
             </label>
          </div>

          <button type="submit" className={style.button} disabled={submitting}>
            {submitting ? (
                <div className={style.loadingContent}>
                    <Loader2 size={20} className={style.spinner} /> 
                    <span>Creating Profile...</span>
                </div>
            ) : (
                "Sign Up"
            )}
          </button>

          <p className={style.login}>
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;