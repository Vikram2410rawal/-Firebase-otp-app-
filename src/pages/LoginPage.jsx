// src/pages/LoginPage.jsx
import { useState, useRef, useEffect } from "react";
import { auth } from "../firebase";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import styles from "./LoginPage.module.css";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState("phone"); // "phone" | "otp"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const confirmationRef = useRef(null);
  const otpRefs = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      // Cleanup recaptcha on unmount
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const startResendTimer = () => {
    setResendTimer(30);
    timerRef.current = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
          callback: () => {},
          "expired-callback": () => {
            setError("reCAPTCHA expired. Please try again.");
          },
        }
      );
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    const cleaned = phone.trim();
    if (!cleaned || cleaned.length < 10) {
      setError("Enter a valid phone number with country code (e.g. +91XXXXXXXXXX)");
      return;
    }
    setLoading(true);
    try {
      setupRecaptcha();
      const confirmation = await signInWithPhoneNumber(
        auth,
        cleaned,
        window.recaptchaVerifier
      );
      confirmationRef.current = confirmation;
      setStep("otp");
      startResendTimer();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to send OTP. Check the number & try again.");
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (idx, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) {
      otpRefs.current[idx + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && idx > 0) otpRefs.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs.current[5]?.focus();
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      setError("Enter all 6 digits.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await confirmationRef.current.confirm(code);
      // onAuthStateChanged in AuthContext will handle token storage
    } catch (err) {
      console.error(err);
      setError("Invalid OTP. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setOtp(["", "", "", "", "", ""]);
    setError("");
    setLoading(true);
    try {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
      setupRecaptcha();
      const confirmation = await signInWithPhoneNumber(
        auth,
        phone.trim(),
        window.recaptchaVerifier
      );
      confirmationRef.current = confirmation;
      startResendTimer();
    } catch (err) {
      setError(err.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.glow1} />
      <div className={styles.glow2} />

      <div className={styles.card}>
        <div className={styles.logoRow}>
          <span className={styles.logoIcon}>◈</span>
          <span className={styles.logoText}>AUTHWAVE</span>
        </div>

        {step === "phone" ? (
          <>
            <h1 className={styles.title}>Sign In</h1>
            <p className={styles.sub}>
              We'll send a one-time code to verify your number.
            </p>
            <form onSubmit={handleSendOtp} className={styles.form}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Phone Number</label>
                <input
                  type="tel"
                  className={styles.input}
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
                <span className={styles.hint}>Include country code (e.g. +91 for India)</span>
              </div>

              {error && <p className={styles.error}>{error}</p>}

              <button
                type="submit"
                className={styles.btn}
                disabled={loading}
              >
                {loading ? (
                  <span className={styles.spinner} />
                ) : (
                  <>Send OTP <span className={styles.arrow}>→</span></>
                )}
              </button>
            </form>
          </>
        ) : (
          <>
            <button
              className={styles.back}
              onClick={() => { setStep("phone"); setError(""); setOtp(["","","","","",""]); }}
            >
              ← Back
            </button>
            <h1 className={styles.title}>Enter Code</h1>
            <p className={styles.sub}>
              6-digit code sent to <strong>{phone}</strong>
            </p>

            <form onSubmit={handleVerifyOtp} className={styles.form}>
              <div className={styles.otpRow} onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (otpRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className={`${styles.otpBox} ${digit ? styles.filled : ""}`}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    disabled={loading}
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              {error && <p className={styles.error}>{error}</p>}

              <button
                type="submit"
                className={styles.btn}
                disabled={loading || otp.join("").length < 6}
              >
                {loading ? (
                  <span className={styles.spinner} />
                ) : (
                  <>Verify & Sign In <span className={styles.arrow}>→</span></>
                )}
              </button>

              <button
                type="button"
                className={styles.resendBtn}
                onClick={handleResend}
                disabled={resendTimer > 0 || loading}
              >
                {resendTimer > 0
                  ? `Resend in ${resendTimer}s`
                  : "Resend Code"}
              </button>
            </form>
          </>
        )}
      </div>

      {/* Invisible reCAPTCHA mount point */}
      <div id="recaptcha-container" />
    </div>
  );
}
