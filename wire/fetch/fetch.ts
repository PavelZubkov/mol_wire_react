import { WireObject } from '@/wire/object/object'
import { wireAction, wireSync } from '@/wire/wire'

export class WireFetchResponse extends WireObject {
  readonly native!: Response
  readonly request!: WireFetchRequest

  status() {
    const types = ['unknown', '1xx', '2xx', '3xx', '4xx', '5xx'] as const
    return types[Math.floor(this.native.status / 100)]
  }

  code() {
    return this.native.status
  }

  ok() {
    return this.native.ok
  }

  message() {
    return `HTTP Error ${this.code()}`
  }

  headers() {
    return this.native.headers
  }

  mime() {
    return this.headers().get('content-type')
  }

  @wireAction
  stream() {
    return this.native.body
  }

  @wireAction
  text() {
    const buffer = this.buffer()

    const mime = this.mime() || ''
    const [, charset] = /charset=(.*)/.exec(mime) || [, 'utf-8']

    const decoder = new TextDecoder(charset)
    return decoder.decode(buffer)
  }

  json() {
    return wireSync(this.native).json()
  }

  blob() {
    return wireSync(this.native).blob()
  }

  buffer() {
    return wireSync(this.native).arrayBuffer()
  }
}

export class WireFetchRequest extends WireObject {
  readonly native!: Request

  response_async() {
    const controller = new AbortController()
    let done = false

    const request = new Request(this.native, { signal: controller.signal })
    const promise = fetch(request).finally(() => {
      done = true
    })

    return Object.assign(promise, {
      destructor: () => {
        // Abort of done request breaks response parsing
        if (!done && !controller.signal.aborted) controller.abort()
      },
    })
  }

  @wireAction
  response() {
    return WireFetchResponse.make({
      native: wireSync(this).response_async(),
      request: this,
    })
  }

  success() {
    const response = this.response()
    if (response.status() === '2xx') return response

    throw new Error(response.message(), { cause: response })
  }
}

export class WireFetch extends WireObject {
  @wireAction
  static request(input: RequestInfo, init?: RequestInit) {
    return WireFetchRequest.make({
      native: new Request(input, init),
    })
  }

  static response(input: RequestInfo, init?: RequestInit) {
    return this.request(input, init).response()
  }

  static success(input: RequestInfo, init?: RequestInit) {
    return this.request(input, init).success()
  }

  static stream(input: RequestInfo, init?: RequestInit) {
    return this.success(input, init).stream()
  }

  static text(input: RequestInfo, init?: RequestInit) {
    return this.success(input, init).text()
  }

  static json(input: RequestInfo, init?: RequestInit) {
    return this.success(input, init).json()
  }

  static blob(input: RequestInfo, init?: RequestInit) {
    return this.success(input, init).blob()
  }

  static buffer(input: RequestInfo, init?: RequestInit) {
    return this.success(input, init).buffer()
  }
}
