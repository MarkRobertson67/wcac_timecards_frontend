// Proprietary Software License
// Copyright (c) 2025 Mark Robertson
// See LICENSE.txt file for details.


import React, { useState, useEffect, useCallback } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "../../firebase/firebaseConfig";
import ProfileModal from "./ProfileModal/ProfileModal";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import styles from "./Home.module.css";
import bus from "../../Assets/Bus.png";

const API = process.env.REACT_APP_API_URL;

function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWaitingForEmailVerification, setIsWaitingForEmailVerification] =
    useState(false);
  const [isSignupSelected, setIsSignupSelected] = useState(false);

  const navigate = useNavigate();

  // helper to fetch profile and update state
  const fetchProfile = useCallback(
    async (uid) => {
      try {
        console.log("→ fetching profile for", uid);
        const res = await fetch(`${API}/employees/firebase/${uid}`);
        if (res.ok) {
          const { data } = await res.json();
          setFirstName(data.first_name);
          setIsProfileComplete(!!data.first_name);
          setShowModal(!data.first_name);
        } else if (res.status === 404) {
          setShowModal(true);
        } else {
          alert("Unexpected error. Please log in again.");
          await signOut(auth);
          navigate("/");
        }
      } catch (err) {
        console.error(err);
        alert("Error fetching profile. Please log in again.");
        await signOut(auth);
        navigate("/");
      }
    },
    // only re-create if API or navigate change
    [navigate]
  );

  useEffect(() => {
    let unsubscribe;
    let verificationInterval;

    unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoadingAuth(true);
      clearInterval(verificationInterval);

      if (user) {
        setCurrentUser(user);

        if (user.emailVerified) {
          // user already verified
          // switch the form back to Login view
          setIsWaitingForEmailVerification(false);
          setIsLogin(true);
          setIsSignupSelected(false);
          await fetchProfile(user.uid);
        } else {
          // start polling until they verify
          setIsWaitingForEmailVerification(true);
          verificationInterval = setInterval(async () => {
            await user.reload();
            if (user.emailVerified) {
              // once they verify, switch to Login view
              setIsLogin(true);
              clearInterval(verificationInterval);
              setIsWaitingForEmailVerification(false);
              await fetchProfile(user.uid);
            }
          }, 2000);
        }
      } else {
        // no user: reset everything
        setCurrentUser(null);
        setFirstName("");
        setIsProfileComplete(false);
        setShowModal(false);
        setIsWaitingForEmailVerification(false);
      }

      setIsLoadingAuth(false);
    });

    return () => {
      unsubscribe && unsubscribe();
      clearInterval(verificationInterval);
    };
  }, [navigate, fetchProfile]);

  // In Home.js, replace your handleSubmit with this:

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (isLogin) {
        // ── 1) Sign them in ──
        const { user } = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        console.log("Logged in:", user);

        // ── 2) Email must be verified ──
        if (!user.emailVerified) {
          alert("Please verify your email before logging in.");
          await signOut(auth);
          return;
        }

        // ── 3) Check for an existing profile record ──
        const res = await fetch(`${API}/employees/firebase/${user.uid}`);
        if (res.status === 404) {
          // No record → show the profile modal
          setCurrentUser(user);
          setShowModal(true);
          return;
        }

        // ── 4) We got a record, parse it ──
        const { data } = await res.json();
        if (!data.first_name) {
          // Record exists but missing first_name → show the modal
          setCurrentUser(user);
          setShowModal(true);
          return;
        }

        // ── 5) All good: load state & navigate ──
        setCurrentUser(user);
        setFirstName(data.first_name);
        setIsProfileComplete(true);
        navigate("/createNewTimeCard");
      } else {
        // ── Sign-up flow remains mostly the same ──
        const { user } = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        console.log("User created:", user);

        // Send verification e-mail and sign them back out
        await sendEmailVerification(user);
        alert(
          "Thank you for signing up! A verification email has been sent. " +
            "Once you verify, come back here to log in."
        );

        // Go into “waiting” mode and switch the form to LOGIN
        setIsLogin(true);
        setIsSignupSelected(false);
        setIsWaitingForEmailVerification(true);

        // await signOut(auth);

        // Reset form
        setEmail("");
        setPassword("");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      alert("Please enter your email and click forgot password.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset email sent. Please check your inbox.");
    } catch (err) {
      console.error("Error sending password reset email:", err.message);
      setError(err.message);
    }
  };

  const handleResendVerification = async () => {
    if (currentUser) {
      try {
        await sendEmailVerification(currentUser);
        setResendMessage("Verification email resent. Please check your inbox.");
      } catch (err) {
        setError("Failed to resend verification email.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setIsProfileComplete(false);
    } catch (err) {
      console.error("Error logging out:", err.message);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prevState) => !prevState);
  };

  if (isLoadingAuth) {
    return (
      <div className="text-center mt-4">
        <div className="spinner-border custom-spinner" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // This runs when the profile is successfully saved:
  const handleProfileSaved = async () => {
    setShowModal(false);
    // re-fetch so firstName/isProfileComplete update
    if (currentUser) await fetchProfile(currentUser.uid);
  };

  // This runs when the user clicks “Cancel” in the modal:
  const handleProfileCanceled = async () => {
    // drop them back to login
    await signOut(auth);
    setShowModal(false);
    setCurrentUser(null);
    setIsProfileComplete(false);
    setIsLogin(true);
    setIsSignupSelected(false);
  };

  return (
    <div className={styles.hPage}>
      <div className="container mt-5">
        {/* 1) Waiting for e-mail verification */}
        {isWaitingForEmailVerification && (
          <div className="text-center">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-3">Waiting for email verification.</p>
            <p className="mt-2">
              An email has been sent to your inbox with a verification link.
              Please open the email and click on the verification link to
              confirm your account.
            </p>
            <p className="mt-2">
              Once you verify your email, this page will automatically update,
              and you can proceed to complete your profile.
            </p>
            <p className="mt-2 text-muted">
              If you didn't receive the email, please check your spam or junk
              folder. You can also click the button below to resend the
              verification email.
            </p>
            <button className="btn btn-link" onClick={handleResendVerification}>
              Didn't get an email? Resend Verification Email
            </button>
            {resendMessage && (
              <p className="text-success mt-2">{resendMessage}</p>
            )}
          </div>
        )}

        {/* 2) Profile incomplete: show ONLY the modal */}
        {currentUser &&
          !isWaitingForEmailVerification &&
          showModal &&
          !isProfileComplete && (
            <ProfileModal
              onSave={handleProfileSaved}
              onCancel={handleProfileCanceled}
            />
          )}

        {/* 3) Profile complete: greeting + logout */}
        {currentUser &&
          !isWaitingForEmailVerification &&
          !showModal &&
          isProfileComplete && (
            <div className="text-center">
              <h1>Hello {firstName}! You are currently logged in</h1>
              <button className="btn btn-danger mt-3" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}

        {/* 4) No user: show login / sign-up form */}
        {!currentUser && !isWaitingForEmailVerification && !showModal && (
          <>
            <h1 className="text-center mb-4">
              Please Login to access your account
            </h1>
            <form
              onSubmit={handleSubmit}
              className="card p-3 mx-auto"
              style={{ maxWidth: "400px" }}
            >
              <div className="mb-3">
                <input
                  type="email"
                  className="form-control"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3 position-relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <FontAwesomeIcon
                  icon={showPassword ? faEyeSlash : faEye}
                  className="position-absolute top-50 end-0 translate-middle-y me-3"
                  style={{ cursor: "pointer" }}
                  onClick={togglePasswordVisibility}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : isLogin ? "Login" : "Sign Up"}
              </button>
              {isLogin && (
                <div className="text-center mt-2">
                  <button
                    type="button"
                    className="btn btn-link"
                    onClick={handleForgotPassword}
                  >
                    Forgot Password?
                  </button>
                </div>
              )}
              {error && <p className="text-danger mt-2">{error}</p>}
            </form>
            <div className="text-center mt-3">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setIsSignupSelected(!isSignupSelected);
                }}
              >
                {isLogin ? "Switch to Sign Up" : "Switch to Login"}
              </button>
            </div>
            <div className="text-center mt-3">
              <p className={`${isSignupSelected ? styles.flashingText : ""}`}>
                Before you create an account, please review the{" "}
                <a href="/tutorials">tutorials</a>.
              </p>
            </div>
          </>
        )}

        {/* Bus Image at the bottom */}
        <div>
          <img src={bus} alt="Bus" className={styles.busAnimation} />
        </div>
      </div>
    </div>
  );
}

export default Home;
