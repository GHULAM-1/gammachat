'use client'
import { useEffect, useState, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';

type Message = {
  email: string;
  name: string;
  message: string;
  timestamp: string;
  avatarUrl?: string;
}

export default function Home() {
  const { user } = useUser();
  const [currentMessage, setCurrentMessage] = useState<Message>({email: '', name: '', message: '', timestamp: '', avatarUrl: ''});
  const [messages, setMessages] = useState<Message[]>([]);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
     const ws = new WebSocket('ws://localhost:5001');

    ws.onopen = () => {
      console.log('Connected to WebSocket server');
    };

  
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    ws.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        console.log('Received message:', parsedData);
        
        switch (parsedData.type) {
          case 'welcome':
            console.log('Welcome message:', parsedData.message);
            break;
            
          case 'messages_update':
            console.log('Messages updated:', parsedData.messages);
            setMessages(parsedData.messages);
            break;
            
          default:
            console.log('Unknown message type:', parsedData.type);
        }
      } catch (error) {
        console.log('Received non-JSON message:', event.data);
      }
    };

      setSocket(ws);
    return () => ws.close();
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Register user when both socket and user are available
  useEffect(() => {
    if (socket && user && user.primaryEmailAddress) {
      socket.send(JSON.stringify({
        type: 'user_register',
        email: user.primaryEmailAddress.emailAddress,
        name: user.fullName || user.firstName || user.primaryEmailAddress.emailAddress,
        avatarUrl: user.imageUrl || ''
      }));
    }
  }, [socket, user]);
  

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      
 <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">GAMMA CHAT</h1>
          <div className="text-sm text-slate-600 flex items-center space-x-2">
            {user?.fullName || user?.firstName || user?.primaryEmailAddress?.emailAddress || 'Loading...'}
            <header style={{ padding: 20, borderBottom: '1px solid #eee' }}>
            <SignedOut>
              <SignInButton />
              <SignUpButton />
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </header>
          </div>
        </div>
      </div> 
       
      {/* Messages Area */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 sm:px-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 h-full flex flex-col">
          
          {/* Messages Container */}
          <div className="flex-1 p-6 space-y-4 overflow-y-auto min-h-[400px] max-h-[60vh]">
            {messages.length === 0 ? (
              <div className="text-center text-slate-500 mt-12">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-lg">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <div key={index} className="flex items-start space-x-3 group hover:bg-slate-50/50 rounded-lg p-2 transition-colors">
                    {/* Avatar */}
                    {message.avatarUrl ? (
                      <img 
                        src={message.avatarUrl} 
                        alt={message.name || message.email}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-100"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-lg">
                        {(message.name || message.email).charAt(0).toUpperCase()}
                      </div>
                    )}
                    
                    {/* Message Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-semibold text-slate-900">
                          {message.name || message.email}
                        </p>
                        <p className="text-xs text-slate-500 font-medium">
                          {message.timestamp}
                        </p>
                      </div>
                      <p className="text-sm text-slate-700 mt-1 leading-relaxed">
                        {message.message}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-slate-200/50 p-6 bg-gradient-to-r from-slate-50/50 to-blue-50/50">
            <div className="flex space-x-3">
              <input
                type="text"
                value={currentMessage.message}
                onChange={(e) => setCurrentMessage({...currentMessage, message: e.target.value})}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && socket && user && user.primaryEmailAddress && currentMessage.message.trim()) {
                    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const messageWithUserInfo = {
                      ...currentMessage,
                      email: user.primaryEmailAddress.emailAddress,
                      name: user.fullName || user.firstName || user.primaryEmailAddress.emailAddress,
                      timestamp: currentTime,
                      avatarUrl: user.imageUrl || ''
                    };
                    socket.send(JSON.stringify({ type: 'test-message', message: messageWithUserInfo }));
                    setCurrentMessage({email: '', name: '', message: '', timestamp: '', avatarUrl: ''});
                  }
                }}
                placeholder="Type your message..."
                className="flex-1 min-w-0 px-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 bg-white/80 backdrop-blur-sm text-black placeholder-slate-500"
                disabled={!user || !user.primaryEmailAddress}
              />
              <button
                onClick={() => {
                  if (socket && user && user.primaryEmailAddress && currentMessage.message.trim()) {
                    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const messageWithUserInfo = {
                      ...currentMessage,
                      email: user.primaryEmailAddress.emailAddress,
                      name: user.fullName || user.firstName || user.primaryEmailAddress.emailAddress,
                      timestamp: currentTime,
                      avatarUrl: user.imageUrl || ''
                    };
                    socket.send(JSON.stringify({ type: 'test-message', message: messageWithUserInfo }));
                    setCurrentMessage({email: '', name: '', message: '', timestamp: '', avatarUrl: ''});
                  }
                }}
                disabled={!user || !user.primaryEmailAddress || !currentMessage.message.trim()}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg hover:from-indigo-700 hover:to-purple-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed transition-all duration-200 font-semibold transform hover:scale-105 active:scale-95"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}