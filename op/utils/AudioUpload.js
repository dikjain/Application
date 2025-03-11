import axios from 'axios';
import { Audio } from 'expo-av';

const uploadAudio = async (audioUri) => {
  try {
    console.log('Fetching file:', audioUri);
    const response = await axios.get(audioUri, { responseType: 'blob' });
    const blob = response.data;

    const formData = new FormData();
    formData.append('file', {
      uri: audioUri,
      type: 'audio/m4a',
      name: 'recording.m4a',
    });
    formData.append('upload_preset', 'chat-app');

    console.log('Uploading to Cloudinary...');
    const uploadResponse = await axios.post('https://api.cloudinary.com/v1_1/ddtkuyiwb/raw/upload', formData);

    if (!uploadResponse.data.secure_url) {
      throw new Error('Failed to upload audio');
    }
    console.log(uploadResponse.data.secure_url)

    return uploadResponse.data.secure_url;
  } catch (error) {
    console.error('Error uploading audio:', error);
    return null;
  }
};

const isTodo = async (text) => {
    text = text.toLowerCase();
    if (text.includes("todo") || text.includes("to do")) {
        return true;
    }
    return false;
}

export { uploadAudio, isTodo };

