import assert from "node:assert/strict";
import test from "node:test";
import { mapAppointmentFinancials } from "./appointmentFinancials";

test("keeps the treatment-method price when no invoice exists", () => {
  assert.deepEqual(
    mapAppointmentFinancials({ basePrice: "850000", invoices: [] }),
    {
      treatmentPrice: 850000,
      invoices: [],
    },
  );
});

test("maps an unpaid invoice and its real line items", () => {
  const result = mapAppointmentFinancials({
    basePrice: 850000,
    invoices: [
      {
        id: "invoice-unpaid",
        invoiceCode: "INV-20260919-001",
        invoiceType: "SERVICE",
        status: "ISSUED",
        subtotal: "850000",
        discountAmount: "50000",
        finalAmount: "800000",
        issuedAt: "2026-09-19T04:00:00.000Z",
        items: [
          {
            description: "Trám răng thẩm mỹ",
            qty: 1,
            unit_price: 850000,
            amount: 850000,
          },
        ],
        payments: [],
      },
    ],
  });

  assert.equal(result.invoices[0].paymentState, "unpaid");
  assert.equal(result.invoices[0].paidAmount, 0);
  assert.equal(result.invoices[0].remainingAmount, 800000);
  assert.deepEqual(result.invoices[0].items, [
    {
      description: "Trám răng thẩm mỹ",
      quantity: 1,
      unitPrice: 850000,
      amount: 850000,
    },
  ]);
});

test("derives partial payment only from successful payments", () => {
  const result = mapAppointmentFinancials({
    basePrice: 1000000,
    invoices: [
      {
        id: "invoice-partial",
        invoiceCode: "INV-20260919-002",
        invoiceType: "FINAL_PAYMENT",
        status: "PARTIALLY_PAID",
        finalAmount: 700000,
        payments: [
          { id: "paid", amount: 300000, status: "SUCCESS" },
          { id: "failed", amount: 400000, status: "FAILED" },
        ],
      },
    ],
  });

  assert.equal(result.invoices[0].paymentState, "partial");
  assert.equal(result.invoices[0].paidAmount, 300000);
  assert.equal(result.invoices[0].remainingAmount, 400000);
});

test("treats a paid invoice as fully settled", () => {
  const result = mapAppointmentFinancials({
    basePrice: 500000,
    invoices: [
      {
        id: "invoice-paid",
        invoiceCode: "INV-20260919-003",
        invoiceType: "SERVICE",
        status: "PAID",
        finalAmount: 500000,
        payments: [
          {
            id: "payment-1",
            amount: 500000,
            status: "SUCCESS",
            paymentMethod: "CASH",
            paidAt: "2026-09-19T05:00:00.000Z",
          },
        ],
      },
    ],
  });

  assert.equal(result.invoices[0].paymentState, "paid");
  assert.equal(result.invoices[0].paidAmount, 500000);
  assert.equal(result.invoices[0].remainingAmount, 0);
  assert.equal(result.invoices[0].payments[0].paymentMethod, "CASH");
});
