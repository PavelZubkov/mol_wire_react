import { wireAction, wireProbe } from '@/wire/wire'

export class WireDom {
  @wireAction
  static id(task: () => React.ReactNode) {
    const reactNode = task() as React.ReactElement<{ id?: string }>
    const id = reactNode?.props?.id
    return id
  }

  // task должен быть с mem или mems + иметь id
  @wireAction
  static node(task: () => React.ReactNode) {
    const id = this.id(task)
    if (!id) return null
    const node = document.getElementById(id)
    return node
  }
}
