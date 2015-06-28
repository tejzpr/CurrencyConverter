/**
 * Module dependencies.
 */

var http = require("http");
var fs = require('fs');
var path = require('path');
var Q = require('q');

var data = require(path.resolve(__dirname, '../data/data.json'));

var transactions_util = function ( ) {
    var ratesUrl = "http://api.fixer.io/latest?base=USD";
    var outFile = path.resolve(__dirname, '../data/out.dat');
    var httpGet = function (opts) {
        var deferred = Q.defer();
        http.get(opts, deferred.resolve);
        return deferred.promise;
    };
    var respondJSON = function(response,out)
    {
        response.writeHeader(200, {"Content-Type": "application/json; charset=utf-8"});
        response.write(JSON.stringify(out));
        response.end();
    }
    return {
        /**
         * Gets all activities
         * */
        getActivity : function(request,response)
        {
            respondJSON(response,data);
        },
        /**
         * Displays the activity page
         * */
        getIndex : function(request,response)
        {
            fs.readFile(path.resolve(__dirname, '../html/index.html'), function (err, html) {
                if (err) {
                    throw err;
                }

                response.writeHeader(200, {"Content-Type": "text/html"});
                response.write(html);
                response.end();

            });
        }
    };
};
var transactions = transactions_util();



module.exports.getIndex = transactions.getIndex;
module.exports.getActivity = transactions.getActivity;
