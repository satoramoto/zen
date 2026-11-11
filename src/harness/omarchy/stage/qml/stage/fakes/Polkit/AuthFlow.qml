import QtQuick
import qs.stage

// Stands in for Quickshell.Services.Polkit's AuthFlow: one authentication
// request, and the PAM conversation that answers it. Its properties are read
// only, as Quickshell's are; the agent (PolkitAgent.qml) fills them from the
// fixture's state through the listener-side methods at the bottom, which are
// the ones Quickshell's own listener calls (request, showInfo, showError,
// completed). What the plugin does to it, submitting a response or cancelling,
// goes to the fixture as a service call; the fixture answers by changing the
// request in its state.
QtObject {
  id: flow

  // Fixed when polkitd hands the request over.
  readonly property string message: d.message
  readonly property string iconName: d.iconName
  readonly property string actionId: d.actionId
  readonly property string cookie: d.cookie
  // Who may authenticate: { id, name, displayName, isGroup } each (a uid or gid).
  readonly property var identities: d.identities
  // Writable, as in Quickshell: choosing another identity restarts the
  // conversation for it. The fixture hears of it as `selectIdentity`.
  property var selectedIdentity: null

  // The conversation, as PAM drives it.
  readonly property bool isResponseRequired: d.isResponseRequired
  readonly property string inputPrompt: d.inputPrompt
  readonly property bool responseVisible: d.responseVisible
  readonly property string supplementaryMessage: d.supplementaryMessage
  readonly property bool supplementaryIsError: d.supplementaryIsError
  readonly property bool isCompleted: d.isCompleted
  readonly property bool isSuccessful: d.isSuccessful
  readonly property bool isCancelled: d.isCancelled
  readonly property bool failed: d.failed

  signal authenticationSucceeded()
  signal authenticationFailed()
  signal authenticationRequestCancelled()

  // ------------------------------------------------- what the plugin calls

  // Answers PAM's current question. As in Quickshell, the question is
  // withdrawn at once; the fixture decides what PAM makes of the answer.
  function submit(value) {
    if (d.over) return
    d.isResponseRequired = false
    d.inputPrompt = ""
    d.responseVisible = false
    Stage.serviceCall("polkit", "submit", [d.cookie, String(value === undefined ? "" : value)])
  }

  // The person dismissed the request: it ends cancelled, and the agent moves on.
  function cancelAuthenticationRequest() {
    if (d.over) return
    Stage.serviceCall("polkit", "cancel", [d.cookie])
    flow._cancel()
  }

  // ------------------------------------------- what PAM and polkitd do to it

  function request(message, echo) {
    if (d.over) return
    d.inputPrompt = String(message || "")
    d.responseVisible = !!echo
    d.isResponseRequired = true
  }

  function showInfo(message) {
    d.supplementaryMessage = String(message || "")
    d.supplementaryIsError = false
  }

  function showError(message) {
    d.supplementaryMessage = String(message || "")
    d.supplementaryIsError = true
  }

  // The conversation ended. Gaining authorization ends the request; failing
  // marks it failed and PAM starts over (the fixture asks again with request()).
  function completed(gainedAuthorization) {
    if (d.over) return
    d.isResponseRequired = false
    if (gainedAuthorization) {
      d.over = true
      d.isCompleted = true
      d.isSuccessful = true
      flow.authenticationSucceeded()
      if (d.agent) d.agent._finish(flow)
    } else {
      d.failed = true
      flow.authenticationFailed()
    }
  }

  // ------------------------------------------------------- the agent's side

  property QtObject d: QtObject {
    property var agent: null
    property bool over: false
    property bool started: false
    property int failures: 0
    property string message: ""
    property string iconName: ""
    property string actionId: ""
    property string cookie: ""
    property var identities: []
    property bool isResponseRequired: false
    property string inputPrompt: ""
    property bool responseVisible: false
    property string supplementaryMessage: ""
    property bool supplementaryIsError: false
    property bool isCompleted: false
    property bool isSuccessful: false
    property bool isCancelled: false
    property bool failed: false
  }

  // Ends the request cancelled: by the person, or by polkitd (the caller gave
  // up, or polkitd's own timeout ran out).
  function _cancel() {
    if (d.over) return
    d.over = true
    d.isResponseRequired = false
    d.isCancelled = true
    flow.authenticationRequestCancelled()
    if (d.agent) d.agent._finish(flow)
  }

  // Brings the flow in line with the fixture's view of its request.
  function _apply(r) {
    if (d.over) return
    var failures = Number(r.failures || 0)
    if (failures > d.failures) {
      d.failures = failures
      flow.completed(false)
    }
    if (r.outcome === "succeeded") { flow.completed(true); return }
    if (r.outcome === "cancelled") { flow._cancel(); return }

    var info = String(r.supplementary || "")
    if (info !== d.supplementaryMessage || !!r.supplementaryIsError !== d.supplementaryIsError) {
      if (r.supplementaryIsError) flow.showError(info)
      else flow.showInfo(info)
    }
    var wanted = r.responseRequired === undefined ? true : !!r.responseRequired
    if (wanted) {
      var prompt = r.prompt === undefined ? "Password: " : String(r.prompt)
      if (!d.isResponseRequired || d.inputPrompt !== prompt || d.responseVisible !== !!r.echo) flow.request(prompt, !!r.echo)
    } else if (d.isResponseRequired) {
      d.isResponseRequired = false
    }
  }

  function _start(agent, r) {
    d.agent = agent
    d.cookie = String(r.cookie || "")
    d.message = String(r.message || "")
    d.iconName = String(r.iconName || "")
    d.actionId = String(r.actionId || "")
    d.identities = Array.isArray(r.identities) ? r.identities : []
    flow.selectedIdentity = d.identities.length > 0 ? d.identities[0] : null
    d.failures = Number(r.failures || 0)
    d.started = true
  }

  onSelectedIdentityChanged: {
    if (d.started && !d.over) Stage.serviceCall("polkit", "selectIdentity", [d.cookie, selectedIdentity])
  }
}
