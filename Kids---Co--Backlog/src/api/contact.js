import { apiRequest } from './apiClient';

// Uses CSRF + credentials when middleware is enabled; `/api/contact` skips CSRF for anonymous submissions on the server.

/** Submit contact message */
export const submitContactMessage = async (formData) => {
  try {
    const response = await apiRequest('/contact', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to submit message');
    }

    return data;
  } catch (error) {
    console.error('Error submitting contact message:', error);
    throw error;
  }
};
