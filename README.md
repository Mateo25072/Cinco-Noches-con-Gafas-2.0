# Cinco Noches con Gafas

Fan game tipo *Five Nights at Freddy's*.  
**No está afiliado** a Scott Cawthon ni a Steel Wool Studios.

Cinco amenazas. Cada una se enfrenta de forma distinta. Sobrevive de las 12 AM a las 6 AM.

---

## Personajes y cómo defenderte

| Quién | Cómo se defiende |
| --- | --- |
| **Gafas** | Entra por el **conducto izquierdo**. Cuando llega a la boca del ducto, cierra la **puerta izquierda (Q)**. |
| **Muecas** | Entra por el **conducto derecho**. Cuando llega a la boca, cierra la **puerta derecha (E)**. |
| **Almirante Chaparro** | Se planta al fondo del pasillo central. **Parpadea la linterna 3 veces** mirándolo (mantén **F**) y se va. |
| **El Fachero** | Entra en silencio a la oficina. **Míralo**. Si dejas de verlo más de 5 segundos, te mata. Si sostienes la mirada, se retira. |
| **General Tórtolo** | Se esconde en las cámaras. Encuéntralo y dale **3 destellos** (botón *Destello* o tecla **F** en el monitor). Si no lo calmas, entra y te mata. |

---

## Controles

| Acción | Teclado | Móvil / Táctil |
| --- | --- | --- |
| Mirar izquierda / derecha | **A / D** o ratón | Deslizar |
| Puerta izquierda | **Q** | Botón *Puerta I* |
| Puerta derecha | **E** | Botón *Puerta D* |
| Rejilla del conducto | **G** o **V** | Botón *Rejilla* |
| Linterna | **F** (mantener) | Mantener botón *Linterna* |
| Cámaras / Tablet | **C** o **Espacio** | Botón *Cámaras* |
| Destello en cámara | **F** (con tablet abierta) | Botón *Destello* |
| Reiniciar generador (apagón) | Mantener **R** 3 segundos | Mantener el botón de reinicio |

**Batería**: se consume con puertas, rejilla, linterna y tablet. Si se agota → apagón.

---

## Mejoras de la edición ampliada

- **CAM 10 (Cocina)** y **CAM 11 (Almacén)** con rutas nuevas.
- **Señuelos**:
  - Cocina → golpear ollas (aleja a Gafas).
  - Almacén → campana (distrae a Muecas).
  - Cada uso cuesta **8 % de batería** y tiene enfriamiento.
- **Generador de emergencia**: en un apagón, mantén **R** 3 segundos. Devuelve **28 % de batería**. Solo se puede usar **una vez por noche**.
- Zumbido ambiental que aumenta cuando una amenaza se acerca.
- En **Ajustes** puedes bajar el volumen o activar “Reducir parpadeos y movimiento”.

---

## Cómo jugar (desarrollo)

```bash
npm install
npm run dev
```

Abre la URL que muestra Vite.  
`npm run build` genera la versión de producción.

Hecho con **React + Vite + TanStack Start**.

---

## Ejecutable portable de Windows (sin conexión)

Genera un único `.exe` portable con el juego, imágenes y videos de jumpscare.

Requisitos: Windows x64 + Node.js 22.

```powershell
npm install
npm run desktop:dist
```

El archivo se crea en:
`artifacts/windows/Cinco Noches con Gafas-2.0.0-portable.exe`

> Windows puede mostrar la advertencia de SmartScreen porque el ejecutable no está firmado.

---

## APK Android (offline)

La versión Android usa los mismos recursos locales. Se inicia en horizontal y los controles son táctiles.

Requisitos: Node.js 22, JDK 21 y Android Studio (SDK Platform 35).

```powershell
npm install
npm run android:apk
```

El APK de prueba se genera en:
`android/app/build/outputs/apk/debug/app-debug.apk`

Para una versión de distribución, firma un APK *release* con tu propia clave (nunca subas la clave privada).

---

## Notas técnicas recientes

- **Voz del teléfono** (explicación de mecánicas al inicio de la noche): se mejoró el sistema de `speechSynthesis` para que espere correctamente a que las voces estén cargadas. Si en algún dispositivo Android no se escucha, es limitación de la plataforma.
- El progreso se guarda localmente en el navegador / perfil de Windows / dispositivo Android.

---

Fan game creado para diversión. Disfruta y sobrevive hasta las 6 AM.
