var fs = require('fs');
var os = require('os');
var blessed = require('blessed');
var multiline = require('multiline');

if (os.platform() === 'win32') {
  console.log('**************************************************************');
  console.log('Hackathon Starter Generator has been disabled on Windows until');
  console.log('https://github.com/chjj/blessed fixes the issue #179.');
  console.log('**************************************************************');
  process.exit();
}

var screen = blessed.screen({
  autoPadding: true
});

screen.key('q', function() {
  process.exit(0);
});

var home = blessed.list({
  parent: screen,
  padding: { top: 2 },
  mouse: true,
  keys: true,
  fg: 'white',
  bg: 'blue',
  selectedFg: 'blue',
  selectedBg: 'white',
  items: [
    '» CHANGE EMAIL SERVICE',
    '» ADD NODE.JS CLUSTER SUPPORT',
    '» EXIT'
  ]
});

var homeTitle = blessed.text({
  parent: screen,
  align: 'center',
  fg: 'blue',
  bg: 'white',
  content: 'Hackathon Starter (c) 2014'
});

var footer = blessed.text({
  parent: screen,
  bottom: 0,
  fg: 'white',
  bg: 'blue',
  tags: true,
  content: ' {cyan-fg}<Up/Down>{/cyan-fg} moves | {cyan-fg}<Enter>{/cyan-fg} selects | {cyan-fg}<q>{/cyan-fg} exits'
});

var inner = blessed.form({
  top: 'center',
  left: 'center',
  mouse: true,
  keys: true,
  width: 33,
  height: 10,
  border: {
    type: 'line',
    fg: 'white',
    bg: 'red'
  },
  fg: 'white',
  bg: 'red'
});

var success = blessed.box({
  top: 'center',
  left: 'center',
  mouse: true,
  keys: true,
  tags: true,
  width: '50%',
  height: '40%',
  border: {
    type: 'line',
    fg: 'white',
    bg: 'green'
  },
  fg: 'white',
  bg: 'green',
  padding: 1
});

success.on('keypress', function() {
  home.focus();
  home.remove(success);
});

var clusterText = blessed.text({
  top: 'top',
  bg: 'red',
  fg: 'white',
  tags: true,
  content: 'Take advantage of multi-core systems using built-in {underline}cluster{/underline} module.'
});


var enable = blessed.button({
  parent: inner,
  bottom: 0,
  mouse: true,
  shrink: true,
  name: 'enable',
  content: ' ENABLE ',
  border: {
    type: 'line',
    fg: 'white',
    bg: 'red'
  },
  style: {
    fg: 'white',
    bg: 'red',
    focus: {
      fg: 'red',
      bg: 'white'
    }
  }
});


var disable = blessed.button({
  parent: inner,
  bottom: 0,
  left: 10,
  mouse: true,
  shrink: true,
  name: 'disable',
  content: ' DISABLE ',
  border: {
    type: 'line',
    fg: 'white',
    bg: 'red'
  },
  style: {
    fg: 'white',
    bg: 'red',
    focus: {
      fg: 'red',
      bg: 'white'
    }
  }
});

var cancel = blessed.button({
  parent: inner,
  bottom: 0,
  left: 21,
  mouse: true,
  shrink: true,
  name: 'cancel',
  content: ' CANCEL ',
  border: {
    type: 'line',
    fg: 'white',
    bg: 'red'
  },
  style: {
    fg: 'white',
    bg: 'red',
    focus: {
      fg: 'red',
      bg: 'white'
    }
  }
});

cancel.on('press', function() {
  home.focus();
  home.remove(inner);
  screen.render();

});


var emailForm = blessed.form({
  mouse: true,
  keys: true,
  fg: 'white',
  bg: 'blue',
  padding: { left: 1, right: 1 }
});

emailForm.on('submit', function() {
  var contactCtrl = fs.readFileSync('controllers/contact.js').toString().split(os.EOL);
  var userCtrl = fs.readFileSync('controllers/user.js').toString().split(os.EOL);
  var choice = null;

  if (sendgridRadio.checked) {
    choice = 'SendGrid';
  } else if (mailgunRadio.checked) {
    choice = 'Mailgun';
  } else if (mandrillRadio.checked) {
    choice = 'Mandrill';
  }

  var index = contactCtrl.indexOf('var transporter = nodemailer.createTransport({');
  contactCtrl.splice(index + 1, 1, "  service: '" + choice + "',");
  contactCtrl.splice(index + 3, 1, '    user: secrets.' + choice.toLowerCase() +'.user,');
  contactCtrl.splice(index + 4, 1, '    pass: secrets.' + choice.toLowerCase() + '.password');
  fs.writeFileSync('controllers/contact.js', contactCtrl.join(os.EOL));

  index = userCtrl.indexOf('      var transporter = nodemailer.createTransport({');
  userCtrl.splice(index + 1, 1, "        service: '" + choice + "',");
  userCtrl.splice(index + 3, 1, '          user: secrets.' + choice.toLowerCase() + '.user,');
  userCtrl.splice(index + 4, 1, '          pass: secrets.' + choice.toLowerCase() + '.password');
  index = userCtrl.indexOf('      var transporter = nodemailer.createTransport({', (index + 1));
  userCtrl.splice(index + 1, 1, "        service: '" + choice + "',");
  userCtrl.splice(index + 3, 1, '          user: secrets.' + choice.toLowerCase() + '.user,');
  userCtrl.splice(index + 4, 1, '          pass: secrets.' + choice.toLowerCase() + '.password');
  fs.writeFileSync('controllers/user.js', userCtrl.join(os.EOL));

  home.remove(emailForm);
  home.append(success);
  success.setContent('Email Service has been switched to ' + choice);
  success.focus();
  screen.render();
});

var emailText = blessed.text({
  parent: emailForm,
  content: 'Select one of the following email service providers for {underline}contact form{/underline} and {underline}password reset{/underline}.',
  padding: 1,
  bg: 'red',
  fg: 'white',
  tags: true
});

var sendgridRadio = blessed.radiobutton({
  parent: emailForm,
  top: 5,
  checked: true,
  mouse: true,
  fg: 'white',
  bg: 'blue',
  content: 'SendGrid'
});

var mailgunRadio = blessed.radiobutton({
  parent: emailForm,
  top: 6,
  mouse: true,
  fg: 'white',
  bg: 'blue',
  content: 'Mailgun'
});

var mandrillRadio = blessed.radiobutton({
  parent: emailForm,
  top: 7,
  mouse: true,
  fg: 'white',
  bg: 'blue',
  content: 'Mandrill'
});

var emailSubmit = blessed.button({
  parent: emailForm,
  top: 9,
  mouse: true,
  shrink: true,
  name: 'submit',
  content: ' SUBMIT ',
  style: {
    fg: 'blue',
    bg: 'white',
    focus: {
      fg: 'white',
      bg: 'red'
    }
  }
});

emailSubmit.on('press', function() {
  emailForm.submit();
});

var emailCancel = blessed.button({
  parent: emailForm,
  top: 9,
  left: 9,
  mouse: true,
  shrink: true,
  name: 'cancel',
  content: ' CANCEL ',
  style: {
    fg: 'blue',
    bg: 'white',
    focus: {
      fg: 'white',
      bg: 'red'
    }
  }
});

emailCancel.on('press', function() {
  home.focus();
  home.remove(emailForm);
  screen.render();

});

home.on('select', function(child, index) {
  switch (index) {
    case 0:
      home.append(emailForm);
      emailForm.focus();
      break;
    case 1:
      addClusterSupport();
      home.append(success);
      success.setContent('New file {underline}cluster_app.js{/underline} has been created. Your app is now able to use more than 1 CPU by running {underline}node cluster_app.js{/underline}, which in turn spawns multiple instances of {underline}app.js{/underline}');
      success.focus();
      screen.render();
      break;
    default:
      process.exit(0);
  }
});

screen.render();


function addClusterSupport() {

  var fileContents = multiline(function() {
/*
var os = require('os');
var cluster = require('cluster');

cluster.setupMaster({
  exec: 'app.js'
});

cluster.on('exit', function(worker) {
  console.log('worker ' + worker.id + ' died');
  cluster.fork();
});

for (var i = 0; i < os.cpus().length; i++) {
  cluster.fork();
}
*/
  });

  fs.writeFileSync('cluster_app.js', fileContents);
}
