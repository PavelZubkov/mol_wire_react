import { WireView } from '@/wire/view/view'

import './todo.css'

export class DemoTodo extends WireView {
  sub() {
    return 'Hello Fucking World!'
  }
}

document?.addEventListener('DOMContentLoaded', () => DemoTodo.mount(), { once: true })
