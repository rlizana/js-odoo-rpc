import { call_kw, get_url, fetch_session } from './client'

class OdooModel {
  private model: string
  private _domain: any[] = []
  private _fields: string[] = []

  constructor(model: string) {
    this.model = model
  }

  search(domain: any[]) {
    if (!Array.isArray(domain)) {
      throw new Error('Domain must be an array')
    }
    if (
      !domain.every(
        (item) =>
          item === '&' ||
          item === '|' ||
          (Array.isArray(item) && item.length === 3)
      )
    ) {
      throw new Error("Domain must contain '&', '|' or an array of 3 elements")
    }
    this._domain = domain
    return this
  }

  read(fields: string[]) {
    this._fields = fields
    return this.call('search_read', [this._domain], {
      fields: this._fields
    })
  }

  create(values: Record<string, any>) {
    return this.call('create', [[values]])
  }

  write(ids: number[], values: Record<string, any>) {
    return this.call('write', [ids, values])
  }

  unlink(ids: number[]) {
    return this.call('unlink', [ids])
  }

  call(method: string, args: any[] = [], kwargs: Record<string, any> = {}) {
    return call_kw(this.model, method, args, kwargs)
  }

  async print(reportName: string, ids: number[]) {
    if (!reportName) {
      throw new Error('Report name is required')
    }
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('IDs must be a non-empty array')
    }
    const url = get_url(`/report/pdf/${reportName}/${ids.join(',')}`)
    const res = await fetch_session(url, {
      method: 'GET',
      headers: {
        Accept: 'application/pdf'
      },
      credentials: 'include'
    })
    if (!res.ok) {
      console.log(res)
      throw new Error(`GET failed (${res.status}): ${res.statusText}`)
    }
    return res.arrayBuffer()
  }
}

export const env = (model: string) => new OdooModel(model)
