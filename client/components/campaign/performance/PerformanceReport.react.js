import React from "react";
import Highcharts from "highcharts";
import _ from "underscore";
import CampaignActions from "../../../actions/CampaignActions";
import CampaignReportStore from "../../../stores/CampaignReportStore";

/**
 * The class PerformanceReport describes Opens and Clicks of the Emails on
 *   graph view
 */
class PerformanceReport extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isEnable: false
    };
  }

  componentDidMount() {
    CampaignReportStore.addPerformanceGraphListener(this.onStoreChange);
    CampaignActions.getCampaignPerformanceGraph(this.props.campaignId);
  }

  componentWillUnmount() {
    CampaignReportStore.removeOpenClickRate();
    CampaignReportStore.removePerformanceGraphListener(this.onStoreChange);
  }

  /**
   * Get Metrics of the Campaign
   */
  onStoreChange = () => {
    const openClickRate = CampaignReportStore.getOpenClickRate();
    if(openClickRate.graphData.length) {
      this.setState({
        isEnable: true,
        openClickRate: openClickRate
      }, () => {
       this.drawGraph();
      });
    }
  }

  /**
   * Setup Highcharts Properties
   */
  drawGraph = () => {
    const {openClickRate} = this.state;
    const openRateCount = [];
    const clickRateCount = [];
    const date = new Date(openClickRate.startDate);
    const pointInterval = 86400000;
    const pointStart =
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    _.each(openClickRate.graphData, function(val, key) {
      _.each(val, function(rate, k) {
        openRateCount.push(rate.openRate);
        clickRateCount.push(rate.clickRate);
      });
    });
    /**
     * Setup Charts Properties
     *
     * @see http://api.highcharts.com/highcharts
     */
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
              + "<br><b>" + this.y + " " + this.series.name + "</b>";
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
          data: clickRateCount,
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
          data: openRateCount,
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

  /**
   * render
   * @return {ReactElement} - The element which used to render the graph
   */
  render() {
    const {isEnable} = this.state;
    return (
      <div>
        {
          isEnable
            ?
              <div className="container row camp-chip-container performance-report">
                <div className="row main-head">
                  Performance Report
                </div>
                <div id="performanceReport" className="graph-size" />
              </div>
            : ""
        }
      </div>
    );
  }
}

export default PerformanceReport;
