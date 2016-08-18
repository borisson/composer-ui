var app = require('electron').remote;
var dialog = app.dialog;
var fs = require('fs'); // Load the File System to execute our common tasks (CRUD)
const exec = require('child_process').exec;

var settings = "";
var is_drupal = false;

settings = readSettings()
if (settings == false) {
  openFile();
  settings = readSettings();
}
if (settings != false) {
  document.getElementById('actions_remove').classList.remove('visually-hidden')
  parse_composer_json();
  bind_events();
}

function parse_composer_json() {
  var composerfile = settings.fileName;
  var content = fs.readFileSync(composerfile, "utf8");
  var composer = JSON.parse(content);
  if (composer.name == '') {
    return;
  }
  document.getElementById('actions__composer').classList.remove('visually-hidden')
  logMessage('parsed composer.json');

  if (composer.name == 'drupal/drupal') {
    document.getElementById('actions__drupal').classList.remove('visually-hidden')
    logMessage('It\'s a drupal.');
  }

  for (var k in composer.require) {
    if (k == 'drupal/core') {
      document.getElementById('actions__drupal').classList.remove('visually-hidden')
      logMessage('It\'s a drupal.');
    }
  }
}

function bind_events() {
  document.getElementById('action__install').addEventListener('click', run_composer_install);
  document.getElementById('action__update').addEventListener('click', run_composer_update);
  document.getElementById('action__update_drupal').addEventListener('click', run_drupal_update);
  document.getElementById('action__remove_settings').addEventListener('click', remove_settings);
}

function run_drupal_update() {
  var dir = settings.dir;
  logMessage('Updating drupal ' + dir);
  exec('cd ' + dir +'; composer update drupal/core', (error, stdout, stderr) => {
    if (error) {
      logMessage(error);
      return;
    }
    logMessage(`stdout: ${stdout}`);
    logMessage(`stderr: ${stderr}`);
  });
}

function run_composer_install() {
  var dir = settings.dir;
  logMessage('Running composer install in ' + dir);
  exec('cd ' + dir +'; composer install', (error, stdout, stderr) => {
    if (error) {
      logMessage(error);
      return;
    }
    logMessage(`stdout: ${stdout}`);
    logMessage(`stderr: ${stderr}`);
  });
}

function run_composer_update() {
  var dir = settings.dir;
  logMessage('Running composer update in ' + dir);
  exec('cd ' + dir +'; composer update', (error, stdout, stderr) => {
    if (error) {
      logMessage(error);
      return;
    }
    logMessage(`stdout: ${stdout}`);
    logMessage(`stderr: ${stderr}`);
  });
}

function remove_settings() {
  fs.unlink(__dirname + '/settings.json');
  logMessage('Settings file removed, starting over will allow you to select a new directory.');
}

/**
 * Opens a file using the dialog method.
 */
function openFile() {
  dialog.showOpenDialog(function (fileNames) {
    // fileNames is an array that contains all the selected
    if(fileNames === undefined){
      logMessage("No file selected");
    }
    else{
      var fileName = fileNames[0];
      if (fileName.indexOf('composer.json') == -1) {
        logMessage('not a composer file.');
        return false;
      }
      // remove 'composer.json' from the filename to get
      // the directory.
      settings = {
        dir: fileName.replace(/composer\.json/g, ''),
        fileName: fileName
      }
      writeSettings(settings);
    }
  });
}

function writeSettings(settings) {
  fs.writeFile(__dirname + '/settings.json', JSON.stringify( settings ), "utf8");
}

function readSettings() {
  try {
    var content = fs.readFileSync(__dirname + '/settings.json', "utf8");
    return JSON.parse(content);
  } catch (err) {
    return false;
  }
}

/**
 * Logs a message to the 'log' div.
 */
function logMessage(message) {
  var div = document.getElementById('log');
  div.innerHTML = div.innerHTML + `${message} <br />`;
}
