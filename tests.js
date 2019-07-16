/* global Tinytest */
import React from 'react'
import { renderHook, act } from '@testing-library/react-hooks'
import { ReactiveDict } from 'meteor/reactive-dict'

import {
  useReactiveDict,
  useReactiveDictVar,
  useMeteorState,
  SessionProvider,
  CustomSessionProvider,
  useSessionVar
} from './main'

Tinytest.add('useReactiveDict', async function (test) {
  const { result, rerender, unmount, waitForNextUpdate } = renderHook(({ name }) =>
    useReactiveDict(name, { key: 1 }),
    { initialProps: { name: 'test1' } }
  )

  test.instanceOf(result.current, ReactiveDict, 'Expect instance of ReactiveDict')
  test.equal(1, result.current.get('key'), 'Default value of key should be 1')

  const dict = result.current
  rerender()
  test.isTrue(dict === result.current, 'Expect the same instance of ReactiveDict after rerender')

  act(() => result.current.set('key', 2))
  await waitForNextUpdate()
  test.equal(result.current.get('key'), 2, 'New value of key should be 2')

  rerender({ name: 'test2' })
  test.isFalse(dict === result.current, 'Expect a new instance of ReactiveDict after name change')
  test.equal(result.current.get('key'), 1, 'Default values should have reset to defaults after name change')

  unmount()

  // There doesn't seem to be a flag to check for a "destroyed" state, so we'll just check for empty keys
  test.length(Object.keys(result.current.keys), 0, 'After unmount, the dict should be destroyed')

  // :TODO: See if there is a way to test HCP persistance. Specifically, we want to make sure the object
  // is not getting destroyed by an unmount action before HCP refreshes the page.

  // :TODO: Errors with reusing the same name
})

Tinytest.add('useReactiveDictVar', async function (test) {
  const { result, unmount, waitForNextUpdate } = renderHook(
    () => {
      return useReactiveDictVar(useReactiveDict('test-useReactiveDictVar'), 'key', 1)
    }
  )

  const [initialValue, setValue] = result.current
  test.equal(initialValue, 1, 'The default value for "key" should be 1')

  act(() => { setValue(2) })
  await waitForNextUpdate()

  const [value] = result.current
  test.equal(value, 2, 'The updated value should be 2')

  unmount()
})

Tinytest.add('useMeteorState', async function (test) {
  const { result, unmount, waitForNextUpdate } = renderHook(() =>
    useMeteorState('test-useMeteorState', 1)
  )

  const [initialValue, setValue] = result.current
  test.equal(initialValue, 1, 'The default value should be 1')

  act(() => { setValue(2) })
  await waitForNextUpdate()

  const [value] = result.current
  test.equal(value, 2, 'The updated value should be 2')

  unmount()
})

Tinytest.add('useSessionVar with SessionProvider', async function (test) {
  const wrapper = ({ children }) => <SessionProvider>{children}</SessionProvider>
  const { result, unmount, waitForNextUpdate } = renderHook(() => useSessionVar('key', 1), { wrapper })

  const [initialValue, setValue] = result.current
  test.equal(initialValue, 1, 'The default value for "key" should be 1')

  act(() => { setValue(2) })
  await waitForNextUpdate()

  const [value] = result.current
  test.equal(value, 2, 'The updated value should be 2')

  unmount()

  // :TODO: Test error scenarios with double nested providers, etc.
  // :TODO: Test various scenarios with overlapping/reused names
})

Tinytest.add('useSessionVar with CustomSessionProvider', async function (test) {
  const dict = new ReactiveDict('custom')
  const wrapper = ({ children }) => <CustomSessionProvider reactiveDict={dict}>{children}</CustomSessionProvider>
  const { result, unmount, waitForNextUpdate } = renderHook(() => useSessionVar('key', 1), { wrapper })

  const [initialValue, setValue] = result.current
  test.equal(initialValue, 1, 'The default value for "key" should be 1')

  act(() => { setValue(2) })
  await waitForNextUpdate()

  const [value] = result.current
  test.equal(value, 2, 'The updated value should be 2')

  act(() => { dict.set('key', 3) })
  await waitForNextUpdate()

  const [nextVal] = result.current
  test.equal(nextVal, 3, 'External updates to the ReactiveDict should trigger update')

  unmount()

  // :TODO: Test error scenarios with double nested providers, etc.
})
