# VilahexDoss — Tablón de Obras

Versión estática preparada para GitHub Pages, con exportación e importación de copias JSON.

## Aviso importante de datos
La información que has introducido en tu ordenador se guarda en localStorage **del navegador y origen donde abrías el HTML**. No va incluida en este repositorio y **NO se sincroniza automáticamente** al publicarlo. Haz una copia desde la aplicación original ANTES de usar la publicada. No borres la aplicación ni limpies sus datos.

1. Abre la versión original, desde el navegador y equipo donde aparecen tus obras reales.
2. Si esa versión no tiene botón de exportación, usa el procedimiento de copia proporcionado en la conversación (exporta las cinco claves de localStorage).
3. Guarda el JSON en una ubicación privada, fuera de GitHub.
4. Publica `index.html` y `.nojekyll` en la rama `main`.
5. En GitHub > Settings > Pages > Build and deployment: Deploy from a branch; main; /(root); Save.
6. En la página publicada, usa 'Restaurar copia' con tu archivo JSON, solo después de comprobarlo. Es una copia local por navegador, no una base de datos centralizada.

## Seguridad
No subas archivos de copia JSON ni información privada. Esta versión **no está conectada a Supabase**, no tiene autenticación, y no es adecuada para trabajar con datos reales en varios dispositivos. Antes del uso compartido, implementar Supabase Auth, tablas y políticas RLS; verificar migración y copias de seguridad.
