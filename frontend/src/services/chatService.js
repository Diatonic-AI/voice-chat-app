import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

class ChatService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // 30 seconds
    });
  }

  async sendMessage(message, resetHistory = false) {
    try {
      const response = await this.api.post('/api/chat', {
        message,
        resetHistory
      });
      return response.data;
    } catch (error) {
      console.error('Chat API Error:', error);
      throw new Error(error.response?.data?.error || 'Failed to send message');
    }
  }

  async transcribeAudio(audioBlob) {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await this.api.post('/api/stt', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds for audio processing
      });
      
      return response.data;
    } catch (error) {
      console.error('STT API Error:', error);
      throw new Error(error.response?.data?.error || 'Failed to transcribe audio');
    }
  }

  async textToSpeech(text, voice = 'alloy') {
    try {
      const response = await this.api.post('/api/tts', {
        text,
        voice
      }, {
        responseType: 'blob',
        timeout: 60000, // 60 seconds for audio generation
      });

      // Create a blob URL for the audio
      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      return URL.createObjectURL(audioBlob);
    } catch (error) {
      console.error('TTS API Error:', error);
      throw new Error(error.response?.data?.error || 'Failed to generate speech');
    }
  }

  async getHistory() {
    try {
      const response = await this.api.get('/api/history');
      return response.data;
    } catch (error) {
      console.error('History API Error:', error);
      throw new Error(error.response?.data?.error || 'Failed to get history');
    }
  }

  async clearHistory() {
    try {
      const response = await this.api.delete('/api/history');
      return response.data;
    } catch (error) {
      console.error('Clear History API Error:', error);
      throw new Error(error.response?.data?.error || 'Failed to clear history');
    }
  }

  async healthCheck() {
    try {
      const response = await this.api.get('/health');
      return response.data;
    } catch (error) {
      console.error('Health Check Error:', error);
      throw new Error('Backend service is not available');
    }
  }
}

export const chatService = new ChatService();
