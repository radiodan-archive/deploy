var express        = require('express'),
    bodyParser     = require('body-parser'),
    methodOverride = require('method-override'),
    morgan         = require('morgan'),
    logfmt         = require('logfmt'),
    Deployment     = require(__dirname + '/lib/deployment'),
    persistance    = require(__dirname + '/lib/persistance').create();

var app  = express(),
    port = (process.env.PORT || 3000);

app.use(bodyParser.json());
app.use(methodOverride());
app.use(morgan('combined'));
app.use(logfmt.requestLogger());
app.use(express.static(__dirname + "/public"));

app.post('/post-hook', function(req, res){
  try {
    var deploy = Deployment.create(req.body);
    deploy.deploy();

    res.status(200).end();
  } catch(err) {
    console.warn(err);
    res.status(500).end();
  }
});

app.get('/', function(req, res) {
  var url = req.protocol + '://' + req.get('x-forwarded-host'),
      repos = persistance.fetch();

  for(var project in repos) {
    for(var ref in repos[project]) {
      if(repos[project][ref].hasOwnProperty("file")) {
        repos[project][ref]["file"] = url + repos[project][ref]["file"];
      }
    }
  }

  res.json(repos);
});

app.get('/releases/:owner/:repo/:ref', function(req, res) {
  var project = req.params['owner'] + '/' + req.params['repo'],
      ref     = req.params['ref'];

  persistance.fetch();

  if(persistance.isValidRepo(project, ref)) {
    var tarBall = persistance.data[project][ref].file;

    res.redirect(tarBall);
  } else {
    res.status(404).end();
  }
});

var server = app.listen(port, function() {
  console.log('Listening on port %d', server.address().port);
});
