var exec = require(__dirname + '/exec');

module.exports = function(params) {
  //cross compile
  //GOPATH=`pwd` GOOS=linux GOARCH=arm build
  //remove source
  return Q.resolve(params);
};
