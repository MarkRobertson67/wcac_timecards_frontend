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
    <div style={{ textAlign: 'center' }}>
      <h1>Welcome to the Timecards Home Page</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">{isLogin ? 'Login' : 'Sign Up'}</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
      <button onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? 'Switch to Sign Up' : 'Switch to Login'}
      </button>
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