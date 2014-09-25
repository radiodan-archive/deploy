var Q             = require('q'),
    QFS           = require('q-io/fs');

module.exports = function(params) {
  return createDotDeploy(params)
    .then(function() { return params; });
}

function createDotDeploy(params) {
  var content = setContent(params);

  return writeToDisk(content, params);
}

function setContent(params) {
  var content = {
    name: params.fullName,
    ref:  params.ref,
    commit: params.commit
  };

  return JSON.stringify(content);
}

function writeToDisk(content, params) {
  var dotFilePath = params.path + '/.deploy';

  console.log('writing to', dotFilePath, content);

  return QFS.write(dotFilePath, content);
}
