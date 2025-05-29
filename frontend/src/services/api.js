const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    console.log('Getting auth headers - Token exists:', !!token); // Debug log
    console.log('Token (first 20 chars):', token ? token.substring(0, 20) + '...' : 'null'); // Debug log

    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const fetchData = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = getAuthHeaders();

    console.log('Making request to:', url); // Debug log
    console.log('Request headers:', headers); // Debug log

    const defaultOptions = {
        headers,
    };

    const response = await fetch(url, {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    });

    console.log('Response status:', response.status); // Debug log
    console.log('Response headers:', Object.fromEntries(response.headers.entries())); // Debug log

    if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response body:', errorText); // Debug log

        if (response.status === 401) {
            console.log('401 Unauthorized - clearing token and redirecting');
            localStorage.removeItem('token');
            window.location.href = '/login';
            throw new Error('Your session has expired. Please log in again.');
        }

        let error;
        try {
            error = JSON.parse(errorText);
        } catch {
            error = { detail: errorText || 'Unknown error' };
        }

        throw new Error(error.detail || 'Something went wrong');
    }

    return response.json();
};

// Helper methods
export const get = (endpoint) => fetchData(endpoint);
export const post = (endpoint, data) => fetchData(endpoint, {
    method: 'POST',
    body: JSON.stringify(data)
});
export const put = (endpoint, data) => fetchData(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data)
});
export const del = (endpoint) => fetchData(endpoint, {
    method: 'DELETE'
});