import * as client from './client'
import { env as odooEnv } from './orm'

export const odoo = {
  connect: client.connect,
  config: client.config,
  is_loged: client.is_loged,
  set_verbose: client.set_verbose,
  env: odooEnv
}

export type { OdooConnectOptions } from './client'
