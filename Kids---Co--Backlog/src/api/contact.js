import { API_BASE_URL } from './config';

// Submit contact message
export const submitContactMessage = async (formData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/contact`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
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
