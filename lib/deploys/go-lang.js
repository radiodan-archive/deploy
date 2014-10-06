var exec = require(__dirname + '/../exec'),
    fs   = require('fs'),
    Q    = require('q'),
    QFS  = require('q-io/fs'),
    goBinPath = '/opt/go/bin';

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
    'PATH': process.env.PATH + ':' + goBinPath,
    'GOOS': 'linux',
    'GOARCH': 'arm'
  };

  return exec('godep', ['restore'], params.goPath, env)
    .then(function() {
      return exec('go', ['build', '-v'], params.goPath, env)
    })
    .then(function(output) {
      //assume final output of build contains binary path
      var binaryPath = output.stderr[output.stderr.length-1],
          binaryArr  = binaryPath.split('/')
          binary     = binaryArr.pop();

      if(fs.existsSync(binaryPath)) {
        console.log('goBin', binary);
        fs.renameSync(params.goPath +'/'+ binary, params.path +'/'+ binary);
        return params;
      } else {
        return Q.reject('Could not find binary at ' + binaryPath);
      }
    });
}

function removeSource(params) {
  console.log('removeSource');
  return QFS.removeTree(params.path + '/src')
    .then(function() {
      return params;
    });
}
