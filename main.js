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
  res.json(persistance.data);
});

var server = app.listen(port, function() {
  console.log('Listening on port %d', server.address().port);
});
