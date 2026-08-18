# Odliczanie — instalowalny zegar odliczający czas do wydarzenia

## Co to jest
Aplikacja webowa (PWA), którą każdy odbiorca linku może otworzyć w przeglądarce telefonu
i dodać do ekranu głównego jako „nakładkę" — ikonę uruchamiającą pełnoekranowy zegar,
bez paska adresu przeglądarki.

## Pliki
```
index.html      – cała aplikacja (UI, ustawienia, zegar, karta do udostępnienia)
manifest.json   – opis PWA (nazwa, ikony, tryb pełnoekranowy)
sw.js           – service worker (działanie offline + powiadomienia)
icons/          – domyślna ikona 192px i 512px (SCADA-style zegar)
```

## Wdrożenie na GitHub Pages
1. Wrzuć całą zawartość tego folderu do repozytorium (np. `countdown-app`).
2. W ustawieniach repo: **Settings → Pages → Branch: main / folder: root** (lub `/docs`, jeśli tam wgrasz pliki).
3. Po chwili aplikacja będzie dostępna pod `https://twoja-nazwa.github.io/countdown-app/`.
4. Ten link wysyłasz odbiorcom. Każdy z nich konfiguruje **własną** nazwę i datę wydarzenia
   lokalnie w swojej przeglądarce (dane trzymane są w `localStorage` na urządzeniu, nikt
   niczego nie udostępnia między sobą).

## Funkcje
- **Nazwa i data wydarzenia** – ustawiane w panelu ustawień (ikona ⚙ w prawym górnym rogu).
- **Własna grafika tła** – wybór zdjęcia z telefonu, zapisywane lokalnie.
- **Własna ikona** – podgląd i favicon zmieniają się od razu w aplikacji i na karcie do
  udostępnienia. **Uwaga:** prawdziwa ikona na ekranie głównym telefonu (ta widoczna po
  instalacji PWA) jest ustalana raz, z plików `icons/icon-192.png` i `icon-512.png` w
  repozytorium — to ograniczenie przeglądarek, nie da się jej zmieniać dynamicznie „na
  telefon" bez ponownej instalacji. Jeśli chcesz inną ikonę dla wszystkich, podmień te dwa
  pliki przed publikacją.
- **Zegar**: miesiące / tygodnie / dni / godziny / minuty / sekundy, licząc kalendarzowo
  (miesiące realnej długości, nie zaokrąglane).
- **Pasek postępu misji** – procent czasu, jaki upłynął od skonfigurowania wydarzenia do
  jego terminu.
- **Powiadomienia**: raz w tygodniu, a w ostatnim tygodniu przed wydarzeniem — codziennie.

## Uczciwie o powiadomieniach push (ważne)
To jest plik statyczny hostowany na GitHub Pages — **bez własnego serwera**. Prawdziwe push
notifications (budzące w pełni zamkniętą aplikację w dowolnym momencie) wymagają backendu
z kluczami VAPID i usługi push przeglądarki. Bez tego zrobiłem to, co da się zrobić najlepiej
po stronie klienta:
- Gdy użytkownik otworzy aplikację (lub ją odświeży w tle jako zainstalowaną PWA),
  aplikacja sama sprawdza, czy minął tydzień (lub dzień w ostatnim tygodniu) od ostatniego
  przypomnienia — i jeśli tak, natychmiast pokazuje powiadomienie systemowe.
- Dodatkowo rejestruje się **Periodic Background Sync** — funkcję dostępną obecnie głównie
  w Chrome na Androidzie dla zainstalowanych PWA. Przeglądarka sama, mniej więcej raz na
  dobę, budzi aplikację w tle i pozwala jej sprawdzić datę. Nie jest to gwarantowane co do
  minuty ani wspierane wszędzie (na iOS/Safari nie działa wcale).
- Efekt praktyczny: jeśli ktoś ma aplikację zainstalowaną i choć raz na kilka dni otwiera
  telefon, przypomnienia będą przychodzić regularnie. Jeśli chcesz w 100% pewnych powiadomień
  niezależnie od aktywności telefonu — to wymaga już małego serwera push (mogę to dograć,
  jeśli zechcesz rozwinąć projekt o backend, np. na Railway, tak jak Twoje inne serwisy).

## Dodatek od siebie
1. **Karta do udostępnienia** (przycisk „🖼 Udostępnij kartę") – generuje obraz PNG 1080×1350
   z nazwą wydarzenia, datą i aktualnym odliczeniem, gotowy do wysłania na Instagram/WhatsApp
   albo pobrania. Na urządzeniach z natywnym „Udostępnij" (Web Share API) otwiera się od razu
   system share sheet.
2. **Kamienie milowe** – automatyczne odznaki i konfetti przy 180, 100, 30, 14, 7, 3, 2, 1 i 0
   dniach do wydarzenia — drobny, ale sympatyczny akcent dla odbiorców linku.
3. **Pasek postępu misji** – wizualne poczucie „ile już minęło / ile zostało" w stylu
   telemetrii, spójne z estetyką pozostałych Twoich narzędzi (SCADA dark UI, teal/amber).

## Rozwój na przyszłość (opcjonalnie)
- Prawdziwy backend push (Railway + web-push/VAPID) dla 100% pewnych powiadomień.
- Obsługa wielu wydarzeń jednocześnie (lista odliczeń zamiast jednego).
- Personalizacja kolorów akcentu w ustawieniach.
