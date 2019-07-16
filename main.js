import React, { useRef, useEffect, useContext, createContext } from 'react'
import useTracker from './meteor-hook'
import { ReactiveDict } from 'meteor/reactive-dict'

const warn = React.warn || console.warn

// Creates a React lifecycle bound ReactiveDict instance, based
// on the name argument. If the name changes, the ReactiveDict
// is destroyed and rebuilt. It is also cleaned up after the
// containing React component is unmounted.
export const useReactiveDict = (name, defaultValues = {}) => {
  const { current: refs } = useRef({})
  if (name !== refs.name) {
    if (refs.dict) refs.dict.destroy()
    refs.dict = new ReactiveDict(name, defaultValues)
    refs.name = name
  }
  useEffect(() => () => {
    refs.dict.destroy()
    delete refs.dict
  }, [])
  return refs.dict
}

// Uses a ReactiveDict to create reactivity on a single key.
export const useReactiveDictVar = (dict, key, defaultValue) => {
  dict.setDefault(key, defaultValue)
  const value = useTracker(() => dict.get(key), [dict, key])
  return [value, (val) => dict.set(key, val)]
}

// The main consumer surface for this package. It uses the
// above two to create a simple hook with a signature similar
// to React's standard useState hook, except with a name
// argument. The name argument is necessary for a ReactiveVar
// to be able to preserve a value during hot code push (HCP).
export const useMeteorState = (name, defaultValue) => {
  const dict = useReactiveDict(name)
  return useReactiveDictVar(dict, 'value', defaultValue)
}

// The base context for Session support.
const SessionContext = createContext('npsession')

// The main SessionProvider. This self contained provider
// creates its own ReactiveDict, and get everything wired up
// for session functionality.
export const SessionProvider = ({ children, name = 'npsession' }) => {
  const dict = useReactiveDict(name)
  return React.createElement(SessionContext.Provider, {
    value: dict
  }, children)
}

// An alternative Session Provider which allows the user to
// use their own self managed ReactiveDict, which could allow
// them to use the ReactiveDict for multiple purposes.
export const CustomSessionProvider = ({ children, reactiveDict }) => {
  const ref = useRef(reactiveDict)
  if (ref.current !== reactiveDict) ref.current = reactiveDict
  return React.createElement(SessionContext.Provider, {
    value: ref.current
  }, children)
}

// This hook watches a specific key in the session provided
// by the Provider. Only one provider can be used at a time.
export const useSessionVar = (key, defaultValue) => {
  const sessionDict = useContext(SessionContext)
  if (Meteor.isDevelopment && sessionDict === 'npsession') {
    warn('useSessionVar: No provider detected')
  }
  return useReactiveDictVar(sessionDict, key, defaultValue)
}
