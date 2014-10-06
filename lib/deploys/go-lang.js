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
  console.log('readGodeps');
  return QFS.read(params.path+'/Godeps/Godeps.json')
    .then(function(json) {
      return JSON.parse(json);
    })
  .then(function(goDeps) {
    params.goPath = params.path+'/src/'+goDeps['ImportPath'];
    console.log('goPath', params.goPath);

    return params;
  });
}

function makeGoPath(params) {
  console.log('makeGoPath');
  return QFS.makeTree(params.goPath)
    .then(function() {
      fs.readdirSync(params.path).forEach(function(f) {
        if(f !== 'src') {
          fs.renameSync(
            params.path+ '/' + f,
            params.goPath + '/' + f
          )
        }
      })

      return params;
    });
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
      return exec('go', ['build', '-v'], params.goPath, env)
    })
    .then(function(output) {
      //assume final output of build contains binary path
      var binary = output.stderr[output.stderr.length-1];

      fs.renameSync(params.path + '/src/' + binary, params.path);
      return params;
    });
}

function removeSource(params) {
  console.log('removeSource');
  return QFS.removeTree(params.path + '/src')
}
