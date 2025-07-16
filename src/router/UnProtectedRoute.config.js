import React, { Suspense } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getSessionValue } from "../utils/common.js";
import Loader from "../component/Loader/Loader.js";

export default function UnProtectedRoute({ children }) {
  const location = useLocation();

  return (
    <Suspense fallback={<Loader />}>
      {!getSessionValue() ? (
        children
      ) : (
        <Navigate
          to={
            location?.state?.prevRoute?.pathname
              ? location.state.prevRoute.pathname
              : "/setting"
          }
        />
      )}
    </Suspense>
  );
}
