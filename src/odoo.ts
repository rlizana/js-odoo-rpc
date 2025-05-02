import { Model } from './model'

export class Odoo {
  public fetch_session!: typeof fetch
  public config = {
    url: '',
    dbname: '',
    uid: 0,
    verbose: false,
    session: undefined as Record<string, any> | undefined,
    context: undefined as Record<string, any> | undefined,
    session_id: undefined as string | undefined
  }

  constructor(url: string, dbname: string, verbose: boolean = false) {
    this.config.url = String(url).replace(/\/+$/, '')
    this.config.dbname = dbname
  }

  private is_node() {
    return (
      typeof process !== 'undefined' &&
      typeof process.versions === 'object' &&
      typeof process.versions.node !== 'undefined'
    )
  }

  private async init_fetch() {
    if (typeof this.fetch_session !== 'undefined') {
      return false
    }

    const fetch = (await import('cross-fetch')).default

    if (this.is_node()) {
      const fetchCookieModule = await import('fetch-cookie')
      const fetchCookie = fetchCookieModule.default || fetchCookieModule
      const fetch_with_cookies = fetchCookie(fetch)
      this.fetch_session = (url, options) => {
        return fetch_with_cookies(url, {
          ...options,
          credentials: 'include'
        })
      }
    } else {
      this.fetch_session = (url, options) => {
        return fetch(url, {
          ...options,
          credentials: 'include'
        })
      }
    }

    return true
  }

  private verbose_error(...args: any[]) {
    if (this.config.verbose) {
      console.error(...args)
    }
  }

  public get_url(endpoint: string) {
    return this.config.url.replace(/\/+$/, '') + endpoint
  }

  private async fetch_json(
    endpoint: string,
    body: Record<string, any>,
    custom_headers: Record<string, any> = {}
  ) {
    const url = this.get_url(endpoint)
    const headers = {
      'Content-Type': 'application/json',
      ...custom_headers
    }
    if (this.config.verbose) {
      console.info(
        `Odoo RPC Request ${url}`,
        JSON.stringify(body, null, 2),
        headers
      )
    }
    await this.init_fetch()
    return this.fetch_session(url, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(body)
    })
  }

  async login(username: string, password: string) {
    if (!username || !password) {
      this.verbose_error('Username and password are required')
      throw new Error('Username and password are required')
    }

    if (!this.config.session) {
      const res = await this.fetch_json('/web/session/authenticate', {
        jsonrpc: '2.0',
        params: {
          db: this.config.dbname,
          login: username,
          password: password
        },
        id: Date.now()
      })

      if (res.status !== 200) {
        this.verbose_error(`Authentication error: ${res.status}`)
        throw new Error(`Authentication error: ${res.status}`)
      }

      const data = await res.json()

      if (data.error) {
        this.verbose_error(`Authentication response: ${data.message}`)
        throw new Error(`Authentication response: ${data.message}`)
      }
      this.update_config_session(data)
    }
    return true
  }

  async has_session(): Promise<boolean> {
    await this.init_fetch()
    const res = await this.fetch_session(
      this.get_url('/web/session/get_session_info'),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ jsonrpc: '2.0', params: {}, id: Date.now() })
      }
    )
    if (!res.ok) return false
    const data = await res.json()
    this.update_config_session(data)
    return !!(data.result && data.result.uid)
  }

  async logout(): Promise<boolean> {
    await this.init_fetch()
    const res = await this.fetch_session(this.get_url('/web/session/destroy'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ jsonrpc: '2.0', params: {}, id: Date.now() })
    })
    if (!res.ok) return false
    this.update_config_session({
      result: {
        uid: 0,
        user_context: {}
      }
    })
    return true
  }

  private update_config_session(data: Record<string, any>) {
    this.config.session = data.result
    if (this.config.session) {
      this.config.uid = this.config.session.uid
      this.config.context = this.config.session.user_context
    }
  }

  set_verbose(verbose: boolean) {
    this.config.verbose = verbose
  }

  is_loged() {
    return !!this.config.uid
  }

  env(model: string) {
    return new Model(this, model)
  }

  async call_kw(
    model: string,
    method: string,
    args: any[] = [],
    kwargs: Record<string, any> = {},
    context: Record<string, any> = this.config.context || {}
  ) {
    const res = await this.fetch_json(
      `/web/dataset/call_kw/${model}/${method}`,
      {
        id: Date.now(),
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model: model,
          method: method,
          args: args,
          kwargs: { ...kwargs, context }
        }
      }
    )

    if (res.status !== 200) {
      this.verbose_error('Error in Odoo RPC call:', res.statusText)
      throw new Error(`HTTP error! status: ${res.status}`)
    }

    const data = await res.json()

    if (data.error) {
      this.verbose_error('Error in Odoo RPC call:', data.error)
      throw new Error(data.error.message)
    }

    return data.result
  }
}
