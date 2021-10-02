/* global io */

$(function() {
  var FADE_TIME = 150; // ms
  var TYPING_TIMER_LENGTH = 400; // ms
  var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
  ];
  var EMOJIS = [
    '🦖', '🦕', '🦔', '🦒',
    '🦓', '🧟', '🧞', '🧛',
    '🧚', '🧙', '🐩', '🦝'
  ];

  // Initialize variables
  var $window = $(window);
  var $usernameInput = $('.usernameInput'); // Input for username
  var $duplicateNameDiv = $('.duplicateNameDiv'); // Input for username
  var $messages = $('.messages'); // Messages area
  var $playerOrder = $('.playerOrder') // randomised player order area
  var $currentPlayers = $('.currentPlayers') // currently active players
  var $randomiseButton = $('.randomiseButton'); // Randomise Button

  var $loginPage = $('.login.page'); // The login page
  var $chatPage = $('.chat.page'); // The chatroom page

  // Prompt for setting a username
  var username;
  var connected = false;
  var $currentInput = $usernameInput.focus();

  var socket = io();

  // Sets the client's username
  function tryUsername () {
    username = cleanInput($usernameInput.val().trim());

    // If the username is valid
    if (username) {
      // Tell the server your username
      socket.emit('add user', username);
    }
  }

  // Tells the server to randomise
  function sendRandomise () {
    // if there is a non-empty message and a socket connection
    if (connected) {
      // tell server to execute 'new message' and send along one parameter
      socket.emit('randomise');
    }
  }
  
  function randomise (data) {
    log(data.username, 'pressed the randomise button');
    
    newplayerorder(data.playerorder);
  }
  
  function formatPlayer (player) {
    let playerEmoji = $('<span class="playeremoji"/>')
      .text(EMOJIS[getUsernameID(player)] +'\n')
      
    let usernameSpan = $('<span class="username"/>')
      .text(player)
      .css('color', COLORS[getUsernameID(player)])
      .css('display', 'inline-block');

    let formattedPlayer = $('<div class="formattedPlayer"/>')
      .append(usernameSpan);

    let playerDiv = $('<div class="player"/>')
      .append(playerEmoji)
      .append(formattedPlayer);
    
    return playerDiv
  }
  
  function newplayerorder (players) {
    
    // $playerOrder.css('opacity', 0);
    $playerOrder.empty();
    let player;
    for (let i=0; i<players.length; i++) {
      player = players[i]
      
      let playerDiv = formatPlayer(player)
        .css('opacity', 0)

      $playerOrder.append(playerDiv);
    };
    let children = $playerOrder.children('.player')
    let i = 0;
    // This is a little complicated, see https://code.tutsplus.com/tutorials/quick-tip-easy-sequential-animations-in-jquery--net-9435
    // It's a lambda function with itself as a callback to ensure sequential animation
    (function() {
      $(children[i++] || []).animate({'opacity': 1}, 1000, arguments.callee);
    })();
  }

  // Log a message
  function log (username, message) {
    var $usernameDiv = $('<span class="username"/>')
      .text(username)
      .css('color', COLORS[getUsernameID(username)]);
    var $messageBodyDiv = $('<span class="messageBody">')
      .text(message);
    
    var $messageDiv = $('<li class="message"/>')
      .data('username', username)
      .append($usernameDiv, $messageBodyDiv);
    
    addMessageElement($messageDiv);
  }

  function addMessageElement (el, options) {
    var $el = $(el);

    // Setup default options
    if (!options) {
      options = {};
    }
    if (typeof options.fade === 'undefined') {
      options.fade = true;
    }
    if (typeof options.prepend === 'undefined') {
      options.prepend = false;
    }

    // Apply options
    if (options.fade) {
      $el.hide().fadeIn(FADE_TIME);
    }
    if (options.prepend) {
      $messages.prepend($el);
    } else {
      $messages.append($el);
    }
    $messages[0].scrollTop = $messages[0].scrollHeight;
  }

  // Prevents input from having injected markup
  function cleanInput (input) {
    return $('<div/>').text(input).text();
  }

  // Gets the color of a username through our hash function
  function getUsernameID (username) {
    // Compute hash code
    var hash = 7;
    for (var i = 0; i < username.length; i++) {
       hash = username.charCodeAt(i) + (hash << 5) - hash;
    }
    // Calculate color
    var index = Math.abs(hash % COLORS.length);
    return index;
  }

  // Keyboard events

  $window.keydown(function (event) {
    // Auto-focus the current input when a key is typed
    if (!(event.ctrlKey || event.metaKey || event.altKey)) {
      $currentInput.focus();
    }
    // When the client hits ENTER on their keyboard
    if (event.which === 13) {
      if (! username) {
        tryUsername();
      }
    }
  });

  // Click events

  // Focus input when clicking anywhere on login page
  $loginPage.click(function () {
    $currentInput.focus();
  });

  // Focus input when clicking on the message input's border
  $randomiseButton.click(function () {
    sendRandomise();
  });

  // Socket events

  // Whenever the server emits 'login', fade the login screen
  socket.on('login', function (data) {
    
    newplayerorder(data.randomisedOrder);
    
    $loginPage.fadeOut();
    $chatPage.show();
    $loginPage.off('click');
    $currentInput = $randomiseButton.focus();
    
    connected = true;
  });

  // Whenever the server emits 'randomise', update
  socket.on('randomise', function (data) {
    randomise(data);
  });

  function refreshCurrentUsers (users) {
    $currentPlayers.empty();
    let player;
    for (let i=0; i<users.length; i++) {
      player = users[i]
      
      let playerDiv = formatPlayer(player)

      $currentPlayers.append(playerDiv);
    };
  };
  
  // Whenever the server emits 'user joined', log it in the chat body
  socket.on('user joined', function (data) {
    log(data.username, 'joined');
    refreshCurrentUsers(data.users);
  });

  // Whenever the server emits 'user left', log it in the chat body
  socket.on('user left', function (data) {
    log(data.username, 'left');
    refreshCurrentUsers(data.users);
  });
  
  socket.on('duplicate username', function (data) {
    $duplicateNameDiv.fadeIn();
    username = undefined;
  });

});