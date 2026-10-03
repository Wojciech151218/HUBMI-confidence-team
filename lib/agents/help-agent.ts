import type { Agent } from "./types";

const helpText = `Hub Małopolskich Innowacji pomaga znaleźć modele innowacji społecznych i odpowiedzieć na pytania o nie.
• Wpisz hasło, np. „bezdomność” albo „otyłość u dzieci”, aby zobaczyć pasujące dokumenty.
• Zadaj pytanie, np. „Jak działa Mobilny Punkt Higieniczny?”, aby dostać odpowiedź ze źródłami.
• Zawęź wyniki, wybierając kategorię.`;

export const helpAgent: Agent = {
  name: "help",
  description:
    "Explains what this hub is and how to use it. Pick it for greetings, questions about the service itself, or messages unrelated to innovation documents.",
  async run() {
    return { kind: "answer", answer: helpText, sources: [] };
  },
};
