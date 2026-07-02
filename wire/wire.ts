import $ from 'mol_wire_lib'

import type { WireView } from '@/wire/view/view'

export const wireAuto = $.$mol_wire_auto
export const wireAction = $.$mol_wire_method
export const wireMem = $.$mol_wire_solo
export const wireMems = $.$mol_wire_plex
export const wireSolid = $.$mol_wire_solid
export const wireProbe = $.$mol_wire_probe
export const wireSync = $.$mol_wire_sync
export const wireAsync = $.$mol_wire_async
export const wireSleep = $.$mol_wait_timeout.bind($.$$)
export const wireRace = $.$mol_wire_race

export function wireIsPending(task: () => unknown) {
  try {
    task()
    return false
  } catch (err: unknown) {
    if (err instanceof Promise) return true
    return false
  }
}
