import axios from 'axios';

export const deleteNoteById = async (id) => {
  try {
    const response = await axios.delete(`http://192.168.29.175:3000/notes/deletenote/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
};
