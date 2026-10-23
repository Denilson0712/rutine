/**
 * DATOS DE DEMOSTRACIÓN.
 * Solo sirven para ilustrar el panel en la landing. No son métricas reales
 * de Rutine ni de ningún gimnasio, y no contienen datos personales.
 */
export const DEMO_SUMMARY = {
  income: 'US$ 4.280',
  expenses: 'US$ 1.950',
  activeMemberships: 186,
  pendingPayments: 14,
  renewalsThisWeek: 9,
  trainers: 6,
  weeklyIncome: [
    { label: 'Lun', value: 620 },
    { label: 'Mar', value: 540 },
    { label: 'Mié', value: 710 },
    { label: 'Jue', value: 480 },
    { label: 'Vie', value: 830 },
    { label: 'Sáb', value: 690 },
  ],
};

export const DEMO_MEMBERS = [
  { id: 'Miembro 014', plan: 'Mensual', status: 'paid', detail: 'Pagado' },
  { id: 'Miembro 027', plan: 'Trimestral', status: 'due', detail: 'Vence en 2 días' },
  { id: 'Miembro 031', plan: 'Mensual', status: 'late', detail: 'Vencida hace 5 días' },
  { id: 'Miembro 042', plan: 'Mensual', status: 'paid', detail: 'Pagado' },
  { id: 'Miembro 058', plan: 'Semestral', status: 'due', detail: 'Vence en 6 días' },
];

export const DEMO_SESSIONS = [
  { name: 'Fuerza', time: '6:00 a. m.', booked: 11, capacity: 12 },
  { name: 'Funcional', time: '7:00 a. m.', booked: 8, capacity: 16 },
  { name: 'Spinning', time: '6:00 p. m.', booked: 20, capacity: 20 },
  { name: 'Movilidad', time: '7:30 p. m.', booked: 5, capacity: 10 },
];

export const DEMO_TRAINERS = [
  { initials: 'EF', role: 'Entrenador de fuerza', specialty: 'Fuerza y técnica', years: 6 },
  { initials: 'MP', role: 'Entrenadora funcional', specialty: 'Funcional y HIIT', years: 4 },
  { initials: 'JR', role: 'Instructor de ciclismo', specialty: 'Spinning y cardio', years: 3 },
];

export const DEMO_AGENDA = {
  days: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  sessions: [
    { id: 's1', day: 0, slot: '6:00', name: 'Fuerza', trainer: 'EF', capacity: 12, booked: 9 },
    { id: 's2', day: 1, slot: '7:00', name: 'Funcional', trainer: 'MP', capacity: 16, booked: 16 },
    { id: 's3', day: 2, slot: '18:00', name: 'Spinning', trainer: 'JR', capacity: 20, booked: 13 },
    { id: 's4', day: 3, slot: '6:00', name: 'Fuerza', trainer: 'EF', capacity: 12, booked: 4 },
    { id: 's5', day: 4, slot: '18:00', name: 'HIIT', trainer: 'MP', capacity: 14, booked: 12 },
    { id: 's6', day: 5, slot: '9:00', name: 'Spinning', trainer: 'JR', capacity: 20, booked: 7 },
  ],
  slots: ['6:00', '7:00', '9:00', '18:00'],
};
