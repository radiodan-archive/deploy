var Q             = require('q'),
    QFS           = require('q-io/fs');

module.exports = function(params) {
  return createDotDeploy(params)
    .then(function() { return params; });
}

function createDotDeploy(params) {
  return setContent(params)
    .then(function(content) {
      return writeToDisk(content, params);
    });
}

function setContent(params) {
  var content = {
    name: params.fullName,
    ref:  params.ref,
    commit: params.commit
  };

  return JSON.stringify(params);
}

function writeToDisk(content, params) {
  var dotFilePath = params.path + '/.deploy';
  return QFS.write(dotFilePath, content);
}
