import logo from './logo.png';
import './App.css';
import Hubspot from './components/hubspot';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <p>
          Out in Tech: Staff Data Dashboard
          <Hubspot />
          <Eventbrite />
        </p>
        <img src={logo} className="App-logo" alt="logo" />
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
            © 2024 Out in Tech. All rights reserved.
          </p>
      </header>
    </div>
  );
}

export default App;
