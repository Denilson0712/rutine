import { business } from '../config/business.js';

export const BENEFIT_GROUPS = [
  {
    id: 'dinero',
    title: 'Tu dinero, en claro',
    text: 'Sabes cuánto entró, cuánto salió y quién falta por pagar.',
    items: [
      { icon: 'wallet', title: 'Control financiero', text: 'Ingresos y gastos registrados en un mismo lugar.' },
      { icon: 'clock', title: 'Pagos pendientes', text: 'Quién pagó, quién debe y desde cuándo.' },
      { icon: 'chart', title: 'Estadísticas del negocio', text: 'Reportes para decidir con números.' },
    ],
  },
  {
    id: 'miembros',
    title: 'Tus miembros, al día',
    text: 'Cada membresía con su plan, su fecha y su estado.',
    items: [
      { icon: 'refresh', title: 'Membresías y renovaciones', text: 'Vencimientos a la vista antes de que pasen.' },
      { icon: 'users', title: 'Administración de clientes', text: 'Fichas, planes e historial de cada persona.' },
    ],
  },
  {
    id: 'operacion',
    title: 'Tu operación, en orden',
    text: 'Entrenadores, horarios y cupos sin cruces.',
    items: [
      { icon: 'trainer', title: 'Gestión de entrenadores', text: 'Perfiles, especialidades y horarios asignados.' },
      { icon: 'calendar', title: 'Horarios y cupos', text: 'Capacidad máxima por sesión y reservas ordenadas.' },
    ],
  },
];

export const ATHLETE_FEATURES = [
  { icon: 'pin', title: 'Busca por ciudad', text: 'Explora los gimnasios afiliados en tu ciudad o en la que estás de visita.' },
  { icon: 'dumbbell', title: 'Compara servicios', text: 'Revisa qué ofrece cada gimnasio, sus horarios y sus planes.' },
  { icon: 'trainer', title: 'Conoce a los entrenadores', text: 'Mira su especialidad y su experiencia antes de entrenar con ellos.' },
];

export const ATHLETE_ROADMAP = ['Reservas de clases', 'Gimnasios favoritos', 'Membresías desde tu cuenta', 'Seguimiento de entrenamientos'];

export const STEPS = {
  gimnasios: [
    { title: 'Solicita la afiliación', text: 'Completa el formulario con los datos básicos de tu gimnasio.' },
    { title: 'Registra tu establecimiento', text: 'Ubicación, servicios, horarios de atención y fotos.' },
    { title: 'Configura tu operación', text: 'Planes, membresías, entrenadores y cupos por sesión.' },
    { title: 'Gestiona y crece', text: 'Administra el día a día y recibe atletas desde la plataforma.' },
  ],
  atletas: [
    { title: 'Elige tu ciudad', text: 'Busca entre los gimnasios afiliados de tu zona.' },
    { title: 'Revisa los servicios', text: 'Planes, instalaciones y horarios de cada gimnasio.' },
    { title: 'Descubre entrenadores y horarios', text: 'Encuentra la clase o el entrenador que encaja contigo.' },
    { title: 'Usa lo que esté habilitado', text: 'Reservas y membresías se activan según cada gimnasio y etapa del producto.' },
  ],
};

export const AFFILIATION_VALUE = [
  'Un panel para pagos, membresías, clientes y entrenadores.',
  'Horarios y cupos configurados según tu capacidad real.',
  'Un perfil público para que los atletas de tu ciudad te encuentren.',
  'Reportes para entender cómo va tu negocio.',
];

function commissionAnswer() {
  if (business.commissionRate != null) {
    const scope = business.commissionScope ? ` ${business.commissionScope}` : '';
    return `Rutine cobra una comisión del ${business.commissionRate} %${scope}. Las condiciones completas se revisan contigo durante la afiliación.`;
  }
  return 'Rutine trabaja con una comisión porcentual sobre las operaciones acordadas con cada gimnasio. El porcentaje y sus condiciones se te explican con claridad durante el proceso de afiliación, antes de que confirmes nada.';
}

export const FAQ = [
  {
    q: '¿Qué es Rutine?',
    a: 'Una plataforma que conecta gimnasios, entrenadores y atletas en Venezuela. Los gimnasios gestionan su operación desde un panel y los atletas descubren dónde entrenar.',
  },
  {
    q: '¿Quién puede afiliar un gimnasio?',
    a: 'El dueño o la persona responsable de administrar el gimnasio. Durante la afiliación verificamos los datos del establecimiento.',
  },
  { q: '¿Cómo funciona la comisión?', a: commissionAnswer() },
  {
    q: '¿Qué herramientas obtiene un gimnasio?',
    a: 'Control de ingresos y gastos, seguimiento de pagos y membresías, gestión de clientes y entrenadores, horarios con cupos y un perfil visible para atletas. Algunas funciones se habilitan por etapas.',
  },
  {
    q: '¿Cómo encuentra un atleta un gimnasio?',
    a: 'Busca por estado y ciudad, y revisa los servicios, horarios y entrenadores de cada gimnasio afiliado.',
  },
  {
    q: '¿Cómo se registran los entrenadores?',
    a: 'Los registra cada gimnasio desde su panel, con su especialidad, experiencia y horarios.',
  },
  {
    q: '¿Cómo funcionan los horarios y las reservas?',
    a: 'Cada gimnasio define sus sesiones y la capacidad máxima de cada una. Los cupos disponibles dependen de las reservas confirmadas y de las cancelaciones válidas según las reglas de ese gimnasio.',
  },
  {
    q: '¿Qué necesito para empezar?',
    a: 'Si tienes un gimnasio, envía la solicitud de afiliación y te contactaremos para revisar los siguientes pasos. Si entrenas, solo tienes que explorar los gimnasios de tu ciudad.',
  },
];
