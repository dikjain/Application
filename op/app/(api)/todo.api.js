import axios from 'axios';
    
export const deleteTodoById = async (id) => {
  try {
    const response = await axios.delete(`http://192.168.29.175:3000/todo/deletetodo/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting todo:', error);
    throw error;
  }
};
