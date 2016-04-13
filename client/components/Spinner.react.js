import React from "react";

class Spinner extends React.Component {
  render() {
    let bars = [];
    let i = 0;
    let rotateDegree = 30;
    let spinChange = 10;
    let totalBars = 12;
    for (; i < totalBars; i++) {
      let barStyle = {};
      barStyle.WebkitAnimationDelay = barStyle.animationDelay =
          (i - totalBars) / spinChange + "s";
      barStyle.WebkitTransform = barStyle.transform =
          "rotate(" + (i * rotateDegree) + "deg) translate(146%)";

      bars.push (
        <div style={barStyle} className="spinner-bar" key={i} />
      );
    }
    
    return (
      <div className="custom-spinner">
        {bars}
      </div>
    );
  }
}

export default Spinner;
