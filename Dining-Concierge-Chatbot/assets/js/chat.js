var checkout = {};

AWS.config.region = 'us-east-1'
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
  IdentityPoolId: 'us-east-1:ff7f6b6e-5f27-4357-9b86-1a11c866f6ec'
}) 
lexRuntime = new AWS.LexRuntime();
$(document).ready(function() {
  var $messages = $('.messages-content'),
    d, h, m,
    i = 0;

  $(window).load(function() {
    $messages.mCustomScrollbar();
    insertResponseMessage('Hi there, I\'m your personal Concierge. How can I help?');
  });

  function updateScrollbar() {
    $messages.mCustomScrollbar("update").mCustomScrollbar('scrollTo', 'bottom', {
      scrollInertia: 10,
      timeout: 0
    });
  }

  function setDate() {
    d = new Date()
    if (m != d.getMinutes()) {
      m = d.getMinutes();
      $('<div class="timestamp">' + d.getHours() + ':' + m + '</div>').appendTo($('.message:last'));
    }
  }

  function callChatbotApi(message, retries = 3, delay = 1000) {
    console.log("Sending message to Lex:", message);
    var params = {
      botAlias: 'BotAlias',
      botName: 'DiningConciergeBot',
      inputText: message,
      userId: "mylexUserId"
    };
  
    return new Promise((resolve, reject) => {
      lexRuntime.postText(params, function (err, data) {
        if (err) {
          if (err.statusCode === 429 && retries > 0) {
            console.warn('Throttling error occurred. Retrying...');
            setTimeout(() => {
              const nextDelay = delay * 2 + Math.random() * 100;
              callChatbotApi(message, retries - 1, nextDelay).then(resolve).catch(reject);
            }, delay);
          } else {
            console.error('Error occurred while calling Lex:', err);
            reject(err);
          }
        } else {
          sessionAttributes = data.sessionAttributes;
          resolve(data);
        }
      });
    });
  }

  function insertMessage() {
    msg = $('.message-input').val();
    if ($.trim(msg) == '') {
      return false;
    }
    $('<div class="message message-personal">' + msg + '</div>').appendTo($('.mCSB_container')).addClass('new');
    setDate();
    $('.message-input').val(null);
    updateScrollbar();

    callChatbotApi(msg)
      .then((response) => {
        if(response.message){
          insertResponseMessage(response.message);
        }
        else{
          insertResponseMessage("Sorry, I didn't understand that.");
        }
      })
  }

  $('.message-submit').click(function() {
    insertMessage();
  });

  $(window).on('keydown', function(e) {
    if (e.which == 13) {
      insertMessage();
      return false;
    }
  })

  function insertResponseMessage(content) {
    $('<div class="message loading new"><figure class="avatar"><img src="https://media.tenor.com/images/4c347ea7198af12fd0a66790515f958f/tenor.gif" /></figure><span></span></div>').appendTo($('.mCSB_container'));
    updateScrollbar();

    setTimeout(function() {
      $('.message.loading').remove();
      $('<div class="message new"><figure class="avatar"><img src="https://media.tenor.com/images/4c347ea7198af12fd0a66790515f958f/tenor.gif" /></figure>' + content + '</div>').appendTo($('.mCSB_container')).addClass('new');
      setDate();
      updateScrollbar();
      i++;
    }, 500);
  }

});