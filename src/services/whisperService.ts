import * as FileSystem from 'expo-file-system';

// OpenAI API Key - Set via environment variable EXPO_PUBLIC_OPENAI_API_KEY
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';

export interface TranscriptionResult {
  text: string;
  error?: string;
}

/**
 * Transcribe audio using OpenAI Whisper API
 * @param audioUri - Local URI of the audio file
 * @returns Transcription result with text or error
 */
export const transcribeAudio = async (audioUri: string): Promise<TranscriptionResult> => {
  try {
    // Read the audio file as base64
    const audioBase64 = await FileSystem.readAsStringAsync(audioUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Convert base64 to blob for FormData
    const audioBlob = base64ToBlob(audioBase64, 'audio/m4a');

    // Create FormData
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.m4a');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en'); // Optional: specify language for better accuracy
    formData.append('response_format', 'json');

    // Call OpenAI Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Transcription failed');
    }

    const data = await response.json();
    return { text: data.text };
  } catch (error) {
    console.error('Whisper transcription error:', error);
    return { 
      text: '', 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

/**
 * Convert base64 string to Blob
 */
const base64ToBlob = (base64: string, mimeType: string): Blob => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};

/**
 * Alternative method using fetch with file URI directly (for React Native)
 * This method works better on mobile devices
 */
export const transcribeAudioMobile = async (audioUri: string): Promise<TranscriptionResult> => {
  try {
    // Create form data with the file
    const formData = new FormData();
    
    // For React Native, we can append the file directly using the URI
    formData.append('file', {
      uri: audioUri,
      type: 'audio/m4a',
      name: 'audio.m4a',
    } as any);
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        // Don't set Content-Type - let fetch set it with the boundary
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Whisper API error:', errorText);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return { text: data.text.trim() };
  } catch (error) {
    console.error('Whisper transcription error:', error);
    return { 
      text: '', 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

export default {
  transcribeAudio,
  transcribeAudioMobile,
};
