import { WireObject } from '@/wire/object/object'
import { wireMem, wireSolid } from '@/wire/wire'

export class WireStore<Data> extends WireObject {
  dataDefault: Data

  constructor(dataDefault: Data) {
    super()
    this.dataDefault = dataDefault
  }

  @wireMem
  data(next?: Data) {
    wireSolid()
    return next ?? this.dataDefault
  }

  value<Key extends keyof Data>(key: Key, next?: Data[Key]) {
    const data = this.data()
    if (next === undefined) return data && data[key]!
    const Constr = Reflect.getPrototypeOf(data as any)!.constructor as new () => {}
    this.data(Object.assign(new Constr(), data, { [key]: next }))
    return next!
  }
}
