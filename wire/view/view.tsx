import $ from 'mol_wire_lib'
import React, { type JSX, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { WireAtom } from '@/wire/atom/atom'
import { WireObject } from '@/wire/object/object'
import { wireMem, wireMems } from '@/wire/wire'

import './view.css'

export type WireViewContent = WireView | React.ReactNode | JSX.Element

// TODO refactor
export class WireView extends WireObject {
  @wireMem
  sub(): WireViewContent[] | WireViewContent {
    return []
  }

  element() {
    return React.createElement('div', {
      ref: (node: any) => {
        this.dom_node = () => node
      },
      id: this.uid(),
      className: [...this.view_names()].join(' '),
    } as any) as any
  }

  tree() {
    let element

    try {
      element = this.element()
      const sub = this.sub()

      const children = (Array.isArray(sub) ? sub : [sub]).map(el => {
        if (el instanceof WireView) {
          return <el.observer />
        }

        return el
      })

      return React.cloneElement(element, {}, ...children) as React.ReactNode
    } catch (err: unknown) {
      if (err instanceof Promise) {
        return React.cloneElement(element, { 'data-wire': 'promise' } as any) as React.ReactNode
      }

      if (err instanceof Error) {
        return React.cloneElement(element, { 'data-wire': 'error' } as any, err.message) as React.ReactNode
      }

      throw err
    }
  }

  dom_node(): Element | null {
    return null
  }

  auto() {}

  observer = () => {
    React.useEffect(() => this.auto())
    const atom = WireAtom.use(this, this.tree, 'observer')
    return atom().channel()()
  }

  cn(element?: string) {
    const suffix = WireAtom.current().task.name.trim()

    const names = (this.constructor as typeof WireView).view_names(suffix)
    names.push(...this.view_names_owned().map(name => `${name}_${suffix}`))

    if (element) return names.map(name => `${name}__${element}`).join(' ')
    return names.join(' ')
  }

  uid() {
    let start = this.toString().replace(/</g, '(').replace(/>/g, ')')

    if (WireAtom.current()) {
      const atom = WireAtom.current()
      start += `.${this.$.$mol_func_name(atom.task)}`
      if (atom.args[0]) start += `(${this.$.$mol_key(atom.args[0])})`
      else start += '()'
    }

    return start.replace(/\.observer\(\)$/, '').replaceAll(/"/g, "'")
  }

  class(obj: WireView) {
    return <obj.observer />
  }

  safe(task: () => React.ReactNode) {
    try {
      return task()
    } catch (err: unknown) {
      if (err instanceof Promise) return <div data-wire="promise" />
      if (err instanceof Error) {
        console.error(err)
        return <div data-wire="error">{err.message}</div>
      }
      throw err
    }
  }

  jsx(nodeOrTask: React.ReactNode | (() => React.ReactNode)) {
    const node = typeof nodeOrTask === 'function' ? this.safe(nodeOrTask) : nodeOrTask

    if (!React.isValidElement(node)) {
      return node
    }

    const passed = (node.props as any).className ?? ''
    const cn = [...new Set([...passed.split(/\s+/), ...this.cn().split(/\s+/)])].filter(Boolean).join(' ')

    return React.cloneElement(node, {
      id: this.uid(),
      key: this.uid(),
      className: cn,
    } as any) as React.ReactNode
  }

  static view_classes() {
    const proto = this.prototype

    let current = proto
    const classes = [] as (typeof WireView)[]

    while (current) {
      if (current.constructor.name !== classes.at(-1)?.name) {
        classes.push(current.constructor as typeof WireView)
      }
      if (!(current instanceof WireView)) break
      current = Object.getPrototypeOf(current)
    }

    return classes
  }

  view_names_owned() {
    const names = [] as string[]
    let owner = $.$mol_owning_get(this) as $.$mol_wire_fiber<any, any[], any>

    if (!(owner?.host instanceof WireView)) return names

    const suffix = owner.task.name.trim()
    // const suffix2 = '_' + suffix[0].toLowerCase() + suffix.substring(1)
    const suffix2 = '_' + suffix

    names.push(...(owner.host.constructor as typeof WireView).view_names(suffix))

    for (let prefix of owner.host.view_names_owned()) {
      names.push(prefix + suffix2)
    }

    return names
  }

  view_names() {
    const names = new Set<string>()

    for (let name of this.view_names_owned()) names.add(name)

    for (let Class of (this.constructor as typeof WireView).view_classes()) {
      const name = this.$.$mol_func_name(Class)
      if (name) names.add(name)
    }

    return names
  }

  static _view_names?: Map<string, string[]>
  static view_names(suffix: string) {
    let cache = Reflect.getOwnPropertyDescriptor(this, '_view_names')?.value
    if (!cache) cache = this._view_names = new Map()

    const cached = cache.get(suffix)
    // if (cached) return cached

    const names = [] as string[]
    // const suffix2 = '_' + suffix[0].toLowerCase() + suffix.substring(1)
    const suffix2 = '_' + suffix

    for (const Class of this.view_classes()) {
      if (suffix in Class.prototype) names.push(this.$.$mol_func_name(Class) + suffix2)
      else break
    }

    cache.set(suffix, names)
    return names
  }

  static Render(p: { as: WireView | null }) {
    return p.as === null ? null : <p.as.observer />
  }

  static Inline<Host extends WireView, View extends typeof WireView, Props extends InstanceType<View>>({
    view,
    name,
    host,
    ...props
  }: {
    view?: View
    name: string
    host: Host
  } & Partial<Props>) {
    const View = view ?? WireView

    if (!(name in host)) {
      Object.assign(host, { [name]: () => View.make(props) })
      wireMem(host, name as any)
    }

    const obj = (host as any)[name]() as WireView
    return <obj.observer />
  }

  @wireMems
  static Root<This extends typeof WireView>(this: This, id: number) {
    return new this() as InstanceType<This>
  }

  @wireMem
  static mount() {
    const selector = `[wire_view_root="${this.toString()}"]`
    const elem = document.querySelector(selector)

    if (!elem) {
      console.error(`Контейнер ${selector} не найден в DOM. Проверьте очередность загрузки.`)
      return
    }

    ;(window as any)[this.toString()] = this

    const app = this.Root(0)

    createRoot(elem!).render(
      <StrictMode>
          <app.observer />
      </StrictMode>
    )
  }
}

// const name = el
//   .uid()
//   .replace(/\.Root\([^)]*\)/, '')
//   .replace(/\(\)/g, '')
//   .replace(/\./g, '_')
// Object.defineProperty(el.react_observer, 'name', { value: name })
// Object.defineProperty(el.react_observer, 'displayName', { value: name })
