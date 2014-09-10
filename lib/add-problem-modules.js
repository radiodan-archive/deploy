var Q               = require('q'),
    QFS             = require('q-io/fs'),
    exec            = require(__dirname + '/exec'),
    precompiledPath = __dirname + '/../precompiled-npm';

module.exports = function(params) {
  // create node_modules
  var destinationPath = params.path + '/node_modules',
      package         = params.path + '/package.json',
      returnParams    = function() { return params; };

  return createNodeModulesDir()
    .then(readPackageJson)
    .then(copyProblemModules)
    .then(returnParams, returnParams);

  function createNodeModulesDir() {
    return QFS.makeTree(destinationPath);
  }

  function readPackageJson() {
    return QFS.read(package)
      .then(function(json) {
        return JSON.parse(json);
      });
  }

  function copyProblemModules(package) {
    return fetchProblemModules()
      .then(function(available) {
        return extractModules(available, package);
      });
  }

  function fetchProblemModules() {
    // returns all tars in precompiled path
    var suffix = 'tar.gz';

    return QFS.list(precompiledPath)
      .then(function(files) {
        return files.filter(function(f) {
          return f.indexOf(suffix, f.length - suffix.length) !== -1;
        });
      });
  }

  function extractModules(problemModules, package) {
    var modules = Object.keys(package.dependencies),
        execPromises = [];

    modules.forEach(function(m) {
      var tarBall = m + '.tar.gz',
          modulePath = destinationPath + '/' + m;

      if(problemModules.indexOf(tarBall) != -1) {
        var moduleExtract = QFS.makeDirectory(destination)
          .then(function() {
            return exec(
              'tar', ['xfz', tarBall, '-C', modulePath], precompiledPath
            );
          });

        execPromises.push(moduleExtract);
      }
    });

    return Q.all(execPromises);
  }
};
