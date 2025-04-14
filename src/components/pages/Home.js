// Proprietary Software License
// Copyright (c) 2025 Mark Robertson
// See LICENSE.txt file for details.


import React, { useState, useEffect } from "react";
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
import styles from "./Home.module.css"
import bus from '../../Assets/Bus.png'

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
  const [isWaitingForEmailVerification, setIsWaitingForEmailVerification] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
  
        if (user.emailVerified) {
          try {
            const response = await fetch(`${API}/employees/firebase/${user.uid}`);
            if (response.ok) {
              const { data } = await response.json();
              setFirstName(data.first_name);
              setIsProfileComplete(!!data.first_name);
              setShowModal(!data.first_name); // Show modal if no profile exists
            } else if (response.status === 404) {
              console.log("No employee found, logging out.");
              throw new Error("Profile not found");
            } else {
              throw new Error("Unexpected error fetching profile.");
            }
          } catch (err) {
            console.error("Error fetching user profile:", err.message);
            alert("An error occurred while fetching your profile. Please log in again.");
            await signOut(auth);
            setCurrentUser(null);
            navigate("/"); // Redirect to login page
            return; // Exit early if an error occurs
          }
        } else {
          setIsWaitingForEmailVerification(true);
        }
      } else {
        setCurrentUser(null);
        setFirstName("");
        setIsProfileComplete(false);
        setShowModal(false);
      }
      setIsLoadingAuth(false);
    });
  
    return () => unsubscribe();
  }, [navigate]);
  

  useEffect(() => {
    if (currentUser && !currentUser.emailVerified) {
      const interval = setInterval(async () => {
        await currentUser.reload(); // Reload the user's info
        if (currentUser.emailVerified) {
          clearInterval(interval);
          setIsWaitingForEmailVerification(false);
          try {
            const response = await fetch(
              `${API}/employees/firebase/${currentUser.uid}`
            );
            if (response.ok) {
              const { data } = await response.json();
              setFirstName(data.first_name);
              setIsProfileComplete(!!data.first_name);
              setShowModal(!data.first_name); // Show modal if no profile exists
            } else {
              setShowModal(true); // Show modal if profile is missing
            }
          } catch (err) {
            console.error("Error fetching user profile:", err.message);
            setShowModal(true);
          }
        }
      }, 2000); // Check every 2 seconds

      return () => clearInterval(interval); // Cleanup on unmount
    }
  }, [currentUser]);


  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!isProfileComplete) {
        e.preventDefault();
        e.returnValue = "You cannot navigate away until your profile is saved.";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isProfileComplete]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (isLogin) {
        // Login user
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        console.log("Logged in:", userCredential.user);
        setEmail("");
        setPassword("");

        //const activeTimecard = localStorage.getItem("startDate");
        navigate("/createNewTimeCard");
      } else {
        // Sign up user
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        console.log("User created:", userCredential.user);

        await sendEmailVerification(userCredential.user);
        alert(
          "Thank you for signing up! A verification email has been sent to your inbox. Please verify your email before continuing."
        );

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

  const handleModalClose = () => {
    setShowModal(false);
    navigate("/createNewTimeCard"); 
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


  return (
    <div className={styles.hPage}>
      <div className="container mt-5">
        {isWaitingForEmailVerification && (
          <div className="text-center">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-3">
              Waiting for email verification.
            </p>
            <p className="mt-2">
              An email has been sent to your inbox with a verification link. Please open the email and click on the verification link to confirm your account.
            </p>
            <p className="mt-2">
              Once you verify your email, this page will automatically update, and you can proceed to complete your profile.
            </p>
            <p className="mt-2 text-muted">
              If you didn't receive the email, please check your spam or junk folder. You can also click the button below to resend the verification email.
            </p>
            <button className="btn btn-link" onClick={handleResendVerification}>
              Didn't get an email? Resend Verification Email
            </button>
            {resendMessage && (
              <p className="text-success mt-2">{resendMessage}</p>
            )}
          </div>
        )}
  
        {currentUser && !isWaitingForEmailVerification && (
          <div className="text-center">
            <h1>Hello {firstName || "User"}! You are currently logged in</h1>
            {showModal && !isProfileComplete && (
              <ProfileModal onClose={handleModalClose} />
            )}
            {isProfileComplete && (
              <button className="btn btn-danger mt-3" onClick={handleLogout}>
                Logout
              </button>
            )}
          </div>
        )}
  
        {!currentUser && !isWaitingForEmailVerification && (
          <>
            <h1 className="text-center mb-4">Please Login to access your account</h1>
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
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? "Switch to Sign Up" : "Switch to Login"}
              </button>
            </div>
          </>
        )}
  
        {/* Bus Image at the bottom */}
        <div style={{ position: "relative", zIndex: 10 }}>
        <img src={bus} alt="Bus" className={styles.busAnimation} style={{ width: "200px" }}/>
      </div>
      </div>
    </div>
  );
  
}

export default Home;
