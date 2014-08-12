var fs   = require('fs'),
    path = __dirname + '/../db.json';

// touch db file in case it doesnt exist
fs.openSync(path, 'a');

module.exports.create = function() {
  var instance = {};

  instance.data    = {};
  instance.store   = store;
  instance.fetch   = fetch;
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
    fs.writeFileSync(path, JSON.stringify(instance.data));

    return instance.data;
  }

  function isValidRepo(project, ref) {
    return instance.data.hasOwnProperty(project)
      && instance.data[project].hasOwnProperty(ref);
  }
}
