var fs            = require('fs'),
    crypto        = require('crypto'),
    Q             = require('q'),
    QFS           = require('q-io/fs'),
    exec          = require(__dirname + '/exec'),
    persistance   = require(__dirname + '/persistance').create(),
    validate      = require(__dirname + '/validate-project'),
    dotDeployFile = require(__dirname + '/dot-deploy'),
    npmDeploy     = require(__dirname + '/deploys/npm'),
    golangDeploy  = require(__dirname + '/deploys/go-lang'),
    repoPath      = __dirname + '/../repos/',
    publicPath    = __dirname + '/../public/';

module.exports.create = function(params) {
  params = params || {};

  return validate(params).then(initialize);
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
      languageSteps = npmDeploy;
      break;
    case 'Go':
      languageSteps = golangDeploy;
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
