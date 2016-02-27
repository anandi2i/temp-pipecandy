import React from "react";
import ReactDOM from "react-dom";
import router from "./RouteContainer";

router.run(function (Handler) {
  ReactDOM.render(<Handler />, document.getElementById("root"));
});
