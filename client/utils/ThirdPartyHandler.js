/* Author - ANAND N G
 * @todo - Move all mCustomScrollbar intitialization to this
 */
export const ThirdPartyHandler = {

  /** To intialize slim scrollbar
   * @author - ANAND N G
   * @param - {el} - Current component mounting point
   * @param - {element} - element to apply
   */
  intitalize_slim_scroll(el, element) {
    el.find(element).mCustomScrollbar({
      theme:"minimal-dark"
    });
  },

  /** To initiate material_chip from materialize css
   * @author - Anand N G
   * @param - {el} - Current component mounting point
   * @param - {element} - element to apply material chip
   * @param - {data} - Data to intialize_material_chip
   */
  intialize_material_chip(el, element, data) {
    el.find(element).material_chip({
      data: data
    });
  },

  /** To initiate material ui slider
   * @author - Anand N G
   * @param - {el} - Current component mounting point
   * @param - {element} - element to apply slider
   * @param - {sliderProp} - slider properties
   */
  intialize_material_ui_slier(el, element, sliderProp) {
    let slider = el.find(element)[0];
    if(sliderProp) {
      noUiSlider.create(slider, sliderProp);
    }
  },

  /** To initiate material_chip from materialize css
   * @author - Anand N G
   * @param - {el} - Current component mounting point
   * @param - {element} - element to apply material slider
   * @param - {cb} - callback function to handle the updated values
   */
  triggerUpdateEvent_ui_slider(el, element, cb) {
    var slider = el.find(element)[0];
    slider.noUiSlider.on("update", cb);
  }
};
