import './App.css';

import React, { useEffect, useState } from 'react';

function App() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/somedata')
      .then(response => response.json())
      .then(json => setData(json));
  }, []);

  return (
    <div>
      <h1>Smart Urban Planning Dashboard</h1>
      <p>{data ? data.message : 'Loading...'}</p>
    </div>
  );
}

export default App;
