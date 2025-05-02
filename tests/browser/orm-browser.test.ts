import { test, expect } from '@playwright/test'
import { Odoo } from '../../src/index'

test('Connecting to Odoo, incorrect', async () => {
  let odoo = new Odoo('http://localhost:8069', 'odoo')
  await expect(odoo.login('admin', 'wrongpassword')).rejects.toThrowError()
  expect(odoo.is_loged()).toBe(false)
  expect(await odoo.has_session()).toBe(false)
})

test.describe('Test Odoo connection', () => {
  let odoo = new Odoo('http://localhost:8069', 'odoo')

  test.beforeAll(async () => {
    await odoo.login('admin', 'admin')
  })

  test('login', async () => {
    expect(odoo.is_loged()).toBe(true)
    expect(await odoo.has_session()).toBe(true)
    expect(odoo.config.session).toBeDefined()
    expect(odoo.config.uid).toBeDefined()
    await odoo.logout()
    expect(odoo.is_loged()).toBe(false)
    expect(await odoo.has_session()).toBe(false)
  })

  test('res.partner create', async () => {
    const partner = await odoo.env('res.partner').create({
      name: 'odoo-rpc: Test Partner'
    })
    expect(partner).toBeDefined()
    expect(typeof partner[0]).toBe('number')
  })

  test('res.partner update', async () => {
    const partner = await odoo.env('res.partner').create({
      name: 'odoo-rpc: Test Partner'
    })
    expect(partner).toBeDefined()
    expect(typeof partner[0]).toBe('number')

    const write_ok = await odoo
      .env('res.partner')
      .write(partner[0], { name: 'odoo-rpc: Test Partner Updated' })
    expect(write_ok).toBe(true)

    const partners = await odoo
      .env('res.partner')
      .search([['name', '=', 'odoo-rpc: Test Partner Updated']])
      .read(['name'])
    expect(partners.length).toBeGreaterThan(0)
  })

  test('res.partner search', async () => {
    const allPartners = await odoo.env('res.partner').search([]).read(['name'])
    expect(allPartners.length).toBeGreaterThan(0)

    await expect(async () =>
      odoo
        .env('res.partner')
        .search('invalid_domain' as any)
        .read(['name'])
    ).rejects.toThrowError(new Error('Domain must be an array'))

    await expect(async () =>
      odoo
        .env('res.partner')
        .search([['name', 'ilike'], '&'])
        .read(['name'])
    ).rejects.toThrowError(
      new Error("Domain must contain '&', '|' or an array of 3 elements")
    )

    const specificPartners = await odoo
      .env('res.partner')
      .search([['name', 'ilike', 'Test']])
      .read(['name'])
    expect(specificPartners.length).toBeGreaterThanOrEqual(0)
  })

  test('res.partner read', async () => {
    const allPartners = await odoo.env('res.partner').search([]).read(['name'])
    expect(allPartners.length).toBeGreaterThan(0)

    await expect(async () =>
      odoo.env('res.partner').search([]).read(['name', 'field-not-exists'])
    ).rejects.toThrowError()
  })

  test('res.partner unlink', async () => {
    await odoo.env('res.partner').create({
      name: 'odoo-rpc: Test Partner 1'
    })
    await odoo.env('res.partner').create({
      name: 'odoo-rpc: Test Partner 2'
    })
    const partners = await odoo
      .env('res.partner')
      .search([['name', 'like', 'odoo-rpc: Test Partner %']])
      .read(['name'])
    expect(partners.length).toBeGreaterThan(2)

    const unlinkResult = await odoo
      .env('res.partner')
      .unlink(partners.map((partner) => partner.id))
    expect(unlinkResult).toBe(true)
  })

  test('res.partner default_get', async () => {
    const vals = await odoo.env('res.partner').call('default_get', [['type']])
    expect(vals).toBeDefined()
    expect(typeof vals).toBe('object')
    expect(vals).toEqual({ type: 'contact' })
  })

  test('product.template print', async () => {
    const companies = await odoo.env('res.company').search([]).read(['id'])
    const buffer = await odoo
      .env('res.company')
      .print('web.preview_internalreport', [companies[0].id])
    expect(buffer).toBeDefined()

    const text = new TextDecoder().decode(buffer.slice(0, 5))
    expect(text).toBe('%PDF-')
  })
})
