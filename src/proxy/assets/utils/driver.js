import { getWD } from './wd.js'
import Promise from 'es6-promise'
import string from '../../../utils/string.js'
import $ from 'jquery'
import { UnknownCommand } from '../../../utils/errors.js'
import Log from '../utils/log.js'
import pick from 'lodash/pick'

let wd = getWD()
let logger = new Log('driver')

function init () {
  wd.state = 'init'
  logger.log('acquiring session...')
  $
    .ajax({
      url: '/web-driverify/session',
      cache: false
    })
    .done(session => {
      logger.log('session acquired', JSON.stringify(session))
      var confirm = session.confirm
      if (confirm) {
        send('result/', confirm.cmd, confirm.data, function () {
          wd.state = 'running'
        })
      } else {
        wd.state = 'running'
        poll()
      }
    })
    .fail(err => {
      throw err
    })
}

function poll () {
  if (wd.state !== 'running') return
  logger.log('polling')
  $
    .ajax({
      url: '/web-driverify/command',
      cache: false
    })
    .done(cmdArrived)
    .fail((jqXHR, textStatus) => {
      logger.log('error when polling, status:', textStatus)
      return setTimeout(poll, 1000)
    })
}

function cmdArrived (cmd) {
  logger.log('command received', JSON.stringify(cmd))
  if (wd.state !== 'running') return
  var handler = wd.handlers[cmd.name]
  Promise.resolve(handler)
    .then(function notFound (handler) {
      if (handler) return handler
      throw new UnknownCommand()
    })
    .then(function exec (handler) {
      logger.log('applying endpoint handler...')
      return handler.apply(cmd, cmd.args)
    })
    .then(function (result) {
      logger.log(string.fromCmd(cmd).summary(), 'handler returned:', string(result).summary())
      if (handler.silent) {
        logger.log('silent set, skip sending...')
        return
      }
      send('result/', cmd, result, handler.done)
    })
    .catch(function (err) {
      logger.log(string.fromCmd(cmd), 'error occurred:', string.fromError(err).summary())
      let obj = pick(err, ['name', 'message', 'stack', 'status'])
      send('error/', cmd, obj, handler.fail)
    })
    .catch(function (err) {
      logger.log('cannot recover from error', err.message, '\n', err.stack)
    })
}

function send (path, cmd, data, cb) {
  cb = cb || function () {}
  $.ajax({
    type: 'POST',
    url: '/web-driverify/' + path + cmd.id,
    dataType: 'json',
    headers: {
      'Content-Type': 'application/json'
    },
    data: JSON.stringify(data)
  })
   .done(data => cb(null, data))
   .fail(err => cb(err))
   .always(poll)
}

export { init }
