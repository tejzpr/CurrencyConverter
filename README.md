#Currency Converter
##An implementation of a Currency Converter using Node.js with Currency conversion API from http://fixer.io/

###Description:

1. The project contains a node module does currency conversion and a supporting WebApp that uses Node to display functions.

###API:

* */paypal/getSupportedCurrencies* Get a list of supported currencies
* */paypal/getRates* Gets the latest rates from remote API provider
* */paypal/getOfflineRates*  Gets the stored rates from file system
* */paypal/currencyConversion/:amount/:scode/:dcode* Gets the converted amount and accepts the following parameters
	- Amount
	- Source Currency Code
	- Converted Currency Code
* */paypal/conversionRate/:scode/:dcode* Get the conversion rate and accepts the following parameters
	- Source Currency Code
	- Converted Currency Code
* */paypal/getActivity* Gets a list of activities from the file system.


###Installation

* npm install 


###Run

* npm start
* Open http://localhost:3000/paypal/activity in web browser