// Environment configuration

// API Base URL based on environment
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const env = {
  API_BASE_URL,
  API_ENDPOINTS: {
    TEAMS: `${API_BASE_URL}/teams`,
    COURSES: `${API_BASE_URL}/courses`,
    LEAGUES: `${API_BASE_URL}/leagues`,
    WEEKS: `${API_BASE_URL}/weeks`,
    MATCHES: `${API_BASE_URL}/matches`,

  }
};

export default env;