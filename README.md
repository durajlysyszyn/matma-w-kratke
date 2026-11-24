# Matma w kratkę

Adaptacyjna aplikacja do nauki matematyki dla klas 1–8. Bez reklam, bez śledzenia, bez danych osobowych dziecka.

Strona: https://matma-w-kratke.netlify.app

## Jak to jest zorganizowane

| Folder / plik | Co zawiera |
| --- | --- |
| `src/` | kod aplikacji (silnik nauki, generatory zadań, interfejs) |
| `site/` | gotowa strona – **to publikuje Netlify** |
| `build.py` | buduje `site/` z `src/` (`python3 build.py`) |
| `config/` | konfiguracja Firebase dla strony, reguły bezpieczeństwa Firestore, instrukcja |
| `test/` | testy generatorów, silnika i przeglądarki |
| `netlify.toml` | Netlify publikuje folder `site/` bez budowania |

## Gałęzie i publikowanie (oszczędzanie kredytów Netlify)

- **`main`** – tu trafiają wszystkie zmiany. Zmiany w `main` **nie** publikują strony i nie zużywają kredytów.
- **`release`** – to, co jest na stronie. Netlify publikuje stronę **tylko** po zmianie w gałęzi `release` (1 wdrożenie ≈ 15 kredytów z 300 miesięcznie).

Release robisz wtedy, gdy uzbiera się dużo zmian:

1. Wejdź na stronę repozytorium → zakładka **Pull requests** → **New pull request**.
2. Ustaw: **base: `release`** ← **compare: `main`**. Kliknij **Create pull request**.
3. Przejrzyj listę zmian i kliknij **Merge pull request** → **Confirm merge**.
4. Netlify sam opublikuje stronę w ciągu ok. minuty (podgląd w Netlify → Deploys).

Wycofanie: w Netlify → **Deploys** wybierz poprzednie wdrożenie i kliknij **Publish deploy** (nie zużywa nowego wdrożenia z GitHuba).

## Testy (lokalnie)

```
node test/test_gens.js      # ~190 tys. zadań: poprawność kluczy
node test/test_engine.js    # silnik nauki
node test/test_model.js     # model nauki i migracja postępów
python3 -m http.server 8765 --directory src   # potem e2e_*.py (Playwright)
```
