import assert from "node:assert/strict";
import test from "node:test";
import { createHomeSearchSuggestions } from "../src/features/dashboard/home/utils/homeSearchSuggestions.ts";

test("limits the home search suggestion row to five services", () => {
  const services = Array.from({ length: 7 }, (_, index) => ({
    id: `service-${index + 1}`,
    title: `Service ${index + 1}`,
  }));

  const suggestions = createHomeSearchSuggestions(
    services,
    (id) => `/services/${id}`,
  );

  assert.deepEqual(
    suggestions,
    services.slice(0, 5).map((service) => ({
      id: service.id,
      label: service.title,
      href: `/services/${service.id}`,
    })),
  );
});
