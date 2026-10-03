# Oddawacze – proekologiczna platforma rzeczy używanych ze wsparciem celów charytatywnych

> **W skrócie:** Aplikacja webowa (marketplace), na której „oddający” przekazuje używany przedmiot, a „odbierający” wpłaca symboliczną kwotę (np. 5, 10 lub 15 PLN) nie sprzedawcy, lecz na cel charytatywny wskazany przez oddającego. Innowacja łączy walkę z marnotrawstwem (zero-waste), wsparcie osób ubogich i regularne finansowanie organizacji pomocowych.

| Pole | Wartość |
|---|---|
| Realizator | nie podano w dokumencie |
| Miejsce | Kraków (testy nie wychodziły poza to miasto) |
| Okres / daty | nie podano |
| Uczestnicy testu | liczba nie podana; w testach wystąpił problem z infrastrukturą przy liczbie użytkowników większej niż 12 testerów |
| Finansowanie | EFS, PO Wiedza Edukacja Rozwój, oś IV, Działanie 4.1 (Innowacje społeczne) – Inkubator Włączenia Społecznego |
| Forma | aplikacja webowa (komputer, tablet, telefon) |
| Kod | prywatne repozytorium GitHub: `github.com/3backup/oddawacze` |
| Licencja | CC BY 4.0 |

---

## Cel

Stworzenie miejsca, w którym w jednej wymianie pomagają dwie strony:

- **oddający** przekazuje niepotrzebny przedmiot i wskazuje cel charytatywny oraz kwotę,
- **odbierający** wpłaca tę kwotę (pieniądze trafiają na wybrany cel, nie do oddającego) i otrzymuje przedmiot.

Dodatkowe skutki: walka z ubóstwem (rzeczy używane za symboliczną kwotę), ekologia (drugie życie przedmiotów, mniej śmieci), pomoc w zdarzeniach losowych i klęskach (możliwość zgłoszenia takiego celu na platformie). Najważniejszy efekt: realne wsparcie finansowe dla organizacji działających na rzecz osób wykluczonych społecznie.

## Grupa docelowa

| Grupa | Rola |
|---|---|
| Oddający | osoby z niepotrzebnymi przedmiotami, gotowe oddać je za darmo |
| Odbierający / wspomagający | osoby szukające tanich rzeczy z drugiej ręki lub zainteresowane zero-waste, chcące przy okazji wspierać cele charytatywne |
| Fundacje, stowarzyszenia, organizacje charytatywne | główni beneficjenci; mogą promować platformę w social mediach |
| Domy dziecka, schroniska dla psów, hospicja, ośrodki dla niepełnosprawnych | beneficjenci, jak wyżej |
| Osoby prywatne w potrzebie | w przyszłości zbiórki indywidualne po weryfikacji (wzór: siepomaga.pl, pomagam.pl) |
| Firmy, korporacje, urzędy (CSR) | wystawianie sprzętu (myszki, klawiatury, krzesła, monitory) i promocja wśród pracowników |
| Influencerzy, media on-line i off-line | promocja; darmowe publikacje po wysłaniu notek prasowych |
| Grupy na Facebooku (np. „Uwaga śmieciarka jedzie”) | najbardziej naturalni potencjalni użytkownicy |
| Instytucje wspierające NGO | plan: ciągły rozwój i założenie fundacji, zależne od grantu |

## Problemy, na które odpowiada innowacja

- Fundacje i domy dziecka mają za mało środków na działalność statutową.
- Duża liczba przedmiotów się marnuje (kartony w piwnicach, garażach, komórkach lub śmietnik).
- Osoby mniej zamożne potrzebują używanych rzeczy w okazyjnych cenach.
- Wsparcie charytatywne bywa nieregularne (aukcje, zbiórki okazjonalne); aplikacja ma zmienić je na **systematyczne**.

## Na czym polega rozwiązanie

Odróżnia je od istniejących platform to, że pieniądze za przedmiot trafiają **na cel wybrany przez oddającego** (fundację, dom dziecka, stowarzyszenie lub zbiórkę dla osób najbardziej potrzebujących), a nie do sprzedającego. Lista celów jest starannie wyselekcjonowana i weryfikowana.

## Ekrany platformy

- Strona główna: informacje, wyszukiwarka, ostatnio dodane ogłoszenia, baner zgody na cookies.
- Mój profil: imię i nazwisko, miasto, e-mail, telefon.
- Jak to działa? / O nas / Regulamin / Polityka prywatności.
- Przeglądaj: wyszukiwanie z filtrami i słowne.
- Dodaj przedmiot (dla zalogowanych): nazwa, opis, kategoria, miasto, stan, cena, zdjęcie.
- Logowanie / rejestracja (w tym przypomnienie hasła), podstrony ogłoszeń.
- Podsumowanie przed płatnością: od tego momentu przedmiot jest **rezerwowany na 15 minut**.
- Płatność przez operatora płatności; strona po udanej płatności.

## Komponenty techniczne

| Usługa | Rola |
|---|---|
| GitHub | repozytorium kodu |
| Vercel / Next.js (wersja 12) | framework aplikacji i hosting |
| Supabase (PostgreSQL) | dane tekstowe: produkty, użytkownicy |
| Cloudinary | CDN dla zdjęć wgrywanych przez użytkowników |
| SendGrid | wysyłka e-maili do użytkowników |
| Airtable | zarządzanie bazą przedmiotów przez moderatorów |

Technologie w kodzie: Tailwind CSS, Prisma (ORM), React, JavaScript, SQL.

*Uwaga z przejrzenia kodu (`Aplikacja kod.zip`, nie z dokumentu): w kodzie jest integracja ze Stripe (płatności) i next-auth (logowanie); wersje: Next 12.1.6, React 18.1.0, Prisma 3.15.x.*

## Wyniki testów

Dokument nie podaje wyników liczbowych, tylko wnioski jakościowe.

**Błędne założenia i wyzwania:**

- zaniżone oszacowanie infrastruktury przy większej liczbie użytkowników (ponad 12 testerów),
- trudność z umówieniem oddającego i odbierającego w jednym miejscu i czasie; administratorzy czasem dostarczali przedmioty osobiście,
- zdjęcia często słabej jakości,
- koncept Oddawaczy nie zawsze był zrozumiały dla uczestników.

**Potwierdzone hipotezy:**

- są osoby chętne oddawać zbędne rzeczy za darmo, wspierając organizacje charytatywne i postawy proekologiczne,
- wiele osób wybierze rzecz używaną zamiast nowej, jeśli darowizna trafia do organizacji charytatywnej,
- fundacje i stowarzyszenia chętnie podejmą współpracę (mają za mało środków).

**Typy przedmiotów na platformie:** rośliny, książki, drobna elektronika, zabawki, ubrania.

## Rekomendacje dla wdrażających

**Równowaga i start**

- Dbać o równowagę podaży i popytu (jak w Uber, Allegro, OLX); marketing kierować w równym stopniu do oddających i odbierających.
- Zapewnić wystarczającą liczbę przedmiotów na start, nawet ręcznie, z pomocą bliskich; pusta platforma zniechęca i może wyglądać na wyłudzenie.
- Skupić się na jednym mieście, jednej grupie społecznej lub jednej grupie przedmiotów, by szybciej osiągnąć masę krytyczną.
- Dobrze oszacować liczbę użytkowników i infrastrukturę (zwłaszcza liczbę zdjęć do przechowania).

**Promocja**

- Nagłośnić start przed uruchomieniem (znajomi, udostępnienia) i zbudować bazę pozytywnie nastawionych użytkowników.
- Być obecnym w mediach społecznościowych, także w rozmowach na grupach na Facebooku.
- Pozyskać ambasadorów (znane osoby, organizacje, firmy z dużą liczbą obserwujących).
- Wykorzystać zasięgi współpracujących fundacji i stowarzyszeń.
- Zaczynać od marketingu niszowego (małe grupy), potem rozszerzać.

**Rozwój**

- Rozwijać jedną funkcję na raz.
- Pozyskiwać zaangażowanych użytkowników, którzy zapewniają stały napływ ogłoszeń.
- Budować własną społeczność i silną markę projektu.
