import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const PrivateRoute = ({ children }) => {
  const auth = useAuth();

  // More defensive checking
  if (!auth) {
    console.error("Auth context is undefined");
    return <Navigate to="/" />;
  }

  const { isAuthenticated, user: currentUser } = auth;

  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  return React.isValidElement(children)
    ? React.cloneElement(children, { currentUser })
    : children;
};

export default PrivateRoute;
