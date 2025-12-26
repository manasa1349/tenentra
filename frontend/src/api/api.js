import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api"
  // baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  // (error) => Promise.reject(error)
);

api.interceptors.response.use(
  res => res,
  err => Promise.reject(err)
);


// api.interceptors.response.use(
//   res => res,
//   err => {
//     if (err.response?.status === 401) {
//       localStorage.removeItem("token");
//       window.location.href = "/login";
//     }
//     return Promise.reject(err);
//   }
// );

export default api;