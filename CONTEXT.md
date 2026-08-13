# Smart Dental System

This context describes the core language for in-clinic dental booking, patient profiles, and appointment ownership.

## Language

**User**:
An authenticated account that can sign in, manage patient profiles, and create appointments.
_Avoid_: Account holder when the distinction from Patient matters

**Patient**:
The person who receives dental care. A Patient can exist without a User account and can be managed by one or more Users.
_Avoid_: Customer, account, user profile

**Patient Profile**:
The clinical and identity record for a Patient, including information needed for treatment and appointment history.
_Avoid_: User profile

**Patient Account**:
The relationship that allows a User to manage or book appointments for a Patient.
_Avoid_: Family member table, owner link

**Relationship**:
The role of a Patient relative to a User, such as SELF, CHILD, FATHER, MOTHER, or OTHER.
_Avoid_: Role when referring to family relationship

**Appointment**:
A scheduled in-clinic visit for a Patient with a Doctor for a Service during a specific time range.
_Avoid_: Booking when the clinical appointment record is meant

**Appointment Creator**:
The User or staff account that created an Appointment.
_Avoid_: Patient when referring to who clicked the booking action

**Doctor Slot**:
A bookable time range for one Doctor. A Doctor Slot is occupied when an active Appointment overlaps it.
_Avoid_: Clinic slot when the slot belongs to a specific doctor

**Active Appointment**:
An Appointment status that occupies a Doctor Slot and prevents overlapping bookings.
_Avoid_: Any appointment

**Pay At Counter**:
The in-clinic payment method where the Patient pays at the receptionist counter during the visit.
_Avoid_: Deposit payment, prepayment

