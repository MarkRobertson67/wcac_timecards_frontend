// Proprietary Software License
// Copyright (c) 2024 Mark Robertson
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


function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);


  const navigate = useNavigate();


  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe(); // Clean up listener
  }, []);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (isLogin) {

        // Login user
        console.log("Logging in...");
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        console.log("Logged in:", userCredential.user);
        setEmail("");
        setPassword("");
        navigate("/CreateNewTimecard");
      } else {

        // Sign up user
        console.log("Signing up...");
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        console.log("User created:", userCredential.user);

         // Send email verification for sign-up only
         await sendEmailVerification(userCredential.user);
         alert("A verification email has been sent to your email address. Please verify your email.");
 
        setShowModal(true);
        setEmail("");
        setPassword("");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      alert("Please enter your email and click reset your password.");
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
    console.log("Closing modal...");
    setShowModal(false);
    navigate("/CreateNewTimecard");
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      //alert("You have logged out.");
    } catch (err) {
      console.error("Error logging out:", err.message);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prevState) => !prevState);
  };


  useEffect(() => {
    console.log("Modal state updated:", showModal);
  }, [showModal]);


  return (
    <div className="container mt-5">
      {currentUser ? (
        <div className="text-center">
          <h1>Welcome Back, {currentUser.email}!</h1>
          {!currentUser.emailVerified && (
            <p className="text-warning">
              Your email is not verified. Please check your inbox.
            </p>
          )}
          <button className="btn btn-danger mt-3" onClick={handleLogout}>
            Logout
          </button>
        </div>
      ) : (
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
            <button type="submit" className="btn btn-primary w-100">
              {isLogin ? "Login" : "Sign Up"}
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
      {showModal && <ProfileModal onClose={handleModalClose} />}
    </div>
  );
}

export default Home;
