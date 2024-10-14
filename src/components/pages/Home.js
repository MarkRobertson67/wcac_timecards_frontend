// Proprietary Software License
// Copyright (c) 2024 Mark Robertson
// See LICENSE.txt file for details.

import React, { useState } from 'react';

function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`http://localhost:3535/api/${isLogin ? 'login' : 'signup'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Failed to authenticate');
      }

      const data = await response.json();
      // Handle success (e.g., redirect user or save auth token)
      console.log(data);

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">Welcome to the Timecards Home Page</h1>
      <form onSubmit={handleSubmit} className="card p-3 mx-auto" style={{ maxWidth: '400px' }}>
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
        <div className="mb-3">
          <input
            type="password"
            className="form-control"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary w-100">
          {isLogin ? 'Login' : 'Sign Up'}
        </button>
        {error && <p className="text-danger">{error}</p>}
      </form>
      <div className="text-center mt-3">
        <button className="btn btn-secondary" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Switch to Sign Up' : 'Switch to Login'}
        </button>
      </div>
    </div>
  );
}

export default Home;








// function Home() {

//     return(
//     <div>
//     <br></br>
//     <br></br>
//     <h1 style={{ textAlign: 'center' }}>Welcome to the timecards home page</h1>
//     </div>
//     )
//     }
    
    
//     export default Home;