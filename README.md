# VilahexDoss conectado a Supabase

## Publicación

Subir `index.html`, `app.js`, `bootstrap.js`, `.nojekyll` y `README.md` a la raíz del repositorio GitHub.

**No publiques datos JSON de obras ni claves `service_role`.** El repositorio se puede hacer público solo tras revisar que el HTML no incluye datos privados incrustados.

## Supabase

Se requiere la tabla `public.app_state` (user_id uuid PK, data jsonb, updated_at timestamptz) con RLS y políticas SELECT/INSERT/UPDATE para `auth.uid() = user_id`. Esa tabla se configuró anteriormente.

En Authentication → Providers, habilitar Email. Si se exige confirmar correo, configurar Authentication → URL Configuration: `Site URL` = URL publicada en GitHub Pages y agregar la misma a `Redirect URLs`.

## Funcionamiento

La aplicación **no carga** hasta autenticarse. Al entrar descarga los cinco grupos de datos asociados a la cuenta; si no existen empieza vacía. Al guardar, sincroniza el estado completo a Supabase. El estado aparece abajo a la izquierda. El contenido de `localStorage` es solo caché del dispositivo y NO debe usarse como protección para datos sensibles.

**Limitación importante:** el guardado de estado completo puede sobrescribir cambios cuando dos pestañas o dispositivos editan a la vez. No se recomienda edición simultánea en producción hasta implantar sincronización por registros o control de versiones. La prueba debe realizarse con una sola sesión editando. Si la conexión falla, el indicador avisará del error.

## Seguridad y pruebas

1. Comprobar RLS y políticas de `app_state`.
2. Crear cuenta y confirmar correo.
3. Crear una obra de prueba y comprobar que aparece en la tabla Supabase.
4. Abrir con la **misma** cuenta en el móvil y confirmar que se carga.
5. Comprobar que una cuenta distinta NO puede leer la información.

**No se han importado datos antiguos.** Conserva el HTML original y el JSON de respaldo.
