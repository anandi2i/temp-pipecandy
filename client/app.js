import React from "react";
import ReactDOM from "react-dom";
import {Router} from "react-router";
import routes from "./routes";
import appHistory from "./RouteContainer";

ReactDOM.render(<Router routes={routes} history={appHistory}/>,
  document.getElementById("root"));
