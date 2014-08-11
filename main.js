var express = require('express');
var app = express();
var hookContent = "";
var port = process.env.PORT || 3000;

app.post('/post-recieve', function(req, res){
  hookContent = req.body;
  res.send(hookContent);
});

app.get('/', function(req, res) {
  res.send(hookContent);
});

var bodyParser = require('body-parser');

app.use(bodyParser.json());

var server = app.listen(port, function() {
  console.log('Listening on port %d', server.address().port);
});

