var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var bodyParser = require('body-parser');
var redis = require('redis');
var client = redis.createClient(); //creates a new redis client

// set up to accept json as parameters
app.use(bodyParser.json());

// @NOTE: do this if you want to change the default directory for views, which is /views
app.set('views', path.join(__dirname, '/templates'));

// set the view engine to ejs
app.set('view engine', 'ejs');

// set the static path (for css, js, etc.)
app.use('/css', express.static(path.join(__dirname, 'public/css')));

// routes via express
app.get('/', function(req, res) {

	res.render('index', {
		description: "Gentlemen, you can't fight in here! This is the War Room."
	});
});

// redis functionality
client.on('connect', function() {

    // @TODO1: you should see this in your terminal window if you are connected to redis
    console.log('redis is connected!');
});

// socket.io functionality
io.on('connection', function(socket){

  console.log('a user connected via sockets');

  // the disconnect event; this triggers when the socket session is terminated (the user closes their browser window)
  socket.on('disconnect', function() {
    
    console.log('the user '+socket.username+' disconnected...');
    // @TODO4: you should be removing your usernames from the set here. Remember to emit the changes!

  });

  socket.on('send message', function(msg) {

    var newmessage = "<strong>"+socket.username+":</strong> "+msg;

    // @TODO3: add your message to the list here! Remember to emit!
  });

  // listening for when you enter your name
  socket.on('enter name', function(name) {

  	socket.username = name;
    socket.broadcast.emit('last logged', name);   // broadcast the last logged user
    socket.emit('last logged', name);             // emit the last logged user

    // @TODO2: save your username as a redis string here! Remember to emit the changes!
    // @TODO4: save your list of usernames here! Remember to emit!
  });

  // logged user functionality; this is triggered when the user opens the browser

  // @TODO3: grab the messages list from redis and emit them here!
  // @TODO1: show the last logged user via get()
  // @TODO4: get the set of usernames from redis via smembers()
  
});

http.listen(8080);
console.log("Listening on port 8080...");