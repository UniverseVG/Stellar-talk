import axios from "axios";

const api = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = JSON.parse(localStorage.getItem("userInfo"))?.data?.token;

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    throw new Error(error.message);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response.data.message === "jwt expired") {
      localStorage.removeItem("userInfo");
      window.location.href = "/";
    }
    throw new Error(error.message);
  }
);

const apiEndpoints = {
  login: (data) => api.post("/api/user/login", data),
  register: (data) => api.post("/api/user", data),
  fetchChats: () => api.get("/api/chat"),
  searchUsers: (search) => api.get(`/api/user?search=${search}`),
  accessChat: (data) => api.post("/api/chat", data),
  createNotification: (data) => api.post("/api/notification", data),
  readChatNotifications: (id) => api.put(`/api/notification/chat/${id}`, {}),
  fetchNotifications: () => api.get("/api/notification"),
  readNotification: (id) => api.put(`/api/notification/${id}`, {}),
  fetchMessages: (id) => api.get(`/api/message/${id}`),
  sendMessage: (data) => api.post("/api/message", data),
  createGroup: (data) => api.post("/api/chat/group", data),
  renameGroup: (data) => api.put("/api/chat/rename", data),
  addUserToGroup: (data) => api.put("/api/chat/groupadd", data),
  removeUserFromGroup: (data) => api.put("/api/chat/groupremove", data),
};

export default apiEndpoints;
