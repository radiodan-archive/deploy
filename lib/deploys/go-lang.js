var exec = require(__dirname + '/../exec'),
    Q    = require('q');

module.exports = function(params) {
  return crossCompile(params).then(removeSource);
};

function crossCompile(params) {
  //GOPATH=`pwd` GOOS=linux GOARCH=arm /opt/go/bin/go build
  console.log('crossCompile');
  var env = {
    'GOPATH': params.path,
    'GOOS': 'linux',
    'GOARCH': 'arm'
  };

  return exec('/opt/go/bin/go', ['build'], params.path, env)
    .then(function() { return params; });
}

function removeSource(params) {
  console.log('removeSource (noOp)');
  return Q.resolve(params);
}
