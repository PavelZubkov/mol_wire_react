import type { WireView } from "@/wire/view/view"

// TODO ругаться если метод называет не с большой буквы
// TODO ругаться если метод возвращает не jsx
export function wireJSX(host: WireView, field: string, descriptor: PropertyDescriptor) {
  const orig = descriptor.value
  if (typeof orig !== 'function') throw new Error('The @wireJSX decorator can only be applied to methods.')

  function wire_jsx(this: WireView, ...args: any[]) {
    return this.jsx(() => orig.apply(this, args))
  }
  Object.defineProperty(wire_jsx, 'name', { value: field })
  descriptor.value = wire_jsx
  return descriptor
}
