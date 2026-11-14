# Ejecutar en Windows

## Generar el ejecutable (en un PC con Windows)

```powershell
npm install
npm run desktop:dist
```

Se crean en `artifacts/windows/`:

| Archivo | Uso |
| --- | --- |
| `CincoNochesConGafas-2.0.1-portable.exe` | Un solo archivo, no instala |
| `CincoNochesConGafas-2.0.1-setup.exe` | Instalador (atajos en escritorio y menú inicio) |

## Si Windows bloquea el .exe (SmartScreen)

El ejecutable **no está firmado** (cuesta un certificado de código). Windows a menudo muestra “Windows protegió tu PC”.

1. Clic en **Más información**.
2. Clic en **Ejecutar de todas formas**.

O:

1. Clic derecho en el `.exe` → **Propiedades**.
2. Si aparece **Desbloquear** al final de General, márcalo → **Aplicar** → **Aceptar**.
3. Abre el archivo de nuevo.

## Antivirus

Defender u otros a veces ponen el portable en cuarentena la primera vez:

1. Abre **Seguridad de Windows** → Protección contra virus.
2. **Historial de protección** → Restaurar el archivo.
3. Opcional: exclusiones → carpeta `artifacts\\windows`.

## Si la ventana sale negra / vacía

1. Confirma que compilaste con `npm run desktop:dist` (no copies solo el main sin `dist`).
2. Prueba el **instalador** (`-setup.exe`) en lugar del portable.
3. Alternativa sin exe: `npm run dev` y abre la URL en el navegador, o la versión en Deployments.

## Desarrollo rápido sin empaquetar

```powershell
npm run desktop:dev
```

Abre Electron cargando el build local (más fácil para probar).
