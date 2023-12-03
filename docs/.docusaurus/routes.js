import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/__docusaurus/debug',
    component: ComponentCreator('/__docusaurus/debug', 'a4a'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/config',
    component: ComponentCreator('/__docusaurus/debug/config', 'c11'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/content',
    component: ComponentCreator('/__docusaurus/debug/content', '26d'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/globalData',
    component: ComponentCreator('/__docusaurus/debug/globalData', '15e'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/metadata',
    component: ComponentCreator('/__docusaurus/debug/metadata', '02b'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/registry',
    component: ComponentCreator('/__docusaurus/debug/registry', '235'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/routes',
    component: ComponentCreator('/__docusaurus/debug/routes', '9e6'),
    exact: true
  },
  {
    path: '/c/',
    component: ComponentCreator('/c/', '8ab'),
    exact: true
  },
  {
    path: '/credits/',
    component: ComponentCreator('/credits/', 'ca3'),
    exact: true
  },
  {
    path: '/d/',
    component: ComponentCreator('/d/', 'e62'),
    exact: true
  },
  {
    path: '/downloads/',
    component: ComponentCreator('/downloads/', 'e3c'),
    exact: true
  },
  {
    path: '/e/',
    component: ComponentCreator('/e/', 'a73'),
    exact: true
  },
  {
    path: '/search',
    component: ComponentCreator('/search', '5e6'),
    exact: true
  },
  {
    path: '/tools/OEM',
    component: ComponentCreator('/tools/OEM', '448'),
    exact: true
  },
  {
    path: '/docs',
    component: ComponentCreator('/docs', 'cde'),
    routes: [
      {
        path: '/docs',
        component: ComponentCreator('/docs', '7f5'),
        routes: [
          {
            path: '/docs',
            component: ComponentCreator('/docs', 'b71'),
            routes: [
              {
                path: '/docs/about',
                component: ComponentCreator('/docs/about', 'd9f'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/category/android-app',
                component: ComponentCreator('/docs/category/android-app', '6f5'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/category/apple-apps',
                component: ComponentCreator('/docs/category/apple-apps', '3b1'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/configuration',
                component: ComponentCreator('/docs/configuration', 'fd0'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/configuration/module',
                component: ComponentCreator('/docs/configuration/module', '12d'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/configuration/module/ambient-lighting',
                component: ComponentCreator('/docs/configuration/module/ambient-lighting', '92e'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/configuration/module/audio',
                component: ComponentCreator('/docs/configuration/module/audio', '360'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/configuration/module/canned-message',
                component: ComponentCreator('/docs/configuration/module/canned-message', '351'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/configuration/module/detection-sensor',
                component: ComponentCreator('/docs/configuration/module/detection-sensor', 'f81'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/configuration/module/external-notification',
                component: ComponentCreator('/docs/configuration/module/external-notification', '37c'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/configuration/module/mqtt',
                component: ComponentCreator('/docs/configuration/module/mqtt', '99a'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/configuration/module/neighbor-info',
                component: ComponentCreator('/docs/configuration/module/neighbor-info', 'f6e'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/configuration/module/range-test',
                component: ComponentCreator('/docs/configuration/module/range-test', 'ba4'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/configuration/module/remote-hardware',
                component: ComponentCreator('/docs/configuration/module/remote-hardware', '67b'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/configuration/module/serial',
                component: ComponentCreator('/docs/configuration/module/serial', '102'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/configuration/module/store-and-forward-module',
                component: ComponentCreator('/docs/configuration/module/store-and-forward-module', '0e6'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/configuration/module/telemetry',
                component: ComponentCreator('/docs/configuration/module/telemetry', '716'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/configuration/module/traceroute',
                component: ComponentCreator('/docs/configuration/module/traceroute', 'b96'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/configuration/radio/',
                component: ComponentCreator('/docs/configuration/radio/', 'fd6'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/configuration/radio/bluetooth',
                component: ComponentCreator('/docs/configuration/radio/bluetooth', '462'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/configuration/radio/channels',
                component: ComponentCreator('/docs/configuration/radio/channels', 'b08'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/configuration/radio/device',
                component: ComponentCreator('/docs/configuration/radio/device', '728'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/configuration/radio/display',
                component: ComponentCreator('/docs/configuration/radio/display', '026'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/configuration/radio/lora',
                component: ComponentCreator('/docs/configuration/radio/lora', '90f'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/configuration/radio/network',
                component: ComponentCreator('/docs/configuration/radio/network', 'a38'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/configuration/radio/position',
                component: ComponentCreator('/docs/configuration/radio/position', '261'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/configuration/radio/power',
                component: ComponentCreator('/docs/configuration/radio/power', '624'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/configuration/radio/user',
                component: ComponentCreator('/docs/configuration/radio/user', 'c4c'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/configuration/remote-admin',
                component: ComponentCreator('/docs/configuration/remote-admin', 'f54'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/configuration/tips',
                component: ComponentCreator('/docs/configuration/tips', '837'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/contributing',
                component: ComponentCreator('/docs/contributing', 'e00'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/developers',
                component: ComponentCreator('/docs/developers', '16c'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/development/android',
                component: ComponentCreator('/docs/development/android', 'f9c'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/development/device',
                component: ComponentCreator('/docs/development/device', 'fd0'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/development/device/client-api',
                component: ComponentCreator('/docs/development/device/client-api', '3f6'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/development/device/error-codes',
                component: ComponentCreator('/docs/development/device/error-codes', 'd07'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/development/device/http-api',
                component: ComponentCreator('/docs/development/device/http-api', 'bd2'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/development/device/module-api',
                component: ComponentCreator('/docs/development/device/module-api', 'a78'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/development/docs',
                component: ComponentCreator('/docs/development/docs', '456'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/development/docs/style-guide',
                component: ComponentCreator('/docs/development/docs/style-guide', 'd97'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/development/documentation/local-dev',
                component: ComponentCreator('/docs/development/documentation/local-dev', '6d5'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/development/documentation/publish',
                component: ComponentCreator('/docs/development/documentation/publish', '9ce'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/development/documentation/style-guides/config-pages',
                component: ComponentCreator('/docs/development/documentation/style-guides/config-pages', 'f26'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/development/documentation/style-guides/markdown',
                component: ComponentCreator('/docs/development/documentation/style-guides/markdown', '2d0'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/development/firmware',
                component: ComponentCreator('/docs/development/firmware', '526'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/development/firmware/build',
                component: ComponentCreator('/docs/development/firmware/build', 'e11'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/development/firmware/oled-guide',
                component: ComponentCreator('/docs/development/firmware/oled-guide', 'cfb'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/development/firmware/portnum',
                component: ComponentCreator('/docs/development/firmware/portnum', 'f4c'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/development/firmware/stacktraces',
                component: ComponentCreator('/docs/development/firmware/stacktraces', 'f6c'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/development/js',
                component: ComponentCreator('/docs/development/js', 'e4c'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/development/js/connecting',
                component: ComponentCreator('/docs/development/js/connecting', '907'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/development/js/events',
                component: ComponentCreator('/docs/development/js/events', '27b'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/development/js/http-api',
                component: ComponentCreator('/docs/development/js/http-api', 'fc8'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/development/python/',
                component: ComponentCreator('/docs/development/python/', 'f6e'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/development/python/building',
                component: ComponentCreator('/docs/development/python/building', 'ceb'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/development/python/library',
                component: ComponentCreator('/docs/development/python/library', '716'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/development/reference',
                component: ComponentCreator('/docs/development/reference', 'c2a'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/development/reference/github',
                component: ComponentCreator('/docs/development/reference/github', '342'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/development/reference/lora-design',
                component: ComponentCreator('/docs/development/reference/lora-design', '835'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/development/reference/protobufs',
                component: ComponentCreator('/docs/development/reference/protobufs', '6f9'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/development/web/',
                component: ComponentCreator('/docs/development/web/', '9ac'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/faq',
                component: ComponentCreator('/docs/faq', '904'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/getting-started',
                component: ComponentCreator('/docs/getting-started', '3db'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/getting-started/flashing-firmware',
                component: ComponentCreator('/docs/getting-started/flashing-firmware', 'e3e'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/getting-started/flashing-firmware/esp32/',
                component: ComponentCreator('/docs/getting-started/flashing-firmware/esp32/', '8aa'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/getting-started/flashing-firmware/esp32/cli-script',
                component: ComponentCreator('/docs/getting-started/flashing-firmware/esp32/cli-script', '2d3'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/getting-started/flashing-firmware/esp32/external-serial-adapter',
                component: ComponentCreator('/docs/getting-started/flashing-firmware/esp32/external-serial-adapter', 'f43'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/getting-started/flashing-firmware/esp32/web-flasher',
                component: ComponentCreator('/docs/getting-started/flashing-firmware/esp32/web-flasher', '770'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/getting-started/flashing-firmware/nrf52/',
                component: ComponentCreator('/docs/getting-started/flashing-firmware/nrf52/', '75c'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/getting-started/flashing-firmware/nrf52/convert-rak4631r',
                component: ComponentCreator('/docs/getting-started/flashing-firmware/nrf52/convert-rak4631r', 'e2e'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/getting-started/flashing-firmware/nrf52/drag-n-drop',
                component: ComponentCreator('/docs/getting-started/flashing-firmware/nrf52/drag-n-drop', '94d'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/getting-started/flashing-firmware/nrf52/nrf52-erase',
                component: ComponentCreator('/docs/getting-started/flashing-firmware/nrf52/nrf52-erase', 'bf1'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/getting-started/flashing-firmware/nrf52/ota',
                component: ComponentCreator('/docs/getting-started/flashing-firmware/nrf52/ota', 'cab'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/getting-started/initial-config',
                component: ComponentCreator('/docs/getting-started/initial-config', '8d2'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/getting-started/serial-drivers',
                component: ComponentCreator('/docs/getting-started/serial-drivers', '878'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/getting-started/serial-drivers/esp32',
                component: ComponentCreator('/docs/getting-started/serial-drivers/esp32', 'ef5'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/getting-started/serial-drivers/nrf52',
                component: ComponentCreator('/docs/getting-started/serial-drivers/nrf52', '640'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/getting-started/serial-drivers/test-serial-driver-installation',
                component: ComponentCreator('/docs/getting-started/serial-drivers/test-serial-driver-installation', '21c'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/hardware',
                component: ComponentCreator('/docs/hardware', 'e04'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/hardware/antennas/',
                component: ComponentCreator('/docs/hardware/antennas/', '6c7'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/hardware/antennas/antenna-reports',
                component: ComponentCreator('/docs/hardware/antennas/antenna-reports', '36b'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/hardware/antennas/antenna-testing',
                component: ComponentCreator('/docs/hardware/antennas/antenna-testing', 'ec5'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/hardware/antennas/lora-antenna',
                component: ComponentCreator('/docs/hardware/antennas/lora-antenna', '3c5'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/hardware/antennas/resources',
                component: ComponentCreator('/docs/hardware/antennas/resources', 'd55'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/hardware/devices/heltec/',
                component: ComponentCreator('/docs/hardware/devices/heltec/', '46e'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/hardware/devices/heltec/buttons',
                component: ComponentCreator('/docs/hardware/devices/heltec/buttons', '58e'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/hardware/devices/heltec/enclosures',
                component: ComponentCreator('/docs/hardware/devices/heltec/enclosures', '5c3'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/hardware/devices/lora/',
                component: ComponentCreator('/docs/hardware/devices/lora/', '406'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/hardware/devices/lora/buttons',
                component: ComponentCreator('/docs/hardware/devices/lora/buttons', '96d'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/hardware/devices/lora/enclosures',
                component: ComponentCreator('/docs/hardware/devices/lora/enclosures', '703'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/hardware/devices/lora/gpio',
                component: ComponentCreator('/docs/hardware/devices/lora/gpio', '241'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/hardware/devices/Nano Series/',
                component: ComponentCreator('/docs/hardware/devices/Nano Series/', 'fe9'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/hardware/devices/Nano Series/buttons',
                component: ComponentCreator('/docs/hardware/devices/Nano Series/buttons', 'cdb'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/hardware/devices/rak/',
                component: ComponentCreator('/docs/hardware/devices/rak/', '55b'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/hardware/devices/rak/base-board',
                component: ComponentCreator('/docs/hardware/devices/rak/base-board', '5fd'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/hardware/devices/rak/buttons',
                component: ComponentCreator('/docs/hardware/devices/rak/buttons', '0dc'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/hardware/devices/rak/core-module',
                component: ComponentCreator('/docs/hardware/devices/rak/core-module', 'da8'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/hardware/devices/rak/enclosures',
                component: ComponentCreator('/docs/hardware/devices/rak/enclosures', '2a4'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/hardware/devices/rak/peripherals',
                component: ComponentCreator('/docs/hardware/devices/rak/peripherals', '75c'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/hardware/devices/rak/screens',
                component: ComponentCreator('/docs/hardware/devices/rak/screens', '0fc'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/hardware/devices/raspberry-pi/',
                component: ComponentCreator('/docs/hardware/devices/raspberry-pi/', '320'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/hardware/devices/raspberry-pi/peripherals',
                component: ComponentCreator('/docs/hardware/devices/raspberry-pi/peripherals', 'de9'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/hardware/devices/station-g1/',
                component: ComponentCreator('/docs/hardware/devices/station-g1/', 'a11'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/hardware/devices/station-g1/buttons',
                component: ComponentCreator('/docs/hardware/devices/station-g1/buttons', '96e'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/hardware/devices/tbeam/',
                component: ComponentCreator('/docs/hardware/devices/tbeam/', 'ca1'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/hardware/devices/tbeam/buttons',
                component: ComponentCreator('/docs/hardware/devices/tbeam/buttons', '28a'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/hardware/devices/tbeam/enclosures',
                component: ComponentCreator('/docs/hardware/devices/tbeam/enclosures', '34a'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/hardware/devices/tbeam/screens',
                component: ComponentCreator('/docs/hardware/devices/tbeam/screens', '05a'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/hardware/devices/techo/',
                component: ComponentCreator('/docs/hardware/devices/techo/', 'ecd'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/hardware/devices/techo/buttons',
                component: ComponentCreator('/docs/hardware/devices/techo/buttons', '06c'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/hardware/devices/techo/enclosures',
                component: ComponentCreator('/docs/hardware/devices/techo/enclosures', 'a5b'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/hardware/solar-powered/measure-power-consumption',
                component: ComponentCreator('/docs/hardware/solar-powered/measure-power-consumption', 'dca'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/introduction',
                component: ComponentCreator('/docs/introduction', '722'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/legal',
                component: ComponentCreator('/docs/legal', 'fdb'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/legal/licensing',
                component: ComponentCreator('/docs/legal/licensing', '264'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/legal/privacy',
                component: ComponentCreator('/docs/legal/privacy', '63e'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/legal/trademark',
                component: ComponentCreator('/docs/legal/trademark', '096'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/legal/trademark-grants',
                component: ComponentCreator('/docs/legal/trademark-grants', '0c6'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/overview',
                component: ComponentCreator('/docs/overview', '43e'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/overview/encryption',
                component: ComponentCreator('/docs/overview/encryption', 'fc3'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/overview/mesh-algo',
                component: ComponentCreator('/docs/overview/mesh-algo', '608'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/overview/radio-settings',
                component: ComponentCreator('/docs/overview/radio-settings', 'ddf'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/overview/range-tests',
                component: ComponentCreator('/docs/overview/range-tests', '0f7'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/software',
                component: ComponentCreator('/docs/software', '754'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/software/android/installation',
                component: ComponentCreator('/docs/software/android/installation', '3ea'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/software/android/usage',
                component: ComponentCreator('/docs/software/android/usage', 'c28'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/software/apple/installation',
                component: ComponentCreator('/docs/software/apple/installation', 'fff'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/software/apple/usage',
                component: ComponentCreator('/docs/software/apple/usage', '9d1'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/software/community',
                component: ComponentCreator('/docs/software/community', 'ee3'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/software/community/community-atak',
                component: ComponentCreator('/docs/software/community/community-atak', '610'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/software/community/community-meshtasticator',
                component: ComponentCreator('/docs/software/community/community-meshtasticator', 'eff'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/software/community/meshtastic-web-api',
                component: ComponentCreator('/docs/software/community/meshtastic-web-api', '33e'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/software/integrations',
                component: ComponentCreator('/docs/software/integrations', '28e'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/software/integrations/integrations-atak-plugin',
                component: ComponentCreator('/docs/software/integrations/integrations-atak-plugin', 'aeb'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/software/integrations/integrations-caltopo',
                component: ComponentCreator('/docs/software/integrations/integrations-caltopo', '97c'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/software/linux-native',
                component: ComponentCreator('/docs/software/linux-native', '9e2'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/software/mqtt/',
                component: ComponentCreator('/docs/software/mqtt/', '82a'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/software/mqtt/adafruit-io',
                component: ComponentCreator('/docs/software/mqtt/adafruit-io', 'ce1'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/software/mqtt/home-assistant',
                component: ComponentCreator('/docs/software/mqtt/home-assistant', 'e28'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/software/mqtt/mosquitto',
                component: ComponentCreator('/docs/software/mqtt/mosquitto', '610'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/software/mqtt/mqtt-python',
                component: ComponentCreator('/docs/software/mqtt/mqtt-python', '0e2'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/software/mqtt/nodered',
                component: ComponentCreator('/docs/software/mqtt/nodered', '6ae'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/software/python/cli',
                component: ComponentCreator('/docs/software/python/cli', '1ad'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/software/python/cli/installation',
                component: ComponentCreator('/docs/software/python/cli/installation', '3e3'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/software/python/cli/usage',
                component: ComponentCreator('/docs/software/python/cli/usage', '7ed'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/software/web-client',
                component: ComponentCreator('/docs/software/web-client', '128'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/solar-powered',
                component: ComponentCreator('/docs/solar-powered', 'bd7'),
                exact: true,
                sidebar: "Sidebar"
              },
              {
                path: '/docs/supported-hardware',
                component: ComponentCreator('/docs/supported-hardware', '5ba'),
                exact: true,
                sidebar: "Sidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '/',
    component: ComponentCreator('/', '6cf'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
