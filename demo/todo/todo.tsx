import { wireJSX } from '@/wire/jsx/jsx'
import { WireLink } from '@/wire/link/link'
import { WireLocation } from '@/wire/location/location'
import { WireView } from '@/wire/view/view'
import { wireAction, wireAsync, wireMem, wireMems } from '@/wire/wire'

import './todo.css'

type Item = {
  id: number
  title: string
  done: boolean
}

export class DemoTodo extends WireView {
  @wireMem
  todos(next?: Item[]) {
    return next ?? []
  }

  @wireMems
  todosFilter(done: boolean | null) {
    return this.todos().filter(obj => (done === null ? true : obj.done === done))
  }

  @wireAction
  toggle(id: Item['id']) {
    this.todos(this.todos().map(obj => (obj.id !== id ? obj : { ...obj, done: !obj.done })))
  }

  @wireAction
  drop(id: Item['id']) {
    this.todos(this.todos().filter(obj => obj.id !== id))
  }

  @wireAction
  dropDone() {
    this.todos(this.todos().filter(obj => !obj.done))
  }

  @wireMem
  editing(next?: Item['id'] | null) {
    return next ?? null
  }

  @wireMem
  filter() {
    return { '/': null, '/active': false, '/completed': true }[WireLocation.path()] ?? null
  }

  @wireAction
  add(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter' || !this.input()) return

    const current = this.todos()
    const id = Math.max(...current.map(obj => obj.id), 0) + 1
    const todo = { id, title: this.input(), done: false }
    this.todos([...current, todo])
    this.input('')
  }

  @wireMem
  input(next?: string) {
    return next ?? ''
  }

  @wireMem
  @wireJSX
  Head() {
    return (
      <header>
        <h1>todos</h1>
        {this.Input()}
      </header>
    )
  }

  @wireMem
  @wireJSX
  Input() {
    return (
      <input
        type="text"
        aria-label="New Todo Input"
        placeholder="What needs to be done?"
        value={this.input()}
        onChange={wireAsync(e => this.input(e.target.value))}
        onKeyDown={wireAsync(this).add}
      />
    )
  }

  @wireMem
  @wireJSX
  ItemsLeft() {
    const left = this.todosFilter(true).length
    return <span className="todo-count">{`${left} item${left !== 1 ? 's' : ''} left!`}</span>
  }

  @wireMem
  @wireJSX
  Filters() {
    return (
      <ul className="filters">
        <li>
          <WireLink to="/">All</WireLink>
        </li>
        <li>
          <WireLink to="/active">Active</WireLink>
        </li>
        <li>
          <WireLink to="/completed">Completed</WireLink>
        </li>
      </ul>
    )
  }

  @wireMem
  @wireJSX
  ClearButton() {
    return (
      <button
        className="clear-completed"
        hidden={this.todosFilter(true).length === 0}
        onClick={wireAsync(this).dropDone}
      >
        Clear completed
      </button>
    )
  }

  @wireMem
  @wireJSX
  Foot() {
    return (
      <footer className="footer" data-testid="footer" hidden={this.todos().length === 0}>
        {this.ItemsLeft()}
        {this.Filters()}
        {this.ClearButton()}
      </footer>
    )
  }

  @wireMems
  Todo(obj: Item) {
    return (
      <li>
        <div className="view">
          <input
            className="toggle"
            type="checkbox"
            data-testid="todo-item-toggle"
            checked={obj.done}
            onChange={wireAsync(() => this.toggle(obj.id))}
          />
          <label data-testid="todo-item-label" onDoubleClick={wireAsync(() => this.editing(obj.id))}>
            {obj.title}
          </label>
          <button
            className="destroy"
            data-testid="todo-item-button"
            aria-label="Delete todo"
            onClick={wireAsync(() => this.drop(obj.id))}
          />
        </div>
        {this.editing() === obj.id && (
          // <Input editing onSubmit={commitEdit} onBlur={commitEdit} label="Edit todo" defaultValue={title} />
          <input defaultValue={obj.title} />
        )}
      </li>
    )
  }

  list() {
    return this.todosFilter(this.filter()).map(obj => this.Todo(obj))
  }

  sub() {
    return [this.Head(), this.list(), this.Foot()]
  }
}

document?.addEventListener('DOMContentLoaded', () => DemoTodo.mount(), { once: true })
