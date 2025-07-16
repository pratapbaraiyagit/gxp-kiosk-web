import axios from "axios";
import { getSessionItem } from "../hooks/session";
export const getSessionValue = () => {
  const sessionData = getSessionItem("TokenKiosk");
  if (sessionData) {
    return true;
  } else {
    return false;
  }
};

const customAxios = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

export default customAxios;
