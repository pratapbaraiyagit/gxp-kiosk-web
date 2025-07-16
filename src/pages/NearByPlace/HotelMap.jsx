import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faMinus,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { getImageSrc } from "../../utils/bulkImageStorage";

const HotelMap = () => {
  return (
    <>
      <div className="my-auto">
        <div className="custom-card w-100">
          <div className="custom-card-wrap p-3">
            <div className="map-scrollbar w-100">
              <div className="container-fluid w-100 image-map">
                <TransformWrapper
                  initialScale={1}
                  initialPositionX={0}
                  initialPositionY={0}
                >
                  {({ zoomIn, zoomOut, resetTransform }) => (
                    <>
                      <TransformComponent>
                        <img
                          src={getImageSrc("FloorMap")}
                          alt="Floor plan"
                          style={{ width: "100%", height: "auto" }}
                        />
                      </TransformComponent>
                      <div className="d-flex align-items-center justify-content-center mt-2">
                        <button
                          className="btn grdient-bg text-light mx-2"
                          onClick={() => resetTransform()}
                        >
                          Reset
                        </button>
                        <button
                          className="btn grdient-bg text-light mx-2"
                          onClick={() => zoomOut()}
                        >
                          <FontAwesomeIcon
                            icon={faMinus}
                            className="text-white"
                          />
                        </button>
                        <button
                          className="btn grdient-bg text-light mx-2"
                          onClick={() => zoomIn()}
                        >
                          <FontAwesomeIcon
                            icon={faPlus}
                            className="text-white"
                          />
                        </button>
                      </div>
                    </>
                  )}
                </TransformWrapper>
              </div>
              {/* <div className="back-btn-arrow d-flex align-items-center justify-content-center cursor">
                <FontAwesomeIcon icon={faArrowLeft} className="text-white" />
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HotelMap;
