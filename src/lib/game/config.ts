import type { AiLevels, CamId } from "./types.ts";

export const SAVE_KEY = "cncg-save-v2";

export const HOUR_LEN = 50;

export const ASSETS = {
  officeCenter: "/game/rooms/office-center.jpg",
  officeLeft: "/game/rooms/office-left.jpg",
  officeRight: "/game/rooms/office-right.jpg",
  menu: "/game/rooms/menu.jpg",
  cams: {
    stage: "/game/rooms/cam-stage.jpg",
    games: "/game/rooms/cam-games.jpg",
    prize: "/game/rooms/cam-prize.jpg",
    cove: "/game/rooms/cam-cove.jpg",
    hall: "/game/rooms/cam-hall.jpg",
    parts: "/game/rooms/cam-parts.jpg",
    party: "/game/rooms/cam-party.jpg",
    ventL: "/game/rooms/cam-vent-l.jpg",
    ventR: "/game/rooms/cam-vent-r.jpg",
    kitchen: "/game/rooms/cam-kitchen.svg",
    storage: "/game/rooms/cam-storage.svg",
  } satisfies Record<CamId, string>,
  gafas: "/game/chars/gafas.png",
  mueca: "/game/chars/mueca.png",
  chaparro: "/game/chars/chaparro-v2.png",
  fachero: "/game/chars/fachero.png",
  tortolo: "/game/chars/tortolo.png",
  gafasJpg: "/game/chars/gafas.jpg",
  muecaJpg: "/game/chars/mueca.jpg",
  chaparroJpg: "/game/chars/chaparro-v2.jpg",
  facheroJpg: "/game/chars/fachero.jpg",
  tortoloJpg: "/game/chars/tortolo.jpg",
  gafasJump: "/game/chars/gafas-jump.mp4",
  muecaJump: "/game/chars/mueca-jump.mp4",
  chaparroJump: "/game/chars/chaparro-jump-v2.mp4",
  facheroJump: "/game/chars/fachero-jump.mp4",
  tortoloJump: "/game/chars/tortolo-jump.mp4",
} as const;

export const CAM_LIST: { id: CamId; num: string; name: string }[] = [
  { id: "stage", num: "01", name: "Escenario" },
  { id: "games", num: "02", name: "Juegos" },
  { id: "prize", num: "03", name: "Premios" },
  { id: "cove", num: "04", name: "Cueva" },
  { id: "hall", num: "05", name: "Pasillo" },
  { id: "parts", num: "06", name: "Taller" },
  { id: "party", num: "07", name: "Fiesta" },
  { id: "ventL", num: "08", name: "Conducto I" },
  { id: "ventR", num: "09", name: "Conducto D" },
  { id: "kitchen", num: "10", name: "Cocina" },
  { id: "storage", num: "11", name: "Almacén" },
];

export function aiForNight(night: number): AiLevels {
  switch (night) {
    case 1:
      return { gafas: 4, muecas: 0, chaparro: 3, fachero: 0, tortolo: 6 };
    case 2:
      return { gafas: 7, muecas: 6, chaparro: 5, fachero: 0, tortolo: 8 };
    case 3:
      return { gafas: 9, muecas: 9, chaparro: 7, fachero: 6, tortolo: 10 };
    case 4:
      return { gafas: 12, muecas: 12, chaparro: 10, fachero: 9, tortolo: 12 };
    case 5:
      return { gafas: 15, muecas: 15, chaparro: 13, fachero: 13, tortolo: 14 };
    case 6:
      return { gafas: 18, muecas: 17, chaparro: 16, fachero: 16, tortolo: 16 };
    default:
      return { gafas: 5, muecas: 5, chaparro: 4, fachero: 4, tortolo: 6 };
  }
}

export const PHONE: Record<number, string[]> = {
  1: [
    "Aló. Turno de cinco minutos, de las 12 a las 6. La batería ahora aguanta si no lo enciendes todo junto.",
    "Gafas entra por el conducto izquierdo. Cuando lo veas en la boca del ducto, cierra la puerta izquierda. Muecas hace lo mismo por la derecha: puerta derecha.",
    "Chaparro se planta al fondo del pasillo central. Parpadea la linterna tres veces mirándolo y se va. Si no, salta.",
  ],
  2: [
    "El Fachero se acerca en silencio. Cuando entre a la oficina, míralo. Si dejas de verlo más de cinco segundos, te mata. Si lo miras un rato, se va.",
    "Tórtolo se esconde en las cámaras. Encuéntralo y dale tres destellos con el botón Destello, o con F. Si no lo calmas, entra y te mata.",
  ],
  3: ["Los dos conductos pueden llenarse a la vez. No dejes las puertas cerradas de más: la batería suma cada cosa que dejas encendida."],
  4: ["Chaparro aguanta menos. Tórtolo cambia de cámara. No te quedes en el monitor si el Fachero ya está dentro."],
  5: ["Última noche del contrato. Cinco minutos. Si llegas a las 6, te pagan."],
  6: ["No debiste volver. Ya saben cómo entras."],
};

export const NEWSPAPER = {
  kicker: "El Diario Local  —  Noviembre 1987",
  headline: "La pizzería de Gafas contrata guardia. El Almirante inspecciona",
  body: "A. Chaparro promete “un solo mando”. Gafas patrulla los pasillos con linterna. Muecas se oye por los conductos. Un empleado anónimo jura haber visto un brillo rojo en unas gafas de sol en la oscuridad, y al General Tórtolo plantado frente a una cámara sin hacer nada. Turno de 12 a 6. Se paga en efectivo. No preguntar por los anteriores.",
};
