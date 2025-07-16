import React from "react";
import { Spinner } from "react-bootstrap";

export default function Loader() {
  return (
    <div className="d-flex align-items-center justify-content-center mct-loader">
      <Spinner animation="border" variant="primary" role="status" size="lg">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
    </div>
  );
}
