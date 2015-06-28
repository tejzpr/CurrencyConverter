/**
 * Module dependencies.
 */

var http = require("http");
var fs = require('fs');
var path = require('path');
var url = require('url');
var Q = require('q');
var currencies = require('currencies');
var readline = require('readline');


var rate_utils = function () {
    var ratesUrl = "http://api.fixer.io/latest?base=USD";
    var outFile = path.resolve(__dirname, '../data/out.dat');
    var httpGet = function (opts) {
        var deferred = Q.defer();
        http.get(opts, deferred.resolve);
        return deferred.promise;
    };
    var getLatestRates = function () {
        var deferred = Q.defer();
        httpGet(url.parse(ratesUrl)).then(function (cresponse) {
            var buffer = "",
                data;
            cresponse.on("data", function (chunk) {
                buffer += chunk;
            });

            cresponse.on("end", function (data) {
                //saveRates(buffer);
                writeRatesToFile(JSON.parse(buffer));
                readRatesFromFile().then(function (out) {
                    deferred.resolve(out);
                })
            });
        });
        return deferred.promise;
    }
    var writeRatesToFile = function (obj) {
        var rates = obj.rates;
        var fileOut = [];
        for (var prop in rates) {
            if (rates.hasOwnProperty(prop)) {
                var rate = (parseFloat(rates[prop])).toFixed(2);
                var out = [prop, "=", currencies.get(prop).symbol, " ", rate];
                fileOut.push(out.join(""));
            }
        }
        fs.writeFileSync(outFile, fileOut.join("\n"), 'utf8');
    }
    var readRatesFromFile = function () {
        var deferred = Q.defer();
        var fileOut = {};
        fileOut.rates = {};
        var rd = readline.createInterface({
            input: fs.createReadStream(outFile),
            output: process.stdout,
            terminal: false
        });

        rd.on('line', function (line) {
            var temp = line.split("=");
            var currency = temp[0];
            var rateObj = temp[1];
            var temp2 = rateObj.split(" ");
            var symbol = temp2[0];
            var rate = temp2[1];
            fileOut.rates[currency] = {rate: rate, symbol: symbol};
        });

        rd.on("close", function (data) {
            deferred.resolve(fileOut);
        });
        return deferred.promise;
    }
    var respondJSON = function (response, out) {
        response.writeHeader(200, {"Content-Type": "application/json; charset=utf-8"});
        response.write(JSON.stringify(out));
        response.end();
    }
    var processInput = function (out, params) {
        var sSymbol = "";
        var dSymbol = "";
        var srate = 1;
        var drate = 1;
        var scode = (params.scode.toLowerCase() === "usd" ? "USD" : params.scode.toUpperCase());
        var dcode = (params.dcode.toLowerCase() === "usd" ? "USD" : params.dcode.toUpperCase());
        var change = params.change;
        var amount = (typeof change !== 'undefined') ? parseFloat(params.amount + "." + change) : parseFloat(params.amount);

        if (scode === "USD") {
            srate = 1;
            sSymbol = "$";
        }
        else {
            if (typeof out.rates[scode] !== 'undefined') {
                srate = parseFloat(out.rates[scode].rate);
                sSymbol = out.rates[scode].symbol;
            }
            else {
                throw new Error("From conversion code not found");
            }
        }

        if (dcode === "USD") {
            drate = 1;
            dSymbol = "$";
        }
        else {
            if (typeof out.rates[dcode] !== 'undefined') {
                drate = parseFloat(out.rates[dcode].rate);
                dSymbol = out.rates[dcode].symbol;
            }
            else {
                throw new Error("To conversion code not found");
            }
        }

        return {
            amount: amount,
            drate: drate,
            srate: srate,
            sSymbol: sSymbol,
            dSymbol: dSymbol,
            scode: scode,
            dcode: dcode
        };
    }
    return {
        /**
         * Get Latest Rate conversion from external webservice
         */
        getRates: function (request, response) {
            if (typeof request !== 'undefined') {
                getLatestRates().then(function (out) {
                    respondJSON(response, out);
                })
            }
            else {
                getLatestRates();
            }
        },
        /**
         * Get Rate conversion from stored file.
         */
        getOfflineRates: function (request, response) {
            if (typeof request !== 'undefined') {
                readRatesFromFile().then(function (out) {
                    respondJSON(response, out);
                })
            }
            else {
                return readRatesFromFile();
            }
        },
        /**
         * Get converted amount based on supplied currencies.
         * */
        currencyConversion: function (request, response, params) {
            readRatesFromFile().then(function (out) {

                var nOut = {};
                var mObj = processInput(out, params);
                try {
                    var mObj = processInput(out, params);
                    var dAmount = ((mObj.amount * mObj.drate) / mObj.srate).toFixed(2);
                    if (typeof mObj.amount !== 'undefined' && typeof mObj.drate !== 'undefined' && typeof mObj.srate !== 'undefined') {
                        nOut = {code: mObj.dcode, symbol: mObj.dSymbol, amount: dAmount};
                    }
                }
                catch (e) {
                    nOut.error = e.message;
                    nOut.code = 0;
                }
                finally {
                    respondJSON(response, nOut);
                }


            });
        },
        /**
         * Get current conversion rate between two currencies
         */
        conversionRate: function (request, response, params) {
            readRatesFromFile().then(function (out) {
                var nOut = {};
                try {
                    params.amount = 1;
                    var mObj = processInput(out, params);
                    var nOut = {};
                    if (typeof mObj.amount !== 'undefined' && typeof mObj.drate !== 'undefined' && typeof mObj.srate !== 'undefined') {
                        nOut = {rate: ((mObj.amount * mObj.drate) / mObj.srate).toFixed(2)};
                    }
                }
                catch (e) {
                    nOut.error = e.message;
                    nOut.code = 0;
                }
                finally {
                    respondJSON(response, nOut);
                }

            })
        },
        /**
         * Get a list of supported currencies.
         */
        getSupportedCurrencies: function (request, response) {
            readRatesFromFile().then(function (out) {
                var supp = [];
                supp.push("USD");
                for (var prop in out.rates) {
                    supp.push(prop);
                }
                respondJSON(response, {codes: supp});
            })
        }
    };
};
var rates = rate_utils();


module.exports.getRates = rates.getRates;
module.exports.getOfflineRates = rates.getOfflineRates;
module.exports.currencyConversion = rates.currencyConversion;
module.exports.conversionRate = rates.conversionRate;
module.exports.getSupportedCurrencies = rates.getSupportedCurrencies;