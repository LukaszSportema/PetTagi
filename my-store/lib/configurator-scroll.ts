/** Przewija do sekcji konfiguratora (po walidacji „Dalej”). */
export const scrollToConfiguratorSection = (sectionId: string) => {
  window.setTimeout(() => {
    document.querySelector<HTMLElement>(`[data-configurator-section="${sectionId}"]`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, 100);
};
