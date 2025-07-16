import React, { Suspense } from "react";
import { Navigate } from "react-router-dom";
import { hasAccess } from "../utils/commonFun";
import { getSessionItem } from "../hooks/session";
import Layout from "../components/Layout/Layout";
import Loader from "../component/Loader/Loader";
import { useSelector } from "react-redux";
import useInactivityTimeout from "../hooks/useInactivityTimeout"; // Import the hook

const PrivateRoute = ({ children, roles }) => {
  const userSession = JSON.parse(
    atob(getSessionItem("UserSessionKiosk") || "null")
  );
  const isAuthenticated = userSession && userSession.is_active;
  const hasRole = roles ? hasAccess(userSession, roles) : true;
  const splash = getSessionItem("splash");

  const mqttState = useSelector((state) => state.mqtt);

  const data =
    mqttState?.lastMessage?.message &&
    JSON.parse(mqttState?.lastMessage?.message);

  const laneClosed = getSessionItem("laneClose");

  // Use the inactivity timeout hook
  useInactivityTimeout();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (!hasRole) {
    return (
      <Layout>
        <Navigate to="/access-denied" />
      </Layout>
    );
  }

  return splash || laneClosed === "true" ? (
    <Suspense fallback={<Loader />}>{children}</Suspense>
  ) : (
    <Layout>
      <Suspense fallback={<Loader />}>{children}</Suspense>
    </Layout>
  );
};

export default PrivateRoute;
