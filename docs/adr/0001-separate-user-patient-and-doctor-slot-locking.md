# Separate User, Patient, and Doctor Slot Locking

Accepted. In-clinic appointments distinguish the User who creates or manages a booking from the Patient who receives care. A User can manage multiple Patient profiles through Patient Account links, while each Appointment points to the Patient being treated and records the creator separately.

The system locks availability by Doctor plus overlapping time range, not by User plus time. This allows one User to book multiple people at the same time with different available Doctors, while still preventing one Doctor from treating two Patients at once and preventing one Patient from having overlapping Appointments.

**Considered Options**

- Keep one User mapped directly to one Patient. Rejected because it cannot represent parents booking for children, shared family management, receptionist-created profiles, or guest Patients.
- Lock appointments by creator and time. Rejected because it incorrectly blocks a parent from booking a child with another Doctor at the same time.
- Lock only by Doctor and exact start time. Rejected because appointment duration matters; overlapping time ranges must be blocked.

**Consequences**

- Appointment creation must validate permission through Patient Account before accepting a patientId from the frontend.
- Patient-facing appointment lists should show appointments for every Patient the User can manage.
- Existing one-to-one Patient data must be migrated into Patient Account rows with relationship SELF.

