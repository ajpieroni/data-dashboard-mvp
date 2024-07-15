import React, { useState } from 'react';

function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
        type={showPassword ? 'text' : 'password'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter Password"
      />
      <label>
        <input
          type="checkbox"
          checked={showPassword}
          onChange={() => setShowPassword(!showPassword)}
        />
        Show Password
      </label>
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

export default Login;
