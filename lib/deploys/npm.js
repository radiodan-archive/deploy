var exec              = require(__dirname + '/../exec'),
    addProblemModules = require(__dirname + '/../add-problem-modules');

module.exports = function(params) {
  return addProblemModules(params)
    .then(npmInstall)
    .then(deDupe)
    .then(prune);
};

function npmInstall(params) {
  return exec('npm', ['install', '--arch=arm'], params.path)
    .then(function() { return params; });
}

function deDupe(params) {
  return exec('npm', ['dedupe'], params.path)
    .then(function() { return params; });
}

function prune(params) {
  return exec('npm', ['prune', '--production'], params.path)
    .then(function() { return params; });
}

