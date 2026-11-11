import QtQuick
import qs.stage

// Stands in for Quickshell.Services.Polkit's PolkitAgent. It registers with
// nothing: there is no polkitd on the stage, and no real request can reach
// it. The authentication requests come from the fixture's state instead,
// `Stage.service("polkit")`:
//
//   {
//     registered: true,          // isRegistered (false: another agent holds the session)
//     requests: [                // what polkitd has handed the agent, oldest first
//       {
//         cookie: "1",           // names the request; a new cookie is a new request
//         message, iconName, actionId,
//         identities: [{ id: 1000, name: "ryan", displayName: "Ryan", isGroup: false }],
//         responseRequired: true,  // PAM is waiting on an answer (default true)
//         prompt: "Password: ",    // PAM's question (inputPrompt)
//         echo: false,             // show the answer as typed (responseVisible)
//         supplementary: "", supplementaryIsError: false,
//         failures: 0,             // one more is one failed attempt (authenticationFailed)
//         outcome: undefined,      // "succeeded" or "cancelled" ends it
//       },
//     ],
//   }
//
// As Quickshell does, one request is active at a time and the rest wait their
// turn. A request that leaves the list while active was withdrawn by polkitd
// (the caller gave up): it ends cancelled. What the plugin does goes to the
// fixture as service calls: `submit [cookie, value]`, `cancel [cookie]` and
// `selectIdentity [cookie, identity]`.
QtObject {
  id: agent

  property string path: ""

  readonly property bool isRegistered: d.registered
  readonly property bool isActive: d.flow !== null
  readonly property AuthFlow flow: d.flow

  signal authenticationRequestStarted()

  readonly property var _state: Stage.service("polkit")
  on_StateChanged: Qt.callLater(agent._sync)

  property QtObject d: QtObject {
    property bool registered: false
    property AuthFlow flow: null
    property var done: ({})
    property bool completed: false
  }

  property Component _flowComponent: Component { AuthFlow {} }

  function _requests() {
    var s = agent._state || {}
    return Array.isArray(s.requests) ? s.requests : []
  }

  function _find(cookie) {
    var list = agent._requests()
    for (var i = 0; i < list.length; i++) if (String(list[i].cookie) === cookie) return list[i]
    return null
  }

  function _sync() {
    if (!d.completed) return
    var s = agent._state || {}
    d.registered = s.registered !== false
    if (d.flow) {
      var current = agent._find(d.flow.cookie)
      if (!current) d.flow._cancel()
      else d.flow._apply(current)
    }
    if (!d.flow) agent._startNext()
  }

  function _startNext() {
    if (!d.registered) return
    var list = agent._requests()
    for (var i = 0; i < list.length; i++) {
      var r = list[i]
      var cookie = String(r.cookie)
      if (d.done[cookie]) continue
      if (r.outcome) { d.done[cookie] = true; continue }
      var flow = agent._flowComponent.createObject(agent)
      flow._start(agent, r)
      d.flow = flow
      agent.authenticationRequestStarted()
      // PAM's first question follows the request, as it does over the bus.
      if (d.flow === flow) flow._apply(r)
      return
    }
  }

  // A flow ended: the next waiting request becomes active.
  function _finish(flow) {
    d.done[flow.cookie] = true
    if (d.flow !== flow) return
    d.flow = null
    Qt.callLater(function() { flow.destroy() })
    agent._startNext()
  }

  Component.onCompleted: {
    d.completed = true
    agent._sync()
  }
}
