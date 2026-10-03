import { isOffTopicGeneralQuestion, offTopicRefusal } from "./guardrails";
import type { Agent } from "./types";

const helpText = `Ta aplikacja pomaga znaleźć pomysły, które już działają w Małopolsce i rozwiązują problemy społeczne. Wpisujesz temat albo pytanie, na przykład o bezdomność albo zdrowie dzieci, a asystent szuka pasujących dokumentów i krótko je wyjaśnia. Możesz też zawęzić szukanie do kategorii, na przykład „edukacja” albo „zdrowie”.`;

export const helpAgent: Agent = {
  name: "help",
  description:
    "Wyjaśnia prostymi słowami, co robi ta aplikacja, albo grzecznie odmawia przy tematach spoza Małopolski i pomocy społecznej. Wybierz go przy powitaniach, pytaniach o samą usługę albo ogólnych pytaniach niezwiązanych z dokumentami o innowacjach.",
  async run({ message }) {
    const answer = isOffTopicGeneralQuestion(message) ? offTopicRefusal(message) : helpText;
    return { kind: "answer", answer, sources: [] };
  },
};
