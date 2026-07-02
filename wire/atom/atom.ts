import $, { type $mol_wire_cursor } from 'mol_wire_lib'
import React from 'react'

import { wireAuto } from '@/wire/wire'

export class WireAtom<Host, Args extends readonly unknown[], Result> extends $.$mol_wire_atom<Host, Args, Result> {
  static is_user_input() {
    return (
      window.event &&
      // Генерируется на ПК и смартфонах при ЛЮБОМ изменении текста (ввод, подсказки, swype, backspace)
      (window.event instanceof InputEvent ||
        // Страховка для старых браузеров или специфических клавиш ПК (Enter, Escape, стрелочки)
        window.event instanceof KeyboardEvent ||
        // Вставка текста из буфера обмена (Ctrl+V или контекстное меню)
        window.event instanceof ClipboardEvent ||
        // Перетаскивание текста мышкой в поле ввода
        window.event.type === 'drop')
    )
  }

  static use<Host, Args extends readonly unknown[], Result>(host: Host, task: (...args: Args) => Result, name: string) {
    const [, force] = React.useState([])

    const getAtom = () => {
      if (name && task.name !== name) {
        Object.defineProperty(task, 'name', { value: name })
      }

      return WireAtom.solo(host, task)
    }

    // TODO  Понять, дает это что-то или нет
    const update = () => {
      const prev = wireAuto()
      wireAuto(null)
      try {
        force([])
      } finally {
        wireAuto(prev)
      }
    }

    React.useEffect(() => {
      const atom = new WireAtom(`${name}_listener`, () => {
        try {
          getAtom().sync()
        } catch (err: unknown) {}
        Promise.resolve().then(() => update())
      })

      atom.emit = (quant?: $mol_wire_cursor) => {
        if (WireAtom.is_user_input()) update()
        WireAtom.prototype.emit.call(atom, quant)
      }

      atom.sync()

      return () => {
        Promise.resolve().then(() => {
          atom.emit = WireAtom.prototype.emit
          atom.destructor()
        })
      }
    }, [])

    return getAtom
  }

  static current() {
    let current = $.$mol_wire_auto() as $.$mol_wire_fiber<any, any, any>
    if (current?.temp) current = current!.host
    return current
  }
}
