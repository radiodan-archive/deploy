var fs            = require('fs'),
    crypto        = require('crypto'),
    Q             = require('q'),
    QFS           = require('q-io/fs'),
    exec          = require(__dirname + '/exec'),
    persistance   = require(__dirname + '/persistance').create(),
    whitelist     = require(__dirname + '/../whitelist.json'),
    dotDeployFile = require(__dirname + '/dot-deploy'),
    npmDeploy     = require(__dirname + '/deploys/npm'),
    essentialKeys = ['repository', 'ref', 'head_commit'],
    repoPath      = __dirname + '/../repos/',
    publicPath    = __dirname + '/../public/',
    validLangs    = ['JavaScript', 'Go'];

module.exports.create = function(params) {
  params = params || {};

  return validate(params).then(initialize);
}

function validate(params) {
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

    progLang = params['repository']['language'];

    if(validLangs.indexOf(progLang) === -1){
      dfd.reject(new Error('Language "'+ progLang +'" not in whitelist'));
    }
  }

  if(!dfd.promise.isRejected()) {
    dfd.resolve(params);
  }

  return dfd.promise;
}

function initialize(params) {
  var instance = {},
      refs     = params['ref'].split('/'),
      languageSteps;

  instance.name     = params['repository']['name'];
  instance.fullName = params['repository']['full_name'];
  instance.clone    = params['repository']['clone_url'];
  instance.ref      = refs[refs.length-1];
  instance.language = params['repository']['language'];

  try {
    instance.commit   = params['head_commit']['id'];
    instance.path     = repoPath + instance.fullName + '_' + instance.ref + '_' + instance.commit.substr(0,6);
  } catch(err) {
    console.warn(err);
  }

  switch(instance.language) {
    case 'JavaScript':
      languageSteps = npmDeploy(params);
      break;
    case 'Go':
      languageSteps = function(params) {
        //cross compile
        //remove source
        return Q.resolve(params);
      };
      break;
    default:
      console.warn('unknown language', instance.language);
      languageSteps = function(params) {
        return Q.resolve(params);
      }
  }

  instance.deploy = function() {
    return createDirectory(instance)
      .then(cloneRepository)
      .then(updateHead)
      .then(removeDotGit)
      .then(languageSteps)
      .then(dotDeployFile)
      .then(tarBall)
      .then(hashTarball)
      .then(updateListings)
      .then(cleanUp)
      .then(null, console.warn);
  }

  instance.erase = function() {
    console.log('erasing');
    return persistance.erase(instance.fullName, instance.ref);
  }

  return instance;
}

function createDirectory(params) {
  var mkdir = function() {
    return QFS.makeTree(params.path)
  };

  return QFS.removeTree(params.path)
    .then(mkdir, mkdir)
    .then(function() { return params; });
}

function cloneRepository(params) {
  return exec('git', ['clone', params.clone, params.path], repoPath)
    .then(function() { return params; });
}

function updateHead(params) {
  return exec('git', ['checkout', params.commit], params.path)
    .then(function() { return params; });
}

function removeDotGit(params) {
  var dotGit = params.path + '/.git';

  return QFS.removeTree(dotGit)
    .then(function() { return params; });
}

function tarBall(params) {
  var tarPath = publicPath + params.name + '/',
      tarFile = params.name + '-' + params.ref + '-' +
        params.commit.substr(0,6) + '.tar.gz';

  return QFS.makeTree(tarPath).then(function() {
    return exec('tar', ['cfz', tarPath + tarFile, '.'], params.path)
  }).then(function() {
    params.tarBall = tarPath + tarFile;

    return params;
  });
}

function hashTarball(params) {
  var fd = fs.createReadStream(params.tarBall),
      hash = crypto.createHash('sha1'),
      hashed = Q.defer();

  hash.setEncoding('hex');

  fd.on('end', function() {
    hash.end();
    params.hash = hash.read();
    console.log('hashed', params);
    hashed.resolve(params);
  });

  // read all file and pipe it (write it) to the hash object
  fd.pipe(hash);

  return hashed.promise;
}

function updateListings(params) {
  var data = {
    file: params.tarBall.split('public')[1],
    sha1: params.hash,
    commit: params.commit,
    updated: new Date()
  };

  persistance.store(params.fullName, params.ref, data);

  return Q.fulfill(params);
}

function cleanUp(params) {
  var dirParts     = params.tarBall.split('/'),
      currentTar   = dirParts.pop(),
      dir          = dirParts.join('/');
      tarBallRegex = new RegExp(
        '^' + params.name + '\-' + params.ref + '\-' + '\\w+\.tar\.gz$'
      );

  fs.readdirSync(dir).forEach(function(d) {
    // remove old tar files
    if(tarBallRegex.exec(d) && d != currentTar) {
      fs.unlinkSync(dir + '/' + d);
    }
  });

  // remove source directory
  return QFS.removeTree(params.path)
}
