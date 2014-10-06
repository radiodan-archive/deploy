var spawn = require('child_process').spawn;
    Q = require('q'),
    mergeObjects = require(__dirname + '/merge-objects');

/**
 * Wrap executing a command in a promise
 * @param  {string} command command to execute
 * @param  {Array<string>} args    Arguments to the command.
 * @param  {string} cwd     The working directory to run the command in.
 * @param  {Object} env     A set of environment variables
 * @return {Promise}        A promise for the completion of the command.
 */
module.exports = function exec(command, args, cwd, env) {
    if (!command || !cwd) {
        return Q.reject(new Error('Both command and working directory must be given, not ' + command + ' and ' + cwd));
    }
    if (args && !args.every(function (arg) {
        var type = typeof arg;
        return type === 'boolean' || type === 'string' || type === 'number';
    })) {
        return Q.reject(new Error('All arguments must be a boolean, string or number'));
    }

    console.log(command, args.join(' '), '# in', cwd);

    var deferred = Q.defer(),
        customEnv,
        stdout = [],
        stderr = [],
        proc;

    env = env || {};

    customEnv = mergeObjects(process.env, env),
    customEnv['HOME'] = cwd;

    proc = spawn(command, args, {
      cwd: cwd,
      env: customEnv
    });

    proc.stdout.setEncoding('utf8');
    proc.stderr.setEncoding('utf8');

    proc.stdout.on('data', function(data) {
      data.toString().split(/(\r?\n)/g).forEach(function(line) {
        console.log('stdout', command, line);
        stdout.push(line);
      });
    });

    proc.stderr.on('data', function(data) {
      data.toString().split(/(\r?\n)/g).forEach(function(line) {
        if(line.trim() != '') {
          console.warn('stderr', command, line);
          stderr.push(line);
        }
      });
    });

    proc.on('error', function (error) {
        deferred.reject(new Error(command + ' ' + args.join(' ') + ' in ' + cwd + ' encountered error ' + error.message));
    });

    proc.on('exit', function(code) {
        if (code !== 0) {
            deferred.reject(new Error(command + ' ' + args.join(' ') + ' in ' + cwd + ' exited with code ' + code));
        } else {
            deferred.resolve({stdout: stdout, stderr: stderr});
        }
    });

    return deferred.promise;
};
