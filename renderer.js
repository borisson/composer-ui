// Require all electron and nodeJS dependencies.
var app = require('electron').remote;
var dialog = app.dialog;
var fs = require('fs');
const exec = require('child_process').exec;

// Set up settings variable.
var settings = "";

main();

/**
 * Adds behavior to all elements.
 *
 * Delegates to readSettings to fill in the settings variable if a settings file
 * exists and tries to bind events and parses the composer file.
 */
function main() {
  bind_events();

  // Try to read settings from the settings.json file if that's found on disk.
  settings = readSettings();

  // Settings are found, so parse the json file, bind events, and show the
  // "remove" actions box.
  if (settings != false) {
    document.getElementById('actions_remove').classList.remove('visually-hidden')
    document.getElementById('actions_select').classList.add('visually-hidden')
    parse_composer_json();
  }

  // Add action to select button.
  document.getElementById('action__select').addEventListener('click', openFile);
}

/**
 * Parses the composer.json file to see if it's valid.
 *
 * Also checks to see if the composer-file has dependencies on drupal or is the
 * drupal core's composer.json.
 */
function parse_composer_json() {
  var composerfile = settings.fileName;
  var content = fs.readFileSync(composerfile, "utf8");
  var composer = JSON.parse(content);
  if (composer.name == '') {
    logMessage('No name in comopser.json, exiting.');
    remove_settings();
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

/**
 * Binds events to buttons.
 */
function bind_events() {
  document.getElementById('action__install')
    .addEventListener('click', run_composer_install);
  document.getElementById('action__update')
    .addEventListener('click', run_composer_update);
  document.getElementById('action__update_drupal')
    .addEventListener('click', run_drupal_update);
  document.getElementById('action__remove_settings')
    .addEventListener('click', remove_settings);
}

/**
 * Updates the drupal core package.
 */
function run_drupal_update() {
  showThrobber();
  var dir = settings.dir;
  logMessage('Updating drupal ' + dir);
  exec('cd ' + dir +'; composer update --with-dependencies drupal/core', (error, stdout, stderr) => {
    if (error) {
      logMessage(error);
      return;
    }
    logMessage(`stdout: ${stdout}`);
    logMessage(`stderr: ${stderr}`);
    logMessage('Drupal install done.');
    hideThrobber();
  });
}

/**
 * Installs all composer dependencies.
 */
function run_composer_install() {
  showThrobber();
  var dir = settings.dir;
  logMessage('Running composer install in ' + dir);
  exec('cd ' + dir +'; composer install', (error, stdout, stderr) => {
    if (error) {
      logMessage(error);
      return;
    }
    logMessage(`stdout: ${stdout}`);
    logMessage(`stderr: ${stderr}`);
    logMessage('Composer install done.');
    hideThrobber();
  });
}

/**
 * Updates all composer dependencies.
 */
function run_composer_update() {
  showThrobber();
  var dir = settings.dir;
  logMessage('Running composer update in ' + dir);
  exec('cd ' + dir +'; composer update --with-dependencies', (error, stdout, stderr) => {
    if (error) {
      logMessage(error);
      return;
    }
    logMessage(`stdout: ${stdout}`);
    logMessage(`stderr: ${stderr}`);
    logMessage('Composer update done.');
    hideThrobber();
  });
}

/**
 * Removes the settings.json file.
 */
function remove_settings() {
  document.getElementById('actions__composer').classList.add('visually-hidden');
  document.getElementById('actions__drupal').classList.add('visually-hidden');
  document.getElementById('actions_remove').classList.add('visually-hidden');
  document.getElementById('actions_select').classList.remove('visually-hidden');
  fs.unlink(__dirname + '/settings.json');
  logMessage('Settings file removed, starting over will allow you to select a new directory.');
}

/**
 * Opens a file using the dialog method.
 */
function openFile() {
  dialog.showOpenDialog(function (fileNames) {
    // fileNames is an array that contains all the selected files.
    if (fileNames === undefined) {
      logMessage("No file selected");
    }
    else {
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

/**
 * Writes the settings json blob into settings.json.
 */
function writeSettings(settings) {
  fs.writeFile(__dirname + '/settings.json', JSON.stringify( settings ), "utf8");
  setTimeout(function() { main(); }, 100);
}

/**
 * Try reading from the settings.json.
 */
function readSettings() {
  try {
    var content = fs.readFileSync(__dirname + '/settings.json', "utf8");
    logMessage('Read and parsed settings.json.');
    return JSON.parse(content);
  } catch (err) {
    logMessage('Failed to read settings.json.');
    return false;
  }
}

/**
 * Logs a message to the 'log' div.
 *
 * @param {string} message
 *  The message to be added to the log container.
 */
function logMessage(message) {
  var div = document.getElementById('log');
  div.innerHTML = div.innerHTML + `${message} <br />`;
}

/**
 * Hides the throbber.
 */
function hideThrobber() {
  document.getElementById('throbber').classList.add('visually-hidden');
}

/**
 * Shows the throbber.
 */
function showThrobber() {
  document.getElementById('throbber').classList.remove('visually-hidden');
}
