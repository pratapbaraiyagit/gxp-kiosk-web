import React from "react";
import "./UiBlocker.css";

const UiBlocker = ({ active = false }) => {
  if (!active) return null;

  return <div className="ui-blocker" />;
};

export default UiBlocker;
