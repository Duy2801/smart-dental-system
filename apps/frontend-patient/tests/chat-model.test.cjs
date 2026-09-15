const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const Module = require("node:module");
const file = path.join(__dirname, "../src/features/dashboard/chatbot/model.ts");
const loaded = new Module(file, module);
loaded._compile(
  ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  file,
);
const {
  parseReply,
  parseHistory,
  parseMessageBlocks,
  RequestGate,
  buildRequestHistory,
} = loaded.exports;

test("account identity resets on logout and switch but stays stable on token refresh", () => {
  const identity = loaded.exports.chatIdentity;
  const first = {
    isHydrated: true,
    isAuthenticated: true,
    accessToken: "old-token",
    user: { id: "a" },
  };
  assert.equal(identity(first), "account:a");
  assert.equal(
    identity({ ...first, accessToken: "renewed-token" }),
    "account:a",
  );
  assert.equal(identity({ ...first, user: { id: "b" } }), "account:b");
  assert.equal(identity({ ...first, isAuthenticated: false }), "guest");
  assert.equal(identity({ ...first, isHydrated: false }), "hydrating");
});

test("rendered Markdown escapes executable HTML and leaves unsafe links inert", () => {
  const renderFile = path.join(
    __dirname,
    "../src/features/dashboard/chatbot/ChatMessageContent.tsx",
  );
  const renderer = new Module(renderFile, module);
  renderer.require = (id) => (id === "./model" ? loaded.exports : require(id));
  renderer._compile(
    ts.transpileModule(fs.readFileSync(renderFile, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText,
    renderFile,
  );
  const React = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  const html = renderToStaticMarkup(
    React.createElement(renderer.exports.ChatMessageContent, {
      text: "**Price**\n<img src=x onerror=alert(1)>\n[pay](javascript:alert(1))",
    }),
  );
  assert.match(html, /<strong>Price<\/strong>/);
  assert.match(html, /&lt;img/);
  assert.doesNotMatch(html, /<img|<a |dangerouslySetInnerHTML/);
});

test("response preserves booking state and source labels through API envelopes", () => {
  const reply = parseReply({
    data: {
      reply: "Available",
      metadata: {
        bookingState: { step: "date" },
        sources: [{ label: "Dịch vụ", kind: "services" }],
      },
      suggestions: [{ type: "service", label: "Cleaning", value: "clean" }],
    },
  });
  assert.deepEqual(reply.metadata.bookingState, { step: "date" });
  assert.equal(reply.sources[0].kind, "services");
  assert.equal(reply.suggestions[0].value, "clean");
});
test("invalid replies fail rather than fabricating an answer", () => {
  assert.throws(() => parseReply({ data: { reply: "" } }));
  assert.throws(() => parseReply({ reply: 42 }));
});
test("history drops malformed records and bounds long conversations", () => {
  const messages = Array.from({ length: 65 }, (_, i) => ({
    id: String(i),
    sender: "user",
    text: "hello",
  }));
  messages.push({ id: "bad", sender: "system", text: "privileged" });
  const result = parseHistory({ data: { messages } });
  assert.equal(result.length, 60);
  assert.equal(result[0].id, "5");
  assert.equal(result.at(-1).id, "64");
});
test("safe formatting groups lists and keeps raw HTML as inert text", () => {
  assert.deepEqual(
    parseMessageBlocks(
      "## Giá\n- Cạo vôi\n- Trám răng\n\n<script>alert(1)</script>",
    ),
    [
      { type: "heading", text: "Giá" },
      { type: "list", ordered: false, items: ["Cạo vôi", "Trám răng"] },
      { type: "paragraph", text: "<script>alert(1)</script>" },
    ],
  );
});
test("duplicate sends and late responses after reset are refused", () => {
  const gate = new RequestGate();
  const first = gate.start();
  assert.notEqual(first, null);
  assert.equal(gate.start(), null);
  gate.reset();
  const second = gate.start();
  assert.equal(gate.isCurrent(first), false);
  gate.finish(first);
  assert.equal(gate.start(), null);
  gate.finish(second);
  assert.notEqual(gate.start(), null);
});
test("request context uses prior turns and retains bot booking metadata", () => {
  const turns = [
    {
      id: "1",
      sender: "bot",
      text: "Choose date",
      metadata: { bookingState: { step: "date" } },
    },
    { id: "2", sender: "user", text: "Tomorrow" },
  ];
  assert.deepEqual(buildRequestHistory(turns), [
    {
      role: "assistant",
      content: "Choose date",
      metadata: { bookingState: { step: "date" } },
    },
    { role: "user", content: "Tomorrow", metadata: {} },
  ]);
});

test("long catalog turns fit AI context limits while stored messages stay intact", () => {
  const messages = Array.from({ length: 12 }, (_, index) => ({
    id: String(index),
    sender: "bot",
    text: "x".repeat(6500),
  }));
  const context = buildRequestHistory(messages);
  assert.equal(context.length, 8);
  assert.equal(context[0].content.length, 4000);
  assert.equal(messages[0].text.length, 6500);
});

test("model suggestions fit history DTO limits and discard identity metadata", () => {
  const result = parseReply({
    reply: "Choose",
    metadata: { bookingState: { step: "service", userId: "foreign" } },
    suggestions: [
      { type: "s".repeat(80), label: "L".repeat(300), value: "Choose" },
    ],
    sources: [{ label: "Clinic", kind: "k".repeat(80) }],
  });
  assert.equal(result.suggestions[0].type.length, 60);
  assert.equal(result.suggestions[0].label.length, 200);
  assert.equal(result.sources[0].kind.length, 60);
  assert.equal(result.metadata.bookingState.userId, undefined);
});

test("uncertain booking confirmations cannot be treated as ordinary retries", () => {
  const confirmation = loaded.exports.isBookingConfirmation;
  assert.equal(confirmation("Tôi xác nhận đặt lịch", {}), true);
  assert.equal(confirmation("Choose", { confirmBooking: true }), true);
  assert.equal(
    confirmation("Choose", { bookingState: { confirmBooking: true } }),
    true,
  );
  assert.equal(
    confirmation("ok", {}, [
      {
        id: "a",
        sender: "bot",
        text: "Confirm?",
        suggestions: [
          { type: "confirm_booking", label: "Confirm", value: "Confirm" },
        ],
      },
    ]),
    true,
  );
  assert.equal(confirmation("Bảng giá dịch vụ", {}), false);
});
