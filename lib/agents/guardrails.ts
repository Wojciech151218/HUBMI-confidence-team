const hubCue =
  /innowacj|małopol|malopol|hub|asystent|dokument|kategori|bezdom|niepełnospraw|niepelnospraw|otył|otyl|wokand|ambaras|higien|pfron|rehabilit|urzęd|urzad|wniosek|formularz|renta|sąd|sad\b|aliment|turnus|projekt społecz|pomoc społec|aktywizacj|orzeczen|aplikacj|apka|wyszukiwark/i;

const offTopicGeneral =
  /ugotow|\bcook\b|przepis na|recipe|barszcz|borscht|ciasto|pizza|obiad|kolacj|pogod[ae]|weather|kawał|żart|zart|joke|przetłumacz|translate this|napisz (kod|funkcję|funkcje|skrypt)|javascript|typescript|python|mecz|wynik meczu|kto wygrał|who won|jaka jest stolica|what is the capital/i;

const aboutService =
  /^(cześć|czesc|hej|witaj|dzień dobry|dzien dobry|pomoc|help|hi|hello)\b|co (potrafisz|umiesz)|czym jesteś|czym jestes|co robi (ta |ten )?(aplikacja|apka|strona|wyszukiwarka|hub|asystent)|czym jest (ta |ten )?(aplikacja|apka|strona|wyszukiwarka|hub|asystent)|jak (to )?działa(sz)? (ta )?(strona|wyszukiwarka|hub|aplikacja|apka|czat)|do czego (to |ta aplikacja |ten hub )?służy/i;

export function isOffTopicGeneralQuestion(message: string): boolean {
  const text = message.trim();
  if (!text || hubCue.test(text)) {
    return false;
  }
  return offTopicGeneral.test(text);
}

export function isAboutService(message: string): boolean {
  return aboutService.test(message.trim());
}

export function offTopicRefusal(message: string): string {
  const english = /\b(how|what|who|cook|recipe|weather|translate|joke|capital)\b/i.test(message);
  const polishLetters = /[ąćęłńóśźż]/i.test(message);
  if (english && !polishLetters) {
    return "I only help with social innovation documents from Hub Małopolskich Innowacji. I cannot answer general questions like that.";
  }
  return "Pomagam tylko w dokumentach Hubu Małopolskich Innowacji: modelach innowacji społecznych, projektach i formularzach z Małopolski. Na takie ogólne pytanie nie odpowiem.";
}
