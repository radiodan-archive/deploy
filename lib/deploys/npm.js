var exec              = require(__dirname + '/../exec'),
    addProblemModules = require(__dirname + '/../add-problem-modules');

function npmInstall(params) {
  return exec('npm', ['install', '--arch=arm'], params.path)
    .then(function() { return params; });
}

module.exports = function(params) {
  return addProblemModules(params).then(npmInstall);
};
