var fs   = require('fs'),
    path = __dirname + '/../db.json';

fs.openSync(path, 'a');

module.exports.create = function() {
  var instance = {};

  instance.data  = {};
  instance.store = store;
  instance.fetch = fetch;

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
}
