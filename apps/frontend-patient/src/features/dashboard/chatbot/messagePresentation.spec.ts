import assert from "node:assert/strict";
import test from "node:test";
import { presentChatbotMessage } from "./messagePresentation";

test("removes raw Markdown markers while preserving readable structure", () => {
  assert.equal(
    presentChatbotMessage(
      "## Xác nhận đặt lịch\n**Bác sĩ:** BS. Bùi Đức Tâm\n`08:00`",
    ),
    "Xác nhận đặt lịch\nBác sĩ: BS. Bùi Đức Tâm\n08:00",
  );
});
