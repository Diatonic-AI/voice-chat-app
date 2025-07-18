import React, { useState } from 'react';
import './ControlPanel.css';

const ControlPanel = ({ 
  selectedVoice, 
  onVoiceChange, 
  autoPlay, 
  onAutoPlayChange, 
  onClearHistory, 
  messageCount 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const voices = [
    { value: 'alloy', label: '🎭 Alloy' },
    { value: 'echo', label: '🔮 Echo' },
    { value: 'fable', label: '📚 Fable' },
    { value: 'onyx', label: '💎 Onyx' },
    { value: 'nova', label: '⭐ Nova' },
    { value: 'shimmer', label: '✨ Shimmer' }
  ];

  const handleClearHistory = () => {
    if (window.confirm(`Clear all ${messageCount} messages from history?`)) {
      onClearHistory();
    }
  };

  return (
    <div className={`control-panel ${isExpanded ? 'expanded' : ''}`}>
      <button 
        className="toggle-button"
        onClick={() => setIsExpanded(!isExpanded)}
        title={isExpanded ? 'Hide settings' : 'Show settings'}
      >
        ⚙️ Settings {isExpanded ? '▼' : '▶'}
      </button>

      {isExpanded && (
        <div className="control-content fade-in-up">
          <div className="control-section">
            <h4>🔊 Voice Settings</h4>
            
            <div className="setting-row">
              <label htmlFor="voice-select">AI Voice:</label>
              <select
                id="voice-select"
                value={selectedVoice}
                onChange={(e) => onVoiceChange(e.target.value)}
                className="voice-select"
              >
                {voices.map(voice => (
                  <option key={voice.value} value={voice.value}>
                    {voice.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="setting-row">
              <label htmlFor="auto-play">Auto-play responses:</label>
              <label className="toggle-switch">
                <input
                  id="auto-play"
                  type="checkbox"
                  checked={autoPlay}
                  onChange={(e) => onAutoPlayChange(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          <div className="control-section">
            <h4>💬 Chat Management</h4>
            
            <div className="setting-row">
              <span>Messages in history: {messageCount}</span>
              <button
                className="clear-button"
                onClick={handleClearHistory}
                disabled={messageCount === 0}
                title="Clear conversation history"
              >
                🗑️ Clear History
              </button>
            </div>
          </div>

          <div className="control-section">
            <h4>ℹ️ Information</h4>
            <div className="info-text">
              <p>• Voice messages are transcribed using OpenAI Whisper</p>
              <p>• Responses are generated by GPT-3.5 Turbo</p>
              <p>• Text-to-speech uses OpenAI's TTS model</p>
              <p>• Conversation history is maintained server-side</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlPanel;
