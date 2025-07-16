import axios from "axios";
import { getSessionItem, removeSessionItem } from "../hooks/session"; // Added setSessionItem
import { refreshToken } from "../redux/reducers/UserLoginAndProfile/auth";
import { authRefreshToken } from "../utils/apiEndPoint"; // Import the refresh token endpoint

let refreshTokenTimer = null;

const setupInterceptors = ({ navigate, dispatch }) => {
  const startAutoRefreshTimer = () => {
    if (refreshTokenTimer) {
      clearTimeout(refreshTokenTimer);
    }

    const token = getSessionItem("TokenKiosk");
    if (!token) {
      return;
    }

    let payload = null;
    try {
      const decodedToken = atob(token);
      payload = JSON.parse(atob(decodedToken?.split(".")[1]));
    } catch (error) {
      handleLogout();
      return;
    }

    if (payload && payload.exp) {
      const currentTime = Math.floor(Date.now() / 1000);
      const expirationTime = payload.exp;

      const refreshBuffer = 60;
      const timeToRefresh = expirationTime - currentTime - refreshBuffer - 1;

      if (timeToRefresh <= 0) {
        performTokenRefresh();
      } else {
        const remainingTimeInMs = timeToRefresh * 1000;
        refreshTokenTimer = setTimeout(() => {
          performTokenRefresh();
        }, remainingTimeInMs);
      }
    } else {
    }
  };

  const performTokenRefresh = async () => {
    try {
      const refreshTokenValue = getSessionItem("RefreshKiosk");
      const userData = getSessionItem("UserSessionKiosk");

      if (!refreshTokenValue || !userData) {
        handleLogout();
        return;
      }

      const userSession = JSON.parse(atob(userData));

      const result = await dispatch(
        refreshToken({
          user_id: userSession?.id,
          device_data: {
            id: userSession?.id,
          },
        })
      ).unwrap();

      if (result) {
        startAutoRefreshTimer();
      }
    } catch (error) {
      handleLogout();
    }
  };

  const handleLogout = () => {
    if (refreshTokenTimer) {
      clearTimeout(refreshTokenTimer);
      refreshTokenTimer = null;
    }

    removeSessionItem("UserSessionKiosk");
    removeSessionItem("TokenKiosk");
    removeSessionItem("RefreshKiosk");
    removeSessionItem("hotelKiosk");
    removeSessionItem("splash");

    delete axios.defaults.headers.common["Authorization"];

    setTimeout(() => {
      navigate("/login");
    }, 1000);
  };

  const requestInterceptor = axios.interceptors.request.use(
    (config) => {
      const isRefreshTokenRequest =
        config.url?.includes(authRefreshToken) ||
        config.url?.endsWith("/refresh-token") ||
        config.url?.endsWith("/auth/refresh-token");

      // Only add access token for non-refresh-token requests
      if (!isRefreshTokenRequest) {
        const token = getSessionItem("TokenKiosk");
        if (token) {
          config.headers.Authorization = `Bearer ${atob(token)}`;
        }
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  const responseInterceptor = axios.interceptors.response.use(
    (response) => {
      // Handle successful responses
      return response;
    },
    async (error) => {
      if (error.response?.status === 403 || error.response?.status === 401) {
        try {
          await performTokenRefresh();

          // Retry the original request with new token
          const originalRequest = error.config;
          const newToken = getSessionItem("TokenKiosk");

          if (newToken && !originalRequest._retry) {
            originalRequest._retry = true;
            originalRequest.headers.Authorization = `Bearer ${atob(newToken)}`;
            return axios(originalRequest);
          }
        } catch (refreshError) {
          handleLogout();
        }
      }

      return Promise.reject(error);
    }
  );

  // Start the auto-refresh timer when interceptors are set up
  // Check if user is already logged in
  const token = getSessionItem("TokenKiosk");
  if (token) {
    startAutoRefreshTimer();
  }

  // Return cleanup function along with interceptor IDs
  return {
    requestInterceptor,
    responseInterceptor,
    startAutoRefreshTimer,
    stopAutoRefreshTimer: () => {
      if (refreshTokenTimer) {
        clearTimeout(refreshTokenTimer);
        refreshTokenTimer = null;
      }
    },
  };
};

export default setupInterceptors;
