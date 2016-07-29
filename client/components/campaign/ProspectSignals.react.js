import React from "react";
import ReactDOM from "react-dom";

class ProspectSignals extends React.Component {
  constructor(props) {
    /**
     * Initial state values
     * @property {array} prospects
     * @property {boolean} isProspectSignals
     * @property {number} currentProspect
     */
    super(props);
    this.state = {
      currentProspect: 0,
      isProspectSignals: true,
      prospects: [
        "John Smith",
        "Isela Gerardo",
        "Adrian Schnell",
        "Bruna Montesinos",
        "Georgeanna Pendarvis",
        "Elisabeth Pleasant",
        "Virgie Klepper",
        "Rosalinda Didonna",
        "Columbus Pew",
        "Zonia Pence",
        "Waltraud Weddell",
        "Shelba Johansson",
        "Ludivina Hite",
        "Charisse Docherty",
        "Lady Maltos",
        "Danette Goebel",
        "Mariana Crites",
        "Valeri Wardlaw",
        "Adan Overson",
        "Corie Alcorn"
      ]
    };
  }

  componentDidMount() {
    this.el = $(ReactDOM.findDOMNode(this));
    this.el.find(".sig-in-cntr").mCustomScrollbar({
      theme:"minimal-dark"
    });
  }

  /**
   * Get ProspectSignals based on selected prospects
   * @param  {number} id - prospects key
   */
  prospectSignals = (id) => {
    const timeDelay = 200;
    this.setState({
      currentProspect: id,
      isProspectSignals: false
    }, () => {
      this.el.find(".prospect-list").removeClass("active");
      this.el.find(`#prospect${id}`).addClass("active");
      const _this = this;
      setTimeout( () => {
        _this.setState({
          isProspectSignals: true
        });
      }, timeDelay);
    });
  }

  render() {
    let {prospects, currentProspect, isProspectSignals} = this.state;
    return (
      <div className="signal-container">
        <div className="col s4 title brdr-rit">Signals in the List (20/50)</div>
        <div className="col s8 title">{`${prospects[currentProspect]}'s Signal`}</div>
        <div className="col s12 sig-out-cntr">
          <div className="col s4 sig-in-cntr brdr-rit">
            {
              prospects.map((val, key) => {
                let activeClass = "prospect-list";
                if(!key){
                  activeClass = "prospect-list active";
                }
                return (
                  <div className={activeClass} id={`prospect${key}`}
                    onClick={() => this.prospectSignals(key)}
                    key={key}>
                    {val}
                  </div>
                );
              })
            }
          </div>
          <div className="col s8 sig-in-cntr">
            <div className="prospect-signals"
              style={{display: isProspectSignals ? "block" : "none"}}>
              <div>
                <div className="title">Common Connections:</div>
                <div className="content">You & John Smith have 1 common connection via Mark Suster. Mark Suster & John Smith worked together in Yahoo! Drop this reference in your email to John Smith.</div>
              </div>
              <div>
                <div className="title">Job Change:</div>
                <div className="content">Mike Pearson has moved from Johnson & Johnson to Procter & Gamble as their 'Chief Digital Experience Officer'. Volga Nelson is the outgoing Chief Digital Officer of Procter & Gamble. Refer about your conversations with Volga to Mike Pearson.</div>
              </div>
              <div>
                <div className="title">Job Postings:</div>
                <div className="content">You had emailed Will Connor of Stripe. Stripe has 5 job openings in Indeed.com. Click here to see all job postings from Stripe. Discuss this with Will Connor.</div>
              </div>
              <div>
                <div className="title">Tech Used:</div>
                <div className="content">Stripe is using Angular 1.5.6. Send them an email about version 2.0 upgrade.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ProspectSignals;
