import React from "react";

/**
 * The class LinksClicked describes the recently clicked links, number of clicks
 *   of the links and click rates on the dashboard
 */
class LinksClicked extends React.Component {
  constructor() {
    super();
  }

  /**
   * render
   * @return {ReactElement} The element contatins links clicked,
   *   number of click and click rate
   */
  render() {
    //TODO - Remove static data
    const linksData = [
      {
        link: "http://www.highcharts.com/docs/getting-started/installation",
        clicks: 6,
        rate: "50%"
      },
      {
        link: "http://www.highcharts.com/docs/getting-started/installation",
        clicks: 3,
        rate: "12%"
      },
      {
        link: "http://www.highcharts.com/docs/getting-started/installation",
        clicks: 9,
        rate: "73%"
      }
    ];
    const linksDetails = linksData.map((link, key) => {
      return (
        <div className="row" key={key}>
          <div className="col s6 m8 links-clicked-data">
            <a target="_blank" href={link.link}>{link.link}</a>
          </div>
          <div className="col m2 s3">{link.clicks}</div>
          <div className="col m2 s3">{link.rate}</div>
        </div>
      );
    });
    return (
      <div className="container links-clicked-container">
        <div className="row main-head">
          Links Clicked
        </div>
        <div className="links-clicked row">
          <div className="col s6 m8 links-clicked-header">Link</div>
          <div className="col s3 m2 links-clicked-header">Number of Clicks</div>
          <div className="col s3 m2 links-clicked-header">Click Rate</div>
        </div>
        {linksDetails}
      </div>
    );
  }
}

export default LinksClicked;
