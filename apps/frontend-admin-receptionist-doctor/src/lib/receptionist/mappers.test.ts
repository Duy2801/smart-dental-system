import { describe, expect, it } from "vitest";
import { localDateStr, mapAppointment } from "./mappers";

describe("receptionist appointment mapping", () => {
  it("uses the clinic timezone for the business date", () => {
    const previousTimezone = process.env.TZ;
    process.env.TZ = "UTC";
    try {
      expect(localDateStr(new Date("2026-09-09T17:30:00.000Z"))).toBe("2026-09-10");
    } finally {
      process.env.TZ = previousTimezone;
    }
  });

  it("uses the clinic timezone for appointment times", () => {
    const previousTimezone = process.env.TZ;
    process.env.TZ = "America/New_York";
    try {
      expect(mapAppointment({
        id: "appointment-time",
        scheduledAt: "2026-09-09T02:00:00.000Z",
        status: "CONFIRMED",
      }).startTime).toBe("09:00:00");
    } finally {
      process.env.TZ = previousTimezone;
    }
  });

  it("links a completed appointment to its open invoice", () => {
    const appointment = mapAppointment({
      id: "appointment-1",
      scheduledAt: "2026-09-09T02:00:00.000Z",
      status: "COMPLETED",
      paymentStatus: "PAY_AT_COUNTER_SELECTED",
      invoices: [
        { id: "paid", status: "PAID", invoiceType: "SERVICE" },
        { id: "deposit", status: "ISSUED", invoiceType: "DEPOSIT" },
        { id: "open", status: "ISSUED", invoiceType: "FINAL_PAYMENT" },
      ],
    });

    expect(appointment.billingInvoiceId).toBe("open");
    expect(appointment.invoicePending).toBe(true);
  });
});
