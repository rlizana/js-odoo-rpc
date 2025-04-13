import { odoo } from '../src'
import repl from 'repl'

console.log(`
💡 Example of use ...

    await odoo.connect({
        url: 'http://localhost:8069',
        dbname: 'test',
        username: 'admin',
        password: 'admin',
        session: false
    })
    let partners = await odoo.env('res.partner').search([]).read(['name'])
`)
const r = repl.start({ prompt: '> ', useGlobal: true })
r.context.odoo = odoo
