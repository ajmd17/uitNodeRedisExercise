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
		description: "I am nothing but text on your monitor. I serve no other purpose."
	});
});

// redis functionality
client.on('connect', function() {
  console.log('redis is connected!');
});

// socket.io functionality
io.on('connection', function(socket){
  // the disconnect event; this triggers when the socket session is terminated (the user closes their browser window)
  socket.on('disconnect', function() {
    if (socket.username !== undefined) {
      console.log('the user '+socket.username+' disconnected...');
      // remove user from 'users'
      client.lrem('users', 0, socket.username, function(err, res) {
        if (!err) {
          // get 'users' list
          client.lrange('users', 0, -1, function(err, res) {
            if (!err) {
              // tell clients to update their list of logged users
              socket.emit('logged users', res);
              socket.broadcast.emit('logged users', res);
            } else {
              console.error(err);
            }
          });
        } else {
          console.error(err);
        }
      });
    }
  });

  socket.on('send message', function(msg) {
    // send msg object
    var message = { sender: socket.username, message: msg };
    client.rpush('messages', JSON.stringify(message), function(err, res) {
      if (!err) {
        console.log(res);
        socket.emit('new message', message);
        socket.broadcast.emit('new message', message);
      } else {
        console.error(err);
      }
    });
  });

  // listening for when you enter your name
  socket.on('enter name', function(name) {
  	socket.username = name;
    socket.broadcast.emit('last logged', name);   // broadcast the last logged user
    socket.emit('last logged', name);             // emit the last logged user
    
    // store user in db
    client.rpush('users', name, function(err, res) {
      if (!err) {
        // set last logged user to be me
        client.set('last_logged', name, function(err, res) {
          if (!err) {
            socket.broadcast.emit('last logged', name);
          } else {
            console.error(err);
          }
        });

        // tell clients to update their logged users list
        client.lrange('users', 0, -1, function(err, res) {
          if (!err) {
            socket.emit('logged users', res);
            socket.broadcast.emit('logged users', res);
          } else {
            console.error(err);
          }
        });
      } else {
        console.error(err);
      }
    });
  });

  client.get('last_logged', function(err, res) {
    if (!err) {
      socket.emit('last logged', res);
    } else {
      console.error(err);
    }
  });

  // show messages to user
  client.lrange('messages', 0, -1, function(err, res) {
    var messages = res.map(function(el) {
      try {
        return JSON.parse(el);
      } catch (ex) {
        return {};
      }
    });
    socket.emit('show messages', messages);
  });
});

http.listen(8080);
console.log("Listening on port 8080...");