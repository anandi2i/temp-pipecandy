import React from "react";
import Highcharts from "highcharts";
import _ from "underscore";

/**
 * Draw Graph using Highcharts library
 */
class PerformanceReport extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.drawGraph();
  }

  /**
   * Setup Highcharts Properties
   */
  drawGraph() {
    //TODO - Remove static data
    //TODO - Use variable colours
    let pointInterval = 86400000;
    let year = 2016;
    let month = 0;
    let day = 1;
    let pointStart = Date.UTC(year, month, day);
    let seriesStart = 0;
    let seriesEnd = 10;
    let range = 20;
    let series1 = [];
    let series2 = [];
    for(let i = seriesStart; i < seriesEnd; i++) {
      series1.push(_.random(seriesStart, range));
      series2.push(_.random(seriesStart, range));
    }
    Highcharts.chart({
      chart: {
          type: "areaspline",
          renderTo: "performanceReport"
      },
      title: {
          text: ""
      },
      legend: {
          layout: "horizontal",
          align: "right",
          verticalAlign: "top",
          floating: true,
          backgroundColor: "#FFFFFF",
          symbolHeight: 15,
          symbolWidth: 15
      },
      xAxis: {
          type: "datetime",
          dateTimeLabelFormats: {
            day: "%d %b %Y"
          }
      },
      yAxis: {
          title: {
              text: ""
          },
          gridLineColor: "#EBEBEB"
      },
      tooltip: {
          shared: false,
          valueSuffix: "",
          backgroundColor: "#000000",
          borderColor: "#000000",
          style: {
              color: "#FFFFFF"
          },
          formatter: function () {
              return Highcharts.dateFormat("%d %b %Y", this.x)
                + "<br><b>" + this.y + "% Click rate</b>";
          },
          xDateFormat: "%Y-%m-%d"
      },
      credits: {
          enabled: false
      },
      plotOptions: {
          areaspline: {
              fillOpacity: 0.0
          },
          series: {
              pointStart: pointStart,
              pointInterval: pointInterval
          }
      },
      series: [{
          name: "Click rates",
          data: series1,
          color: "#FF6549",
          lineColor: "#FF6549",
          lineWidth: 3,
          marker: {
              symbol: "circle",
              radius: 4,
              fillColor: "#FFFFFF",
              lineWidth: 3,
              lineColor: "#FF6549"
          }
      }, {
          name: "Open rates",
          data: series2,
          color: "#FFC66D",
          lineColor: "#FFC66D",
          lineWidth: 3,
          marker: {
              symbol: "circle",
              radius: 4,
              fillColor: "#FFFFFF",
              lineWidth: 3,
              lineColor: "#FFC66D"
          }
      }]
    });
  }

  render() {
    return (
      <div className="container">
        <div className="row main-head">
          Performance Report
        </div>
        <div id="performanceReport" className="graphSize" />
      </div>
    );
  }
}

export default PerformanceReport;
