# Cinco Noches con Gafas

Horror de vigilancia inspirado en *Five Nights at Freddy's*, ambientado en un local de entretenimiento.

---

## Personajes

| Personaje | Mecánica |
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
- **Generador de emergencia**: en un apagón, mantén **R** 3 segundos. Devuelve batería. Solo se puede usar **una vez por noche**.
- IA de equipo y anti-superposición de amenazas.
- Jumpscares diferenciados por personaje y pantalla de muerte con tip + reintento.
- Zumbido ambiental que aumenta cuando una amenaza se acerca.
- En **Ajustes** puedes bajar el volumen o activar “Reducir parpadeos y movimiento”.

---

## Cómo jugar (web / desarrollo)

```bash
npm install
npm run dev
```

Abre la URL que muestra Vite.  
`npm run build` genera la versión de producción para Deployments / hosting estático.

Hecho con **React + Vite + TanStack Start**.

---

## Ejecutable portable de Windows

```powershell
npm install
npm run desktop:dist
```

El archivo se crea en:
`artifacts/windows/Cinco Noches con Gafas-2.0.1-portable.exe`

> **Windows / SmartScreen:** el `.exe` no está firmado digitalmente. Si aparece “Windows protegió tu PC”:
> 1. Pulsa **Más información** → **Ejecutar de todas formas**.
> 2. O clic derecho en el `.exe` → **Propiedades** → marca **Desbloquear** (si aparece) → Aplicar.
> 3. Si el antivirus lo pone en cuarentena, restáuralo y añade una exclusión temporal de la carpeta.
>
> Alternativa fiable: juega la **versión web** en Deployments / `npm run dev` (no requiere instalar nada).
