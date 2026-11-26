// src/lib/versiculoDelDia.ts
// Banco de versículos para el banner de inicio. Se elige uno de forma
// determinística según la fecha, así que todos los usuarios ven el mismo
// versículo el mismo día, y cambia automáticamente a la medianoche.

export interface VersiculoDia {
  texto: string
  cita: string
}

const VERSICULOS: VersiculoDia[] = [
  { texto: 'Toda la Escritura es inspirada por Dios y útil para enseñar, para redargüir, para corregir, para instruir en justicia.', cita: '2 Timoteo 3:16' },
  { texto: 'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree no se pierda, mas tenga vida eterna.', cita: 'Juan 3:16' },
  { texto: 'Jehová es mi pastor; nada me faltará.', cita: 'Salmo 23:1' },
  { texto: 'Y sabemos que a los que aman a Dios, todas las cosas les ayudan a bien, esto es, a los que conforme a su propósito son llamados.', cita: 'Romanos 8:28' },
  { texto: 'En el principio creó Dios los cielos y la tierra.', cita: 'Génesis 1:1' },
  { texto: 'Todo lo puedo en Cristo que me fortalece.', cita: 'Filipenses 4:13' },
  { texto: 'Confía en Jehová de todo tu corazón, y no te apoyes en tu propia prudencia.', cita: 'Proverbios 3:5' },
  { texto: 'No temas, porque yo estoy contigo; no desmayes, porque yo soy tu Dios que te esfuerzo.', cita: 'Isaías 41:10' },
  { texto: 'Mas buscad primeramente el reino de Dios y su justicia, y todas estas cosas os serán añadidas.', cita: 'Mateo 6:33' },
  { texto: 'El amor es sufrido, es benigno; el amor no tiene envidia, el amor no es jactancioso, no se envanece.', cita: '1 Corintios 13:4' },
  { texto: 'Encomienda a Jehová tu camino, y confía en él; y él hará.', cita: 'Salmo 37:5' },
  { texto: 'Por gracia sois salvos por medio de la fe; y esto no de vosotros, pues es don de Dios.', cita: 'Efesios 2:8' },
  { texto: 'Este es el día que hizo Jehová; nos gozaremos y alegraremos en él.', cita: 'Salmo 118:24' },
  { texto: 'Cristo Jesús vino al mundo para salvar a los pecadores, de los cuales yo soy el primero.', cita: '1 Timoteo 1:15' },
  { texto: 'Porque yo sé los pensamientos que tengo acerca de vosotros, dice Jehová, pensamientos de paz, y no de mal, para daros el fin que esperáis.', cita: 'Jeremías 29:11' },
  { texto: 'No te he mandado yo que te esfuerces y seas valiente? No temas ni desmayes, porque Jehová tu Dios estará contigo.', cita: 'Josué 1:9' },
  { texto: 'Amados, amémonos unos a otros; porque el amor es de Dios.', cita: '1 Juan 4:7' },
  { texto: 'Bienaventurados los de limpio corazón, porque ellos verán a Dios.', cita: 'Mateo 5:8' },
  { texto: 'Jehová es mi luz y mi salvación; ¿de quién temeré?', cita: 'Salmo 27:1' },
  { texto: 'Venid a mí todos los que estáis trabajados y cargados, y yo os haré descansar.', cita: 'Mateo 11:28' },
  { texto: 'El corazón alegre constituye buen remedio; mas el espíritu triste seca los huesos.', cita: 'Proverbios 17:22' },
  { texto: 'Alégrense y gócense en ti todos los que te buscan; y digan siempre: Engrandecido sea Jehová, los que aman tu salvación.', cita: 'Salmo 40:16' },
  { texto: 'Por tanto, si alguno está en Cristo, nueva criatura es; las cosas viejas pasaron; he aquí todas son hechas nuevas.', cita: '2 Corintios 5:17' },
  { texto: 'No os afanéis por nada; sino sean conocidas vuestras peticiones delante de Dios en toda oración y ruego, con acción de gracias.', cita: 'Filipenses 4:6' },
  { texto: 'Jehová peleará por vosotros, y vosotros estaréis tranquilos.', cita: 'Éxodo 14:14' },
  { texto: 'El que habita al abrigo del Altísimo morará bajo la sombra del Omnipotente.', cita: 'Salmo 91:1' },
  { texto: 'Fiel es Dios, que no os dejará ser tentados más de lo que podéis resistir.', cita: '1 Corintios 10:13' },
  { texto: 'Estad quietos, y conoced que yo soy Dios.', cita: 'Salmo 46:10' },
  { texto: 'Y estoy persuadido de esto, que el que comenzó en vosotros la buena obra, la perfeccionará hasta el día de Jesucristo.', cita: 'Filipenses 1:6' },
  { texto: 'Dad gracias en todo, porque esta es la voluntad de Dios para con vosotros en Cristo Jesús.', cita: '1 Tesalonicenses 5:18' },
]

function diaDelAnio(fecha: Date): number {
  const inicio = new Date(fecha.getFullYear(), 0, 0)
  const diff = fecha.getTime() - inicio.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export function getVersiculoDelDia(fecha: Date = new Date()): VersiculoDia {
  const indice = diaDelAnio(fecha) % VERSICULOS.length
  return VERSICULOS[indice]
}
