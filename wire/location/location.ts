import { type Location, createBrowserHistory } from 'history'
import { match } from 'path-to-regexp'

import { WireObject } from '@/wire/object/object'
import { wireMem, wireMems } from '@/wire/wire'

type ExtractParams<T extends string> = T extends `${string}:${infer Param}/${infer Rest}`
  ? Param | ExtractParams<Rest>
  : T extends `${string}:${infer Param}`
    ? Param
    : never

type ParamsObject<T extends string> = {
  [K in ExtractParams<T>]: string
}

export class WireLocation extends WireObject {
  @wireMem
  static history() {
    return createBrowserHistory()
  }

  static redirect(url: string) {
    window.location.assign(url)
  }


  @wireMem
  static location(next?: Location) {
    return next ?? this.history().location
  }

  @wireMem
  static path(next?: string, options: { query?: Record<string, string>; replace?: boolean } = {}) {
    if (next === undefined) {
      return this.location().pathname
    }

    const to = {
      pathname: next,
      search: options.query ? new URLSearchParams(options.query).toString() : undefined,
    }

    if (options.replace) this.history().replace(to)
    else this.history().push(to)
    return next
  }

  @wireMem
  static query(next?: Record<string, string>) {
    if (next === undefined) {
      const search = new URLSearchParams(this.location().search)
      return Object.fromEntries(search.entries())
    }

    const searchString = new URLSearchParams(next).toString()

    this.history().push({
      pathname: this.location().pathname,
      search: searchString ? `?${searchString}` : '',
    })

    return next
  }

  @wireMems
  static queryField(name: string, next?: string | null) {
    if (next === undefined) return this.query()[name] ?? null

    if (next === null) {
      const obj = { ...this.query() }
      delete obj[name]
      this.query(obj)
      return next
    }

    this.query({ ...this.query(), [name]: next })
    return next
  }

  static match<T extends string>(pattern: T, exact: boolean = true): ParamsObject<T> | null {
    const result = match(pattern, {
      decode: decodeURIComponent,
      end: exact,
    })(this.path())
    return result ? (result.params as ParamsObject<T>) : null
  }
}

WireLocation.history().listen(({ location }) => {
  WireLocation.location(location)
})
