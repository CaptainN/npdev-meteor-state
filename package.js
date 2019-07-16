/* global Package Npm */
Package.describe({
  name: 'npdev:meteor-react-state',
  summary: 'A set of React hooks for managing state in Meteor apps which survives hot code push',
  version: '0.9.0',
  documentation: 'README.md',
  git: 'https://github.com/CaptainN/npdev-meteor-state'
})

Package.onUse(function (api) {
  api.versionsFrom('1.8')
  api.use(['ecmascript', 'reactive-dict', 'tracker'])
  api.mainModule('main.js', ['client', 'server'], { lazy: true })
})

Package.onTest(function (api) {
  api.use(['ecmascript', 'reactive-dict', 'tracker', 'tinytest'])
  api.use('npdev:meteor-react-state')
  api.mainModule('tests.js')
})
