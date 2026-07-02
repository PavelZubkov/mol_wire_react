import type { ComponentProps, ElementType } from 'react'
import React from 'react'

import { WireAtom } from '@/wire/atom/atom'
import { WireLocation } from '@/wire/location/location'
import { WireView } from '@/wire/view/view'

// TODO refactor

/*
1) Передан только to
  - простая ссылка, подсвечивается если to === path в урде
2) Передан только query
  - ссылка которая меняет только query
  - подсвечивается если queryString в урле === переданному query
  - в query могут быть null, { status: null, period: null }, подсветка будет только если таких null не будет в урле
  - { status: 'approval', period: null } - подсветится если в урле будет query=approval и не будет period
  - не перечисленные параметры query никак не влияют на подсветку
  - { includeManager: '' } в урле даст ?includeManager без =
3) Передан и to и query
  - Подсветка зависит только от to
  - query тут просто играет роль, чтобы в урле оказались нужные query параметры при переходе
3) Передан forward или backward
  - переход вперед или назад
  - не учитывая другое
*/

export function WireLink<T extends React.FC<any> | ElementType>(
  p: {
    as?: T
    to?: string
    forward?: boolean
    backward?: boolean
    query?: Record<string, string | null>
    replace?: boolean
    querySafe?: boolean
    onClick?: (e: React.MouseEvent) => unknown
    exact?: boolean
  } & ComponentProps<T>
) {
  const hostRef = React.useRef({ [Symbol.toStringTag]: `wire_button` })

  const { as, to, query, onClick, replace, querySafe, exact, forward, backward, ...rest } = p

  const Tag = as || 'a'

  const pathNext = () => to ?? WireLocation.path()

  const queryAtom = WireAtom.use(
    hostRef.current,
    () => {
      const next = { ...WireLocation.query() }

      if (!query) return next

      for (const key of Object.keys(query)) {
        if (query[key] === null) delete next[key]
        else next[key] = query[key]
      }

      return next
    },
    'nextQuery'
  )

  const queryNext = queryAtom().channel()

  const uri = () => {
    const q = queryNext()
    if (q === null || (query && Object.keys(query).length === 0)) return pathNext()

    if (!to) {
      return `${pathNext()}?${new URLSearchParams(q).toString()}`
    }

    return `${pathNext()}?${new URLSearchParams(query ?? {}).toString()}`
  }

  const isActive = () => {
    if ((to && !query) || (to && query)) {
      const res = !!WireLocation.match(to, exact ?? true)
      return res
    }

    if (!to && query) {
      const keys = Object.keys(query)

      for (const key of keys) {
        const queryField = WireLocation.queryField(key)
        if (queryField !== query[key]) return false
      }

      return true
    }
  }
  const isActiveAtom = WireAtom.use(hostRef.current, isActive, 'isActive')

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) onClick(e)

    if (e.defaultPrevented) return

    // Игнорируем клики с зажатыми клавишами (чтобы работало "открыть в новой вкладке")
    if (
      e.button === 0 && // Левая кнопка мыши
      !e.ctrlKey &&
      !e.metaKey &&
      !e.shiftKey &&
      !e.altKey
    ) {
      e.preventDefault()

      if (forward) WireLocation.history().forward()

      if (backward) WireLocation.history().back()

      if (to) WireLocation.path(to, { replace, query })
      if (query) {
        const next = queryNext()
        WireLocation.query(next!)
      }
    }
  }

  const activated = isActiveAtom().channel()()

  if (as instanceof WireView) {
    return (
      <a {...rest} data-active={activated} href={uri()} onClick={handleClick} as="a">
        <as.observer />
      </a>
    )
  }
  return <Tag {...rest} data-active={activated} href={uri()} onClick={handleClick} as="a" />
}
