import type { Metadata } from "next";
import { AuthPage } from "../components/AuthPage";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Logowanie | Hub Małopolskich Innowacji",
};

export default function LoginPage() {
  return (
    <AuthPage
      title="Zaloguj się"
      subtitle="Wróć do swoich programów, wydarzeń i partnerów."
    >
      <LoginForm />
    </AuthPage>
  );
}
