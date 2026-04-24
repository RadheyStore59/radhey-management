const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getAuthToken = () => {
  return localStorage.getItem('radhey_auth_token');
};

const calendarAPI = {
  // Create new calendar entry
  createEntry: async (entryData) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch(`${API_BASE_URL}/calendar/entry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(entryData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create calendar entry');
    }
    
    return response.json();
  },

  // Get all entries for logged-in user
  getAllEntries: async (startDate, endDate) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await fetch(`${API_BASE_URL}/calendar/entries?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch calendar entries');
    }
    
    return response.json();
  },

  // Get entries for a specific date
  getEntriesForDate: async (date) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    
        try {
      const response = await fetch(`${API_BASE_URL}/calendar/entries/${date}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch date entries');
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      throw error;
    }
  },

  // Update entry
  updateEntry: async (id, updateData) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch(`${API_BASE_URL}/calendar/entry/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update calendar entry');
    }
    
    return response.json();
  },

  // Delete entry
  deleteEntry: async (id) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch(`${API_BASE_URL}/calendar/entry/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete calendar entry');
    }
    
    return response.json();
  },

  // Get due reminders
  getDueReminders: async () => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/calendar/reminders/due`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const data = await response.json();
            return Array.isArray(data) ? data : [];
    } catch (error) {
      throw error;
    }
  },

  // Reset email notification status
  resetEmailNotification: async (id) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch(`${API_BASE_URL}/calendar/entry/${id}/reset-email`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to reset email notification');
    }
    
    return response.json();
  }
};

export default calendarAPI;
