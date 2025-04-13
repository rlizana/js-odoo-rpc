// Set fetch to use cookies is you are in node
export let fetch_session: typeof fetch
const is_node =
  typeof process !== 'undefined' &&
  typeof process.versions === 'object' &&
  typeof process.versions.node !== 'undefined'
if (is_node) {
  const fetch = require('cross-fetch')
  const fetchCookieModule = require('fetch-cookie')
  const fetchCookie = fetchCookieModule.default || fetchCookieModule
  const fetch_with_cookies = fetchCookie(fetch)
  fetch_session = (url, options) => {
    return fetch_with_cookies(url, {
      ...options,
      credentials: 'include'
    })
  }
} else {
  fetch_session = (url, options) => {
    return fetch(url, {
      ...options,
      credentials: 'include'
    })
  }
}

export type OdooConnectOptions = {
  url: string
  dbname: string
  username?: string
  password?: string
  verbose?: boolean
}

export let config: {
  url: string
  dbname: string
  uid: number
  password: string
  info?: Record<string, any>
  context?: Record<string, any>
  verbose: boolean
  session_id?: string
} = {
  url: '',
  dbname: '',
  uid: 0,
  password: '',
  verbose: false
}

export const connect = async (opts: OdooConnectOptions) => {
  config.url = opts.url
  config.dbname = opts.dbname
  config.verbose = opts.verbose ?? false
  if (!opts.username || !opts.password) {
    throw new Error('Username and password are required')
  }
  if (!config.info) {
    const res = await fetch_json('/web/session/authenticate', {
      jsonrpc: '2.0',
      params: {
        db: config.dbname,
        login: opts.username,
        password: opts.password
      },
      id: Date.now()
    })
    if (res.status !== 200) {
      throw new Error(`Authentication error: ${res.status}`)
    }
    const data = await res.json()
    config.info = data.result
    if (config.info) {
      config.uid = config.info.uid
      config.context = config.info.user_context
    }
    config.password = opts.password
  }
}

export const set_verbose = (verbose: boolean) => {
  config.verbose = verbose
}

export const is_loged = () => {
  return !!config.uid
}

export const call_kw = async (
  model: string,
  method: string,
  args: any[] = [],
  kwargs: Record<string, any> = {},
  context: Record<string, any> = config.context || {}
) => {
  const res = await fetch_json(`/web/dataset/call_kw/${model}/${method}`, {
    id: Date.now(),
    jsonrpc: '2.0',
    method: 'call',
    params: {
      model: model,
      method: method,
      args: args,
      kwargs: { ...kwargs, context }
    }
  })
  if (res.status !== 200) {
    if (config.verbose) {
      console.error('Error in Odoo RPC call:', res.statusText)
    }
    throw new Error(`HTTP error! status: ${res.status}`)
  }
  const data = await res.json()
  if (data.error) {
    if (config.verbose) {
      console.error('Error in Odoo RPC call:', data.error)
    }
    throw new Error(data.error.message)
  }
  return data.result
}

export const get_url = (endpoint: string) => {
  return config.url.replace(/\/+$/, '') + endpoint
}

export const fetch_json = async (
  endpoint: string,
  body: Record<string, any>,
  custom_headers: Record<string, any> = {}
): Promise<any> => {
  const url = get_url(endpoint)
  const headers = {
    'Content-Type': 'application/json',
    ...custom_headers
  }
  if (config.verbose) {
    console.info(
      `Odoo RPC Request ${url}`,
      JSON.stringify(body, null, 2),
      headers
    )
  }
  return fetch_session(url, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify(body)
  })
}
