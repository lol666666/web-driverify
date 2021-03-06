/* globals browser: true */

import config from '../../src/utils/config.js'
import chai from 'chai'

let expect = chai.expect

describe('element state', function () {
  let plain = `${config.stub.url}/plain.html`
  let id

  before(function () {
    browser.url(plain)
    id = browser.element('.control-label').value.ELEMENT
  })

  it('GET /session/:sessionId/element/:id', function () {
    let result = browser.elementIdText(id)
    expect(result).to.have.property('value', 'Homepage')
  })

  it('GET /session/:sessionId/element/:id/attribute/:name', function () {
    let result = browser.elementIdAttribute(id, 'class')
    expect(result).to.have.property('value', 'control-label')
  })

  it('GET /session/:sessionId/element/:id/rect', function () {
    let result = browser.elementIdRect(id)
    expect(result).to.have.deep.property('value.x')
    expect(result).to.have.deep.property('value.y')
    expect(result).to.have.deep.property('value.width')
    expect(result).to.have.deep.property('value.height')
  })

  it('GET /session/:sessionId/element/:id/location', function () {
    let result = browser.elementIdRect(id)
    expect(result).to.have.deep.property('value.x')
    expect(result).to.have.deep.property('value.y')
  })

  it('GET /session/:sessionId/element/:id/css/:propertyName', function () {
    let result = browser.getCssProperty('.description', 'font-size')
    expect(result).to.deep.equal({
      property: 'font-size',
      value: '21px',
      parsed: {
        type: 'number',
        string: '21px',
        unit: 'px',
        value: 21
      }
    })
    result = browser.getCssProperty('.defaut-description', 'font-size')
    expect(result.value).to.equal('22px')
  })

  it('GET /session/:sessionId/element/:id/size', function () {
    let result = browser.elementIdSize(id)
    expect(result).to.have.deep.property('value.width')
    expect(result).to.have.deep.property('value.height')
  })
})
