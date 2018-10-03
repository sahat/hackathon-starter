/* eslint-env jquery, browser  */
/* global AgoraRTC */
if (!AgoraRTC.checkSystemRequirements()) {
  AgoraRTC.Logger.error('Your browser does not support WebRTC!');
}
let client;
let localStream;
let camera;
let microphone;

const audioSelect = document.querySelector('select#audioSource');
const videoSelect = document.querySelector('select#videoSource');

function join() {// eslint-disable-line
  document.getElementById('join').disabled = true;
  document.getElementById('video').disabled = true;
  let channelKey = null;

  console.log(`Init AgoraRTC client with App ID: ${appId.value}`); // eslint-disable-line
  client = AgoraRTC.createClient({ mode: 'interop' });
  client.init(appId.value,// eslint-disable-line
    () => {
      console.log('AgoraRTC client initialized');
      client.join(channelKey,
        channel.value,// eslint-disable-line
        null,
        (uid) => {
          console.log(`User ${uid} join channel successfully`);

          if (document.getElementById('video').checked) {
            camera = videoSource.value;// eslint-disable-line
            microphone = audioSource.value;// eslint-disable-line
            localStream = AgoraRTC.createStream({
              streamID: uid,
              audio: true,
              cameraId: camera,
              microphoneId: microphone,
              video: document.getElementById('video').checked,
              screen: false
            });
            localStream = AgoraRTC.createStream({
              streamID: uid,
              audio: false,
              cameraId: camera,
              microphoneId: microphone,
              video: false,
              screen: true,
              extensionId: 'minllpmhdgpndnkomcoccfekfegnlikg'
            });
            if (document.getElementById('video').checked) {
              localStream.setVideoProfile('720p_3');
            }

            // The user has granted access to the camera and mic.
            localStream.on('accessAllowed', () => {
              console.log('accessAllowed');
            });

            // The user has denied access to the camera and mic.
            localStream.on('accessDenied', () => {
              console.log('accessDenied');
            });

            localStream.init(() => {
              console.log('getUserMedia successfully');
              localStream.play('agora_local');

              client.publish(localStream, (err) => {
                console.log(`Publish local stream error: ${err}`);
              });

              client.on('stream-published', (evt) => {
                console.log(`Publish local stream successfully ${evt}`);
              });
            },
            (err) => {
              console.log('getUserMedia failed', err);
            });
          }
        },
        (err) => {
          console.log('Join channel failed', err);
        });
    },
    (err) => {
      console.log('AgoraRTC client init failed', err);
    });

  channelKey = '';
  client.on('error', (err) => {
    console.log('Got error msg:', err.reason);
    if (err.reason === 'DYNAMIC_KEY_TIMEOUT') {
      client.renewChannelKey(channelKey,
        () => {
          console.log('Renew channel key successfully');
        },
        (err) => {
          console.log('Renew channel key failed: ', err);
        });
    }
  });

  client.on('stream-added', (evt) => {
    const { stream } = evt.stream;
    console.log(`New stream added: ${stream.getId()}`);
    console.log('Subscribe ', stream);
    client.subscribe(stream, (err) => {
      console.log('Subscribe stream failed', err);
    });
  });

  client.on('stream-subscribed', (evt) => {
    const { stream } = evt.stream;
    console.log(`Subscribe remote stream successfully: ${stream.getId()}`);
    if ($(`div#video #agora_remote${stream.getId()}`).length === 0) {
      $('div#video').append(`<div id="agora_remote${stream.getId()}" style="float:left; width:810px;height:607px;display:inline-block;"></div>`);
    }
    stream.play(`agora_remote${stream.getId()}`);
  });

  client.on('stream-removed', (evt) => {
    const { stream } = evt.stream;
    stream.stop();
    $(`#agora_remote${stream.getId()}`).remove();
    console.log(`Remote stream is removed ${stream.getId()}`);
  });

  client.on('peer-leave', (evt) => {
    const { stream } = evt.stream;
    if (stream) {
      stream.stop();
      $(`#agora_remote${stream.getId()}`).remove();
      console.log(`${evt.uid} leaved from this channel`);
    }
  });
}

function leave() {// eslint-disable-line
  document.getElementById('leave').disabled = true;
  client.leave(() => {
    console.log('Leavel channel successfully');
  },
  (err) => {
    console.log(`Leave channel failed ${err}`);
  });
}

function publish() {// eslint-disable-line
  document.getElementById('publish').disabled = true;
  document.getElementById('unpublish').disabled = false;
  client.publish(localStream, (err) => {
    console.log(`Publish local stream error: ${err}`);
  });
}

function unpublish() {// eslint-disable-line
  document.getElementById('publish').disabled = false;
  document.getElementById('unpublish').disabled = true;
  client.unpublish(localStream, (err) => {
    console.log(`Unpublish local stream failed${err}`);
  });
}

function getDevices() {
  AgoraRTC.getDevices((devices) => {
    for (let i = 0; i !== devices.length; ++i) {
      const device = devices[i];
      const option = document.createElement('option');
      option.value = device.deviceId;
      if (device.kind === 'audioinput') {
        option.text = device.label || `microphone ${audioSelect.length + 1}`;
        audioSelect.appendChild(option);
      } else if (device.kind === 'videoinput') {
        option.text = device.label || `camera ${videoSelect.length + 1}`;
        videoSelect.appendChild(option);
      } else {
        console.log('Some other kind of source/device: ', device);
      }
    }
  });
}

audioSelect.onchange = getDevices;
videoSelect.onchange = getDevices;
getDevices();
