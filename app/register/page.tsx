import type { Metadata } from "next";
import { AuthPage } from "../components/AuthPage";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = {
  title: "Rejestracja | Hub Małopolskich Innowacji",
};

export default function RegisterPage() {
  return (
    <AuthPage
      title="Załóż konto"
      subtitle="Dołącz do ekosystemu innowacyjnej Małopolski."
    >
      <RegisterForm />
    </AuthPage>
  );
}
