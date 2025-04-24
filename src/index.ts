import * as client from './client'
import { env as odooEnv } from './orm'

interface Odoo {
  connect: typeof client.connect
  config: typeof client.config
  is_loged: typeof client.is_loged
  set_verbose: typeof client.set_verbose
  env: typeof odooEnv
}

export const odoo: Odoo = {
  connect: client.connect,
  config: client.config,
  is_loged: client.is_loged,
  set_verbose: client.set_verbose,
  env: odooEnv
}

export type { OdooConnectOptions } from './client'
export default odoo
