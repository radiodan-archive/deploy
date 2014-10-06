var exec = require(__dirname + '/../exec'),
    Q    = require('q');

module.exports = function(params) {
  return crossCompile(params).then(removeSource);
};

function crossCompile(params) {
  console.log('crossCompile');
  var env = {
    'GOPATH': params.path,
    'PATH': '$PATH:/opt/go/bin',
    'GOOS': 'linux',
    'GOARCH': 'arm'
  };

  return exec('godep', ['restore'], params.path, env)
    .then(function() {
      return exec('go', ['build'], params.path, env)
    })
    .then(function() { return params; });
}

function removeSource(params) {
  console.log('removeSource (noOp)');
  return Q.resolve(params);
}
