import React from "react";
import Header from "./Header.react";

class AppContainer extends React.Component {
  render() {
    return (
      <div>
        <Header />
        {this.props.children}
      </div>
    );
  }
}

export default AppContainer;
