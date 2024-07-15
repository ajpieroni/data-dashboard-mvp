import React, { useState } from 'react';

function Login({ onLogin }) {
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    const correctPassword = 'OITstaff'; 
    if (password === correctPassword) {
      onLogin(true);
    } else {
      alert('Incorrect password');
    }
  };

  return (
    <div className="Login">
      <h2>Password Protected Area</h2>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter Password"
      />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

export default Login;
