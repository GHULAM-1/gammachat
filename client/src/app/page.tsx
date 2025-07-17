'use client'
import { useEffect, useState } from 'react';

export default function Home() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:5001');

    socket.onopen = () => {
      console.log('Connected to WebSocket server');
    };

    socket.onmessage = (event) => {
      setMessage(event.data); // ✅ Display message in UI
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => socket.close();
  }, []);

  return (
    <div style={{ padding: 40 }}>
      <h1>WebSocket Test</h1>
      <p>
        <strong>Message from server:</strong> {message || 'Waiting...'}
      </p>
    </div>
  );
}