# Cinco Noches con Gafas

Fan game tipo Five Nights at Freddy's. No está afiliado a Scott Cawthon ni Steel Wool.

Cinco amenazas. Cada una se contrapone distinto.

## Personajes

| Quién | Cómo se defiende |
| --- | --- |
| **Gafas** | Linterna en el pasillo. Si abres las cámaras con él en la puerta, te encandila, sube el pánico y te come 10% de batería. |
| **Almirante Chaparro** | Camina lento. No lo mires más de 3 segundos en una cámara: se ofende y llena esa cámara de humo el resto de la noche. En la puerta izquierda, ciérrala. |
| **Muecas** | No sale en cámaras. Un grito se acerca por el conducto. Cuando está encima, 2 segundos para cerrar la rejilla. |
| **El Fachero** | Sin ruido. Solo un brillo rojo en las gafas. En la puerta derecha, cierra **sin** encender la linterna. |
| **General Tórtolo** | Se planta en la cámara 05 (pasillo) y no hace nada. Es un señuelo. Ignóralo. |

## Controles

- Mirar: ratón o A / D
- Puerta izquierda: **Q**
- Puerta derecha: **E**
- Rejilla del conducto: **G** o **V**
- Linterna: **F** (mantener)
- Cámaras: **C** o espacio

Batería: puertas, rejilla, linterna y tablet. Si se acaba, se apaga todo.

## Mejoras de la edición ampliada

- CAM 10 (Cocina) y CAM 11 (Almacén) añaden rutas nuevas con arte original.
- Los señuelos de cocina y almacén pueden retrasar a Gafas y Muecas. Cada uso consume 8% de batería y tiene enfriamiento.
- En un apagón, mantén **R** durante 3 segundos para reiniciar el generador; devuelve 28% de batería y solo se puede usar una vez por noche.
- El zumbido ambiental aumenta cuando una amenaza se acerca. En **Ajustes** puedes bajar el volumen o reducir los destellos y el movimiento.

## Cómo correrlo

```bash
npm install
npm run dev
```

Abre la URL que imprime Vite. `npm run build` genera la versión de producción.

Hecho con React, Vite y TanStack Start.

## Ejecutable portatil de Windows sin conexion

El proyecto puede generar un unico `.exe` portable que incluye el juego, sus
imagenes y los cinco videos de animacion. Una vez generado, se puede abrir sin
instalador, servidor ni conexion a internet. El progreso se guarda localmente
en el perfil de Windows.

En Windows x64 con Node.js 22, instala las dependencias y genera el ejecutable:

```powershell
npm install
npm run desktop:dist
```

El archivo se genera en
`artifacts/windows/Cinco Noches con Gafas-2.0.0-portable.exe`. Windows puede
mostrar una advertencia de SmartScreen porque el ejecutable no esta firmado.

## APK Android offline

La version Android usa el mismo juego y recursos locales. Se inicia en
paisaje; los controles son tactiles. Cocina, Almacen, señuelos, audio,
animaciones y progreso local funcionan sin conexion.

Instala Node.js 22, JDK 21 y Android Studio con Android SDK Platform 35. Luego,
desde Windows, ejecuta:

```powershell
npm install
npm run android:apk
```

El APK de prueba se genera en
`android/app/build/outputs/apk/debug/app-debug.apk`. Para distribuirlo como
version final, firma un APK release con una clave propia de Android; no
compartas ni subas la clave privada.
