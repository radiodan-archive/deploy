var fs            = require('fs'),
    crypto        = require('crypto'),
    Q             = require('q'),
    QFS           = require('q-io/fs'),
    exec          = require(__dirname + '/exec'),
    persistance   = require(__dirname + '/persistance').create(),
    whitelist     = require(__dirname + '/../whitelist.json'),
    essentialKeys = ['repository', 'ref', 'head_commit'],
    repoPath      = __dirname + '/../repos/',
    publicPath    = __dirname + '/../public/';

module.exports.create = function(params) {
  params = params || {};

  var instance = {},
      refs;

  essentialKeys.forEach(function(key) {
    if(!params.hasOwnProperty(key)) {
      throw new Error('Missing key ' + key);
    }
  });

  refs = params['ref'].split('/');

  instance.name     = params['repository']['name'];
  instance.fullName = params['repository']['full_name'];
  instance.path     = repoPath + instance.fullName
  instance.clone    = params['repository']['clone_url'];
  instance.ref      = refs[refs.length-1];
  instance.commit   = params['head_commit']['id'];

  instance.deploy = deploy;

  if(whitelist.indexOf(instance.fullName) === -1) {
    throw new Error('Repository "'+ instance.fullName +'" not in whitelist');
  }

  return instance;

  function deploy() {
    return createDirectory(instance)
      .then(cloneRepository)
      .then(updateHead)
      .then(npmInstall)
      .then(tarBall)
      .then(hashTarball)
      .then(updateListings)
      .then(null, console.warn);
  }
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

function npmInstall(params) {
  return exec('npm', ['install'], params.path)
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
    file: params.tarBall.split("public")[1],
    sha1: params.hash,
    updated: new Date()
  };

  persistance.store(params.fullName, params.ref, data);

  return data;
}
