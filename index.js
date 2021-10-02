// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static('public'));

// Chatroom
function shuffle(array) {
  // Shuffle in place
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}
var users = [];
var randomisedOrder = [];

io.on('connection', function (socket) {
  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('randomise', function (data) {
    randomisedOrder = users.slice();
    shuffle(randomisedOrder);
    io.emit('randomise', {
      username: socket.username,
      playerorder: randomisedOrder
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    if (addedUser) return;
    // we store the username in the socket session for this client
    // check username not already in use
    if (users.indexOf(username) == -1) {
      // IDs = shuffle(IDs);
      // socket.ID = IDs.pop();
      socket.username = username;
      users.push(username)
      addedUser = true;
      socket.emit('login', {
        randomisedOrder: randomisedOrder
      });
      // echo globally (all clients) that a person has connected
      io.emit('user joined', {
        username: socket.username,
        users: users
      });
    }
    else {
      socket.emit('duplicate username');
    };
  });

  // when the user disconnects, perform this
  socket.on('disconnect', function () {
    if (addedUser) {
      users.splice(users.indexOf(socket.username), 1);
      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        users: users
      });
      if (users.length == 0) {
        randomisedOrder = [];
      }
    }
  });
});