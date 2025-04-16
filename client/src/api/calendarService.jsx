import api from './axios';

const calendarService = {
  // Obținerea tuturor evenimentelor
  getAllEvents: async () => {
    const response = await api.get('/calendar');
    return response.data;
  },

  // Obținerea evenimentelor într-un interval de timp
  getEventsByRange: async (start, end) => {
    const response = await api.get(`/calendar/range?start=${start.toISOString()}&end=${end.toISOString()}`);
    return response.data;
  },

  // Crearea unui eveniment nou
  createEvent: async (eventData) => {
    const response = await api.post('/calendar', eventData);
    return response.data;
  },

  // Actualizarea unui eveniment existent
  updateEvent: async (id, eventData) => {
    const response = await api.put(`/calendar/${id}`, eventData);
    return response.data;
  },

  // Ștergerea unui eveniment
  deleteEvent: async (id) => {
    const response = await api.delete(`/calendar/${id}`);
    return response.data;
  },

  // Sincronizarea calendarului cu task-uri și obiective
  syncCalendar: async () => {
    const response = await api.post('/calendar/sync');
    return response.data;
  }
};

export default calendarService;