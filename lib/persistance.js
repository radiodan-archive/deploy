var fs   = require('fs'),
    path = __dirname + '/../db.json';

// touch db file in case it doesnt exist
fs.openSync(path, 'a');

module.exports.create = function() {
  var instance = {};

  instance.data    = {};
  instance.store   = store;
  instance.fetch   = fetch;
  instance.erase   = erase;
  instance.isValidRepo = isValidRepo;

  instance.fetch();

  return instance;

  function fetch() {
    try {
      instance.data = JSON.parse(fs.readFileSync(path));
    } catch(err) {
      instance.data = {};
    }

    return instance.data;
  }

  function store(project, ref, data) {
    if(!instance.data.hasOwnProperty(project)){
      instance.data[project] = {};
    }

    instance.data[project][ref] = data;

    write();

    return instance.data;
  }

  function erase(project, ref) {
    var remainingRefs;

    if(!instance.data.hasOwnProperty(project)){
      console.log('no content for', project);
      return false;
    }

    remainingRefs = Object.keys(instance.data[project]);

    if(remainingRefs.length > 1) {
      console.log('erasing', project, ref);
      delete instance.data[project][ref];
    } else {
      console.log('erasing', project);
      delete instance.data[project];
    }

    write();
  }

  function write() {
    fs.writeFileSync(path, JSON.stringify(instance.data));
  }

  function isValidRepo(project, ref) {
    return instance.data.hasOwnProperty(project)
      && instance.data[project].hasOwnProperty(ref);
  }
}
