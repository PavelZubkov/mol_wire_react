import { WireObject } from '@/wire/object/object'
import { wireMem, wireMems } from '@/wire/wire'

export class WireStorage extends WireObject {
  static nativeLocal() {
    return self.localStorage
  }

  static nativeSession() {
    return self.sessionStorage
  }

  @wireMem
  static changes(next?: StorageEvent) {
    return next
  }

  @wireMems
  static local<Value>(key: string, next?: Value | null): Value | null {
    this.changes()

    if (next === void 0) return JSON.parse(this.nativeLocal().getItem(key) || 'null')

    if (next === null) {
      this.nativeLocal().removeItem(key)
    } else {
      this.nativeLocal().setItem(key, JSON.stringify(next))
    }

    return next
  }

  // TODO copy-paste
  @wireMems
  static session<Value>(key: string, next?: Value | null): Value | null {
    this.changes()

    if (next === void 0) return JSON.parse(this.nativeSession().getItem(key) || 'null')

    if (next === null) {
      this.nativeSession().removeItem(key)
    } else {
      this.nativeSession().setItem(key, JSON.stringify(next))
    }

    return next
  }
}

self.addEventListener('storage', event => WireStorage.changes(event))
