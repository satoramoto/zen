## ADDED Requirements

### Requirement: The transfer is integrated in the Earth-Moon field

The translunar model SHALL integrate a spacecraft's motion in the combined gravity of the Earth
and a moving Moon with a fourth-order Runge-Kutta step, and SHALL state its accuracy: the energy
drift over a full transfer at its default step, checked by a test.

#### Scenario: Energy is kept

- **WHEN** a transfer is integrated for its full duration at the default step
- **THEN** the drift in specific energy stays within the bound the design states

### Requirement: A free return comes home

The simulator SHALL offer a free-return trajectory: launched from Earth orbit at the right moment
and speed, the spacecraft swings around the Moon and returns to Earth without a further burn.

#### Scenario: Free return

- **WHEN** the free-return trajectory runs to its end
- **THEN** the spacecraft passes behind the Moon and comes back to Earth's atmosphere without a burn
