# live-parameters Spec Delta

## ADDED Requirements

### Requirement: A control asks; the app moves the value

Moving a continuous control or a switch SHALL send one parameter intent with the parameter and the requested value; pressing and releasing a button or a pad SHALL send a trigger intent on the press and another on the release; and a control SHALL show a new value only when the app gives it.

#### Scenario: A fader drag
- **WHEN** a person drags a fader up
- **THEN** each step sends a parameter intent with the fader’s parameter and a value in its range, and the fader reads back what the app gives

#### Scenario: A pad press and release
- **WHEN** a person presses a pad and lets go
- **THEN** one trigger intent with down is sent on the press and one with up on the release

#### Scenario: A move the app ignores
- **WHEN** a person moves a fader and the app gives no new value
- **THEN** the fader returns to the app’s value once the gesture ends
