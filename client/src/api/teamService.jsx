import api from './axios';

const teamService = {
  // Obține toate echipele utilizatorului
  getUserTeams: async () => {
    const response = await api.get('/teams');
    return response.data;
  },
  
  // Obține o echipă specifică
  getTeamById: async (teamId) => {
    const response = await api.get(`/teams/${teamId}`);
    return response.data;
  },
  
  // Creează o echipă nouă
  createTeam: async (teamData) => {
    const response = await api.post('/teams', teamData);
    return response.data;
  },
  
  // Actualizează o echipă
  updateTeam: async (teamId, teamData) => {
    const response = await api.put(`/teams/${teamId}`, teamData);
    return response.data;
  },
  
  // Șterge o echipă
  deleteTeam: async (teamId) => {
    const response = await api.delete(`/teams/${teamId}`);
    return response.data;
  },
  
  // Adaugă un membru la o echipă
  addTeamMember: async (teamId, memberId, role = 'member') => {
    const response = await api.post(`/teams/${teamId}/members`, { memberId, role });
    return response.data;
  },
  
  // Elimină un membru dintr-o echipă
  removeTeamMember: async (teamId, memberId) => {
    const response = await api.delete(`/teams/${teamId}/members/${memberId}`);
    return response.data;
  },
  
  // Obține membrii unei echipe
  getTeamMembers: async (teamId) => {
    const response = await api.get(`/teams/${teamId}/members`);
    return response.data;
  },
  
  // Atribuie un obiectiv unei echipe
  assignGoalToTeam: async (teamId, goalId) => {
    const response = await api.post(`/teams/${teamId}/goals`, { goalId });
    return response.data;
  },
  
  // Obține obiectivele unei echipe
  getTeamGoals: async (teamId) => {
    const response = await api.get(`/teams/${teamId}/goals`);
    return response.data;
  }
};

export default teamService;