NPDev:Meteor-State
==================

This is a simple package which provides a few small hooks for use with React in Meteor projects. The main hook, `useMeteorState` uses ReactiveDict behind the scenes, to provide a state hook which works like React's built in `useState`, but retains that state during a hot code push (HCP) event.

```js
import { useMeteorState } from 'npdev:meteor-react-state'

// setting a name is required by ReactiveDict for persistance
const [value, setValue] = useMeteorState('test', 'default value')

// this value will survive HCP!
setValue('another value')
```

One caveat is that the name of the state variable you send to useMeteorState must be globally unique. It'll throw an error if you try to reuse a name. Any value stored with `useMeteorState`, should be EJSONable.

You can also use a session like state manager, which requires a provider, but unlike Meteor's `session` package works server side in SSR. Just like Meteor's `sessoin`, it also uses ReactiveDict, and therefor survives hot-code-push.

```js
// wrap your app with the Session provider

// Using SessionProvider
import { SessionProvider } from 'npdev:meteor-react-state'
const App = () => (
  <SessionProvider>
    <Switch>...</Switch>
  </SessionProvider>
)

// Alternatively, provide your own custom ReactiveDict
import { CustomSessionProvider } from 'npdev:meteor-react-state'
const dict = new ReactiveDict('my-dict')
const App = () => (
  <CustomSessionProvider reactiveDict={dict}>
    <Switch>...</Switch>
  </CustomSessionProvider>
)

// somewhere in your tree
import { useSessionVar } from 'npdev:meteor-react-state'
const MyComponent = () => {
  const [myVar, setMyVar] = useSessionVar('myVar', 'default value')
  return <div>
    <button onClick={() => setMyVar('another value')}>Change value</button>
    <div>{myVar}</div>
  </div>
}
```

For more advanced uses of ReactiveDict - accessing it's various methods like `.equals` and `.all`, you may want to work with a ReactiveVar instance directly. You can use `useReactiveVar` for that:

```js
// Using SessionProvider
import { useReactiveDict, useTracker } from 'npdev:meteor-react-state'

const MyComponent = () => {
  // grab a reference to a ReactiveDict instance, which will
  // always be the same reference unless the name changes.
  const myDict = useReactiveDict('custom-name', { key: 'value' })

  // Access various reactive methods from inside a computation
  const values = useTracker(() => {
    return myDict.all()
  }, [myDict])

  return <div>
    <button onClick={() => myDict.set('key', 'another value')}>Change value</button>
    <div>{values.key}</div>
  </div>
}
```

Just for completeness, here is an example of using ReactiveDict, without this package:

```js
// example using ReactiveDict with vanilla React hooks
const { current: dict } = useRef(new ReactiveDict('test', { value: 'value' }))
const value = useTracker(() => {
  return dict.get('value')
})

// Don't forget to clean it up on unmount
useEffect(() => () => dict.destroy(), [])

// here is how to set the value, in a handler or something
dict.set('value', 'other')
```

[For more about ReactiveDict, see Meteor's documentation](https://docs.meteor.com/api/reactive-dict.html).

Running Tests
-------------

Make sure you install npm dependencies within the package directory before running tests with `meteor npm i`, then run `meteor test-packages ./`. Also, you may need to manually refresh to get some of the tests to pass after an edit. I think this is related to data migration actually working on HCP. I still have to work out how to test that properly.
