var Q             = require('q'),
    whitelist     = require(__dirname + '/../whitelist.json'),
    essentialKeys = ['repository', 'ref', 'head_commit'];

module.exports = function(params) {
  var dfd = Q.defer(),
      repoName,
      progLang;

  essentialKeys.forEach(function(key) {
    if(!params.hasOwnProperty(key)) {
      return dfd.reject(new Error('Missing key ' + key));
    }
  });

  if(params.hasOwnProperty('repository') && params.repository.hasOwnProperty('full_name')) {
    repoName = params['repository']['full_name'];

    if(whitelist.indexOf(repoName) === -1) {
      dfd.reject(new Error('Repository "'+ repoName +'" not in whitelist'));
    }
  }

  if(!dfd.promise.isRejected()) {
    dfd.resolve(params);
  }

  return dfd.promise;
};
