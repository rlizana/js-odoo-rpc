import { Model } from './model'

export class Odoo {
  public fetch_session!: typeof fetch
  public config = {
    url: '',
    dbname: '',
    uid: 0,
    username: '',
    password: '',
    verbose: false,
    info: undefined as Record<string, any> | undefined,
    context: undefined as Record<string, any> | undefined,
    session_id: undefined as string | undefined
  }

  constructor(url: string, dbname: string, verbose: boolean = false) {
    console.log(url, dbname)
    this.config.url = String(url).replace(/\/+$/, '')
    this.config.dbname = dbname
  }

  private async init_fetch() {
    const is_node =
      typeof process !== 'undefined' &&
      typeof process.versions === 'object' &&
      typeof process.versions.node !== 'undefined'

    const fetch = (await import('cross-fetch')).default

    if (is_node) {
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
    return this.fetch_session(url, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(body)
    })
  }

  async login(username: string, password: string) {
    await this.init_fetch()

    if (!username || !password) {
      this.verbose_error('Username and password are required')
      throw new Error('Username and password are required')
    }

    if (!this.config.info) {
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

      this.config.info = data.result
      if (this.config.info) {
        this.config.uid = this.config.info.uid
        this.config.context = this.config.info.user_context
      }
      this.config.username = username
      this.config.password = password
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
