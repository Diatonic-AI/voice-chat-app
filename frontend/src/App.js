import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import VoiceRecorder from './components/VoiceRecorder';
import ChatMessages from './components/ChatMessages';
import ControlPanel from './components/ControlPanel';
import { chatService } from './services/chatService';

function App() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  const [selectedVoice, setSelectedVoice] = useState('alloy');
  const [autoPlay, setAutoPlay] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (message) => {
    setMessages(prev => [...prev, { ...message, id: Date.now() }]);
  };

  const handleVoiceMessage = async (audioBlob) => {
    setIsLoading(true);
    setError(null);

    try {
      // Add user voice message placeholder
      const userMessage = {
        type: 'user',
        content: 'Processing voice message...',
        timestamp: new Date().toISOString(),
        isVoice: true,
        isProcessing: true
      };
      addMessage(userMessage);

      // Transcribe audio
      const transcription = await chatService.transcribeAudio(audioBlob);
      
      // Update user message with transcription
      setMessages(prev => prev.map(msg => 
        msg.isProcessing ? { ...msg, content: transcription.transcription, isProcessing: false } : msg
      ));

      // Get AI response
      const chatResponse = await chatService.sendMessage(transcription.transcription);
      
      const assistantMessage = {
        type: 'assistant',
        content: chatResponse.response,
        timestamp: chatResponse.timestamp,
        isVoice: false
      };
      addMessage(assistantMessage);

      // Convert response to speech if auto-play is enabled
      if (autoPlay) {
        try {
          const audioUrl = await chatService.textToSpeech(chatResponse.response, selectedVoice);
          
          // Update assistant message with audio
          setMessages(prev => prev.map(msg => 
            msg.timestamp === chatResponse.timestamp 
              ? { ...msg, audioUrl, isVoice: true }
              : msg
          ));
        } catch (ttsError) {
          console.error('TTS Error:', ttsError);
          // Continue without audio if TTS fails
        }
      }

    } catch (err) {
      setError(err.message || 'Failed to process voice message');
      console.error('Voice message error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextMessage = async (text) => {
    if (!text.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Add user message
      const userMessage = {
        type: 'user',
        content: text,
        timestamp: new Date().toISOString(),
        isVoice: false
      };
      addMessage(userMessage);

      // Get AI response
      const chatResponse = await chatService.sendMessage(text);
      
      const assistantMessage = {
        type: 'assistant',
        content: chatResponse.response,
        timestamp: chatResponse.timestamp,
        isVoice: false
      };
      addMessage(assistantMessage);

      // Convert response to speech if auto-play is enabled
      if (autoPlay) {
        try {
          const audioUrl = await chatService.textToSpeech(chatResponse.response, selectedVoice);
          
          // Update assistant message with audio
          setMessages(prev => prev.map(msg => 
            msg.timestamp === chatResponse.timestamp 
              ? { ...msg, audioUrl, isVoice: true }
              : msg
          ));
        } catch (ttsError) {
          console.error('TTS Error:', ttsError);
          // Continue without audio if TTS fails
        }
      }

    } catch (err) {
      setError(err.message || 'Failed to send message');
      console.error('Text message error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await chatService.clearHistory();
      setMessages([]);
      setError(null);
    } catch (err) {
      setError('Failed to clear history');
      console.error('Clear history error:', err);
    }
  };

  const handlePlayResponse = async (message) => {
    if (message.audioUrl) {
      // Play existing audio
      const audio = new Audio(message.audioUrl);
      audio.play().catch(console.error);
    } else {
      // Generate and play new audio
      try {
        const audioUrl = await chatService.textToSpeech(message.content, selectedVoice);
        const audio = new Audio(audioUrl);
        audio.play().catch(console.error);
        
        // Update message with audio URL
        setMessages(prev => prev.map(msg => 
          msg.id === message.id ? { ...msg, audioUrl } : msg
        ));
      } catch (err) {
        console.error('Failed to play response:', err);
        setError('Failed to play response');
      }
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>🎙️ AI Voice Chat</h1>
        <p>Powered by OpenAI • Built by DIatonic-AI</p>
      </header>

      <main className="app-main">
        <div className="chat-container">
          <ChatMessages 
            messages={messages}
            isLoading={isLoading}
            onPlayResponse={handlePlayResponse}
          />
          <div ref={messagesEndRef} />
        </div>

        <div className="input-container">
          <VoiceRecorder
            onVoiceMessage={handleVoiceMessage}
            onTextMessage={handleTextMessage}
            isRecording={isRecording}
            setIsRecording={setIsRecording}
            isLoading={isLoading}
          />
        </div>

        <ControlPanel
          selectedVoice={selectedVoice}
          onVoiceChange={setSelectedVoice}
          autoPlay={autoPlay}
          onAutoPlayChange={setAutoPlay}
          onClearHistory={handleClearHistory}
          messageCount={messages.length}
        />
      </main>

      {error && (
        <div className="error-notification">
          <p>{error}</p>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
    </div>
  );
}

export default App;
