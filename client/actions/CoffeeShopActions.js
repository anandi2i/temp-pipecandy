import AppDispatcher from "../dispatcher/AppDispatcher";
import Constants from "../constants/Constants";

// Define action methods
var CoffeeShopActions = {
  getAllCoffeeShops: function() {
    AppDispatcher.handleAction({
      actionType: Constants.COFFEE_SHOP_LIST
    });
  }
};

module.exports = CoffeeShopActions;
