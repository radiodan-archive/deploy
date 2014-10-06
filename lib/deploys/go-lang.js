var exec = require(__dirname + '/../exec'),
    fs   = require('fs'),
    Q    = require('q'),
    QFS  = require('q-io/fs');

module.exports = function(params) {
  return readGodeps(params)
    .then(makeGoPath)
    .then(crossCompile)
    .then(removeSource);
};

function readGodeps(params) {
    return QFS.read(package)
      .then(function(json) {
        return JSON.parse(json);
      })
      .then(function(goDeps) {
        params.goPath = params.path+'/src/'+goDeps['ImportPath'];

        return params;
      });
}

function makeGoPath(params) {
  QFS.makeTree(params.goPath)
    .then(function() {
      fs.readdirSync(dir).forEach(function(f) {
        if(f !== 'src') {
          console.log('moving', f);
          fs.renameSync(
            params.path+ '/' + f,
            params.goPath + '/' + f
          )
        }
      })
    })
    .then(function() { return params; });
}

function crossCompile(params) {
  console.log('crossCompile');
  var env = {
    'GOPATH': params.path,
    'PATH': '$PATH:/opt/go/bin',
    'GOOS': 'linux',
    'GOARCH': 'arm'
  };

  return exec('godep', ['restore'], params.goPath, env)
    .then(function() {
      return exec('go', ['build'], params.goPath, env)
    })
    .then(function() { return params; });
}

function removeSource(params) {
  console.log('removeSource (noOp)');
  return Q.resolve(params);
}
