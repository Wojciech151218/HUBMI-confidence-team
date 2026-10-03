# Hub Małopolskich Innowacji — opis projektu

## W skrócie

Hub Małopolskich Innowacji (HUBMI) to społeczna platforma informacyjna dla województwa małopolskiego. Łączy problemy zgłaszane przez mieszkańców, organizacje i samorządy z rozwiązaniami, które już istnieją w regionie: z innowacjami społecznymi, dobrymi praktykami i wiedzą Regionalnego Ośrodka Polityki Społecznej w Krakowie (ROPS Kraków).

Projekt powstaje w odpowiedzi na wyzwanie ROPS Kraków: zaprojektować „cyfrowe serce” Małopolskiego Hubu Innowacji Społecznych, czyli narzędzie, które z pomocą sztucznej inteligencji przyspiesza wyszukiwanie, rozwijanie, testowanie i upowszechnianie innowacji społecznych.

## Problem

Małopolska mierzy się z wieloma wyzwaniami społecznymi:

- starzeniem się społeczeństwa,
- kryzysem zdrowia psychicznego i samotnością,
- wykluczeniem cyfrowym,
- ograniczonym dostępem do usług społecznych,
- depopulacją większości regionu przy szybkim wzroście gmin wokół Krakowa,
- słabą koordynacją współpracy między sektorami.

W regionie działa wiele oddolnych inicjatyw. Tworzą je organizacje pozarządowe, Centra Usług Społecznych i aktywni mieszkańcy. ROPS Kraków ma w portfolio blisko 200 sprawdzonych innowacji społecznych. Ta wiedza jest jednak rozproszona. Osoba, która ma problem w swojej gminie, zwykle nie wie, że ktoś w regionie już go rozwiązał. Brakuje jednego miejsca, które łączy diagnozę problemu, rozwój pomysłu, testowanie, upowszechnianie i budowanie partnerstw.

## Rozwiązanie

HUBMI to jedno miejsce, w którym użytkownik opisuje swoją sytuację własnymi słowami, a platforma:

1. rozumie, czego dotyczy opis, nawet jeśli nie zawiera „fachowych” słów kluczowych,
2. odnajduje podobne przypadki i pasujące innowacje społeczne z bazy wiedzy,
3. odpowiada zwykłym językiem i wskazuje źródła, na których oparła odpowiedź,
4. kieruje do dalszych kroków: materiałów, kontaktu z ROPS, ekspertów albo zgłoszenia własnego pomysłu.

## Dla kogo

| Grupa | Czego potrzebuje |
|-------|------------------|
| **Mieszkańcy i organizacje pozarządowe** | Prosto zgłosić problem lub pomysł i szybko dostać odpowiedź, bez znajomości urzędowego języka. |
| **Jednostki samorządu terytorialnego** | Katalog gotowych rozwiązań, które można wdrożyć w polityce lokalnej, oraz miejsce do zgłaszania lokalnych wyzwań. |
| **Pracownicy ROPS Kraków** | Panel do publikowania i aktualizowania wiedzy, monitorowania zgłoszeń i obserwowania trendów w potrzebach. |
| **Eksperci branżowi** | Kanał do udzielania konsultacji innowatorom i doradzania samorządom. |

## Moduły platformy

### 1. Matchmaking społeczny (rdzeń, w realizacji)

Użytkownik opisuje problem w wyszukiwarce. System:

- rozpoznaje intencję (wyszukiwanie materiałów, pytanie wymagające wyjaśnienia, prośba o pomoc),
- wyszukuje semantycznie podobne innowacje i dokumenty,
- proponuje gotowe rozwiązania i wyjaśnia, dlaczego pasują.

### 2. Zasobnik wiedzy

- Mapa Wyzwań Społecznych i raporty o kondycji Małopolski.
- Biblioteka Innowacji Społecznych, czyli opisy modeli, filmy i materiały wdrożeniowe.
- Materiały edukacyjne.
- Dla administratora: zbiorcze dane o zgłaszanych potrzebach, pogrupowane w obszary tematyczne i pokazujące trendy.

### 3. Kreator pomysłów

- Fiszka pomysłu: krótki opis, istota, adresaci, etap realizacji.
- Generator wniosków dostępny w czasie naborów grantowych, dopasowany do konkretnego naboru.
- Kanwy innowacji społecznych i asystent AI, który pomaga rozwinąć pomysł.

### 4. Tester innowacji

Zapisy do testów, ocena istniejących rozwiązań, informacja zwrotna i propozycje usprawnień.

### 5. Platforma aktywnej komunikacji

Bezpośredni dialog z ROPS Kraków, wsparcie mentorów i budowanie partnerstw międzysektorowych.

### 6. Panel administratora

Szybkie dodawanie, weryfikowanie i publikowanie wiedzy oraz obsługa zgłoszeń.

### 7. Middleman innowacji

Asystent AI, który dostosowuje wybraną innowację do formy usługi pasującej do potrzeb konkretnej instytucji.

## Jak to działa

```
 Użytkownik ──► wyszukiwarka / rozmowa
                      │
                      ▼
               Router intencji (AI)
         ┌────────────┼────────────┐
         ▼            ▼            ▼
  Agent wyszukiwania  Agent odpowiedzi  Agent pomocy
  (lista materiałów)  (odpowiedź + źródła)  (jak korzystać z Hubu)
         └────────────┬────────────┘
                      ▼
        Wyszukiwanie semantyczne (embeddingi, pgvector)
                      ▼
        Baza wiedzy: innowacje, dokumenty, kategorie
```

- Dokumenty z bazy wiedzy ROPS (np. opisy modeli innowacji) są dzielone na fragmenty i zamieniane na wektory znaczeniowe (embeddingi).
- Pytanie użytkownika także trafia do przestrzeni wektorowej, a system szuka najbliższych znaczeniowo treści. Dzięki temu „samotność seniorów na wsi” trafi na innowację opisaną jako „sąsiedzka sieć wsparcia osób starszych”.
- Wyniki można zawęzić kategoriami tematycznymi.

## Technologia

| Warstwa | Technologia |
|---------|-------------|
| Aplikacja | Next.js (App Router, Server Components, Route Handlers) |
| Baza danych | PostgreSQL z rozszerzeniem pgvector |
| Dostęp do danych | TypeORM |
| AI | OpenAI: embeddingi i model językowy (z trybem testowym bez klucza API) |
| Uruchomienie | Docker Compose |

Architektura opiera się na agentach. Kolejne moduły, np. asystenta kreatora pomysłów czy middlemana innowacji, dodaje się jako nowych agentów podpiętych do wspólnego routera i tej samej bazy wiedzy.

## Założenia projektowe

- **Dostępność**: zgodność z WCAG 2.1 AA, czyli czytelny kontrast, obsługa klawiaturą i czytnikami ekranu oraz prosty język. Platforma ma być wygodna także dla seniorów i osób z niepełnosprawnościami.
- **Prostota**: jedno pole tekstowe na start i opis problemu własnymi słowami zamiast formularzy.
- **Wiarygodność**: odpowiedzi AI zawsze opierają się na źródłach z bazy wiedzy, a źródła są pokazywane użytkownikowi.
- **Łatwa aktualizacja**: nowy dokument trafia do bazy i od razu staje się dostępny w wyszukiwaniu.
- **Skalowalność i integracje**: gotowość do obsługi całego województwa i do połączenia z innymi systemami Hubu (np. bazą grantową, powiadomieniami o naborach).
- **Bezpieczeństwo danych**: brak prawdziwych danych osobowych w prototypie i minimalizacja danych zbieranych od użytkowników.

## Stan obecny (MVP)

Zrealizowane:

- strona główna z wyszukiwarką i podpowiedziami tematów,
- wyszukiwanie semantyczne dokumentów z filtrowaniem po kategoriach,
- router AI z trzema agentami: wyszukiwania, odpowiedzi i pomocy,
- konta użytkowników (rejestracja i logowanie),
- import przykładowych modeli innowacji do bazy wiedzy.

Następne kroki:

- fiszka pomysłu i asystent kreatora,
- panel administratora z widokiem trendów potrzeb,
- moduł testera i informacji zwrotnej,
- komunikacja z ROPS i ekspertami,
- audyt dostępności WCAG 2.1 AA.

## Wartość dla regionu

- **Mieszkańcy** szybciej znajdują sprawdzone sposoby rozwiązania swoich problemów.
- **Samorządy** sięgają po gotowe innowacje zamiast budować je od zera.
- **ROPS Kraków** zyskuje bieżący obraz potrzeb regionu i narzędzie do upowszechniania swojego dorobku.
- **Dobre lokalne pomysły** mają szansę wyjść poza jedną gminę i rozwinąć się w całej Małopolsce.
