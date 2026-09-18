type ServiceSuggestionSource = {
  id: string;
  title: string;
};

type HomeSearchSuggestion = {
  id: string;
  label: string;
  href: string;
};

export function createHomeSearchSuggestions(
  services: ServiceSuggestionSource[],
  buildServiceHref: (id: string) => string,
): HomeSearchSuggestion[] {
  return services.slice(0, 5).map((service) => ({
    id: service.id,
    label: service.title,
    href: buildServiceHref(service.id),
  }));
}
