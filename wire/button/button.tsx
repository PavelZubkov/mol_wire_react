import React from 'react'

import { WireDom } from '@/wire/dom/dom'
import { WireView } from '@/wire/view/view'
import { wireAction, wireAsync, wireJSX, wireMem } from '@/wire/wire'

import './buttons.css'

export class WireButton extends WireView {
  @wireAction
  task() {}

  @wireAction
  click(e: any) {
    this.loading(true)
    this.error(null)
    try {
      this.task()
      this.loading(false)
    } catch (err: unknown) {
      if (err instanceof Error) {
        this.error([err])
        this.loading(false)
        return
      }
      throw err
    }
  }

  @wireMem
  error(next?: [Error] | null) {
    return next ?? null
  }

  @wireMem
  loading(next?: boolean) {
    return next ?? false
  }

  @wireMem
  anchorId() {
    return `--wire-button-${this.$.$mol_guid()}`
  }

  @wireMem
  props(): { [name: string]: any } {
    return {
      onClick: wireAsync(this).click,
      popoverTarget: WireDom.id(() => this.Popover()),
      popoverTargetAction: 'hide',
      style: { anchorName: this.anchorId() },
      ...(this.loading() ? { ['data-wire']: 'promise' } : {}),
      ...(this.error()?.length ? { ['data-wire']: 'error' } : {}),
    }
  }

  @wireMem
  @wireJSX
  Button() {
    return <button>WireButton</button>
  }

  @wireMem
  @wireJSX
  Popover() {
    return (
      <div popover="auto" style={{ positionAnchor: this.anchorId() }}>
        {this.error()?.[0]?.message ?? ''}
      </div>
    )
  }

  sub() {
    if (this.error()) WireDom.node(() => this.Popover())?.showPopover()
    return [React.cloneElement(this.Button(), this.props()), this.Popover()]
  }
}
