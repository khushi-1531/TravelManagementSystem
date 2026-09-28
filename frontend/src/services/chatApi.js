import api from './api';

export const chatApi = {
  /**
   * Send a natural language message to the AI Travel Assistant.
   * @param {string} message - User question or prompt
   * @param {string|null} sessionUuid - Optional existing conversation UUID
   * @param {number|null} destinationId - Optional destination context ID
   * @returns {Promise<Object>} ChatMessageResponse
   */
  sendMessage: async (message, sessionUuid = null, destinationId = null) => {
    const payload = {
      message,
      sessionUuid: sessionUuid || undefined,
      destinationId: destinationId || undefined
    };
    const response = await api.post('/chat/message', payload);
    return response.data.data;
  },

  /**
   * Retrieve all chat sessions for the authenticated customer.
   * @returns {Promise<Array>} List of ChatSessionResponse
   */
  getSessions: async () => {
    const response = await api.get('/chat/sessions');
    return response.data.data;
  },

  /**
   * Retrieve historical messages for a specific chat session.
   * @param {string} sessionUuid
   * @returns {Promise<Array>} List of ChatMessageResponse
   */
  getSessionMessages: async (sessionUuid) => {
    const response = await api.get(`/chat/sessions/${sessionUuid}/messages`);
    return response.data.data;
  },

  /**
   * Delete a chat session.
   * @param {string} sessionUuid
   */
  deleteSession: async (sessionUuid) => {
    const response = await api.delete(`/chat/sessions/${sessionUuid}`);
    return response.data.data;
  }
};

export default chatApi;
