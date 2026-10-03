"use server";

import { Initiative } from "@/db/initiative";
import { getDataSource } from "@/lib/data-source";

export type InitiativeFormState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function submitInitiative(
  _prev: InitiativeFormState,
  formData: FormData,
): Promise<InitiativeFormState> {
  const title = readText(formData, "title");
  const description = readText(formData, "description");
  const location = readText(formData, "location");
  const contactEmail = readText(formData, "contactEmail");
  const userId = Number(readText(formData, "userId"));

  if (!title || !description || !contactEmail) {
    return { status: "error", message: "Uzupełnij nazwę, opis i adres e-mail." };
  }
  if (!emailPattern.test(contactEmail)) {
    return { status: "error", message: "Podaj poprawny adres e-mail." };
  }

  try {
    const dataSource = await getDataSource();
    const repository = dataSource.getRepository(Initiative);
    await repository.save(
      repository.create({
        title,
        description,
        location: location || null,
        contactEmail,
        userId: Number.isInteger(userId) && userId > 0 ? userId : null,
      }),
    );
  } catch (error) {
    console.error("submitInitiative: save failed", error);
    return { status: "error", message: "Nie udało się wysłać zgłoszenia. Spróbuj ponownie za chwilę." };
  }

  return { status: "success", message: null };
}
