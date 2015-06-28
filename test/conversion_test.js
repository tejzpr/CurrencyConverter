var converter = require('../scripts/currency.js');
var chai = require("chai");
var Q = require('q');
var chaiAsPromised = require("chai-as-promised");
var expect = chai.expect;
chai.use(chaiAsPromised);


describe('currency.js', function(){
    it('getRates()', function(){
        console.log(converter.getRates());
        return converter.getRates().then(function(data){
            expect(data).to.be.an("object");
        });
    })
});