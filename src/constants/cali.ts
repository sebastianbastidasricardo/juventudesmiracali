export const CITIES = ['Cali', 'Jamundí', 'Yumbo'] as const;
export type CityName = typeof CITIES[number];

export const CALI_COMMUNES = [
  'Comuna 1', 'Comuna 2', 'Comuna 3', 'Comuna 4', 'Comuna 5',
  'Comuna 6', 'Comuna 7', 'Comuna 8', 'Comuna 9', 'Comuna 10',
  'Comuna 11', 'Comuna 12', 'Comuna 13', 'Comuna 14', 'Comuna 15',
  'Comuna 16', 'Comuna 17', 'Comuna 18', 'Comuna 19', 'Comuna 20',
  'Comuna 21', 'Comuna 22',
  'Corregimiento Navarro', 'Corregimiento La Buitrera', 'Corregimiento Villacarmelo',
  'Corregimiento Los Andes', 'Corregimiento Pichindé', 'Corregimiento Leonera',
  'Corregimiento Felidia', 'Corregimiento El Saladito', 'Corregimiento La Elvira',
  'Corregimiento La Castilla', 'Corregimiento La Paz', 'Corregimiento Golondrinas',
  'Corregimiento Montebello', 'Corregimiento Pance', 'Corregimiento Hormiguero'
];

export const YUMBO_COMMUNES = [
  'Comuna 1',
  'Comuna 2',
  'Comuna 3',
  'Comuna 4',
  'Corregimiento Dapa',
  'Corregimiento Mulaló',
  'Corregimiento San Marcos',
  'Corregimiento Yumbillo',
  'Corregimiento Montañitas',
  'Corregimiento Santa Inés',
  'Corregimiento La Cumbrecita',
  'Corregimiento Platanares'
];

export const JAMUNDI_COMMUNES = [
  'Comuna 1 (Zona Centro / Occidental)',
  'Comuna 2 (Zona Expansión / Ciudadelas)',
  'Corregimiento Potrerito',
  'Corregimiento Villa Paz',
  'Corregimiento Robles',
  'Corregimiento Quinamayó',
  'Corregimiento Timba',
  'Corregimiento San Antonio',
  'Corregimiento Ampudia',
  'Corregimiento Villacolombia',
  'Corregimiento Paso de la Bolsa',
  'Corregimiento Guachinte',
  'Corregimiento Chagres'
];

export const COMMUNES_BY_CITY: Record<CityName, string[]> = {
  'Cali': CALI_COMMUNES,
  'Jamundí': JAMUNDI_COMMUNES,
  'Yumbo': YUMBO_COMMUNES
};

export const STUDY_AREAS = [
  'Tecnología / TI',
  'Derecho y Ciencias Políticas',
  'Salud / Medicina',
  'Ingeniería',
  'Arte / Diseño',
  'Administración y Negocios',
  'Servicio al Cliente y Ventas',
  'Educación',
  'Comunicación / Marketing',
  'Logística y Operación',
  'Idiomas y Lenguas Extranjeras',
  'Gastronomía y Cocina',
  'Veterinaria y Cuidado Animal',
  'Belleza y Cuidado Personal',
  'Deporte y Actividad Física',
  'Turismo y Hotelería',
  'Otra'
];

export const EDUCATION_LEVELS = [
  'Primaria',
  'Bachillerato',
  'Técnico',
  'Tecnólogo',
  'Profesional',
  'Maestría'
];

export const GENDERS = ['Masculino', 'Femenino'];

export const INTERESTS = [
  'Liderazgo', 'Tecnología', 'Deportes', 'Arte',
  'Cultura', 'Medio ambiente', 'Emprendimiento', 'Voluntariado',
  'Formación', 'Política', 'Protección Animal', 'Idiomas y Bilingüismo'
];

export const NEIGHBORHOODS_BY_COMMUNE: Record<string, string[]> = {
  'Comuna 1': ['Terrón Colorado', 'Vista Hermosa', 'Aguacatal', 'Patio Bonito', 'El Realengo', 'La Legua'],
  'Comuna 2': ['Altos de Menga', 'Alameda del Río', 'Arboleda', 'Brisas de los Álamos', 'Centenario', 'Chipichape', 'Ciudad Los Álamos', 'El Bosque', 'Granada', 'Juanambú', 'La Campiña', 'La Flora', 'La Paz', 'Menga', 'Normandía', 'Parque del Amor', 'Prados del Norte', 'Rincón de La Flora', 'San Vicente', 'Santa Mónica Residencial', 'Santa Rita', 'Santa Teresita', 'Sector Altos de Normandía (Bataclán)', 'Urbanización La Merced', 'Versalles', 'Vipasa'],
  'Comuna 3': ['San Antonio', 'El Peñón', 'San Cayetano', 'Los Libertadores', 'San Pascual', 'Santa Rosa', 'San Pedro', 'San Nicolás', 'El Calvario', 'La Merced', 'Centro', 'Acosta'],
  'Comuna 4': ['Jorge Isaacs', 'Bolivariano', 'La Isla', 'Olaya Herrera', 'Industrial', 'Salomia', 'Popular', 'Manzanares', 'Fátima', 'Bueno Madrid', 'Guayaquil', 'Obrero', 'Porvenir', 'Las Américas', 'Atanasio Girardot', 'Aranjuez', 'Metropolitano'],
  'Comuna 5': ['La Rivera', 'Los Andes', 'La Mutualidad', 'Sena', 'Siete de Septiembre', 'Chiminangos', 'Metropolitano del Norte', 'Gaitán', 'Paso del Comercio', 'Barranquilla', 'Villa del Prado'],
  'Comuna 6': ['Floralia', 'Paso del Comercio', 'Alcázares', 'Metropolitano del Norte', 'Jorge Eliécer Gaitán', 'Petecuy I', 'Petecuy II', 'Petecuy III', 'San Luis I', 'San Luis II', 'Rivera Valle'],
  'Comuna 7': ['Alfonso López I', 'Alfonso López II', 'Alfonso López III', 'Puerto Mallarino', 'Los Pinos', 'Siete de Agosto', 'López de Mesa', 'El Troncal', 'San Marino', 'Las Ceibas', 'La Base', 'Fénix', 'San Luis'],
  'Comuna 8': ['Saavedra Galindo', 'Santa Mónica Belalcázar', 'Belalcázar', 'El Trébol', 'Siete de Agosto', 'El Troncal', 'Primitivo Crespo', 'Simón Bolívar', 'La Nueva Base', 'Las Juntas', 'Benjamín Herrera'],
  'Comuna 9': ['Guayaquil', 'Aranjuez', 'Manuel María Buenaventura', 'Santa Mónica', 'Belalcázar', 'Sucre', 'Obrero', 'Otero Muñoz', 'San Nicolás', 'Bretaña', 'Alameda', 'Junín', 'Colseguros', 'Champagnat'],
  'Comuna 10': ['San Judas Tadeo I', 'San Judas Tadeo II', 'Colseguros', 'Junín', 'Guabal', 'Panamericano', 'Pasoancho', 'Santa Elena', 'Santo Domingo', 'La Selva', 'El Dorado', 'Departamental', 'San Cristóbal'],
  'Comuna 11': ['Aguablanca', 'El Jardín', 'La Esperanza', 'San Carlos', 'San Benito', 'Prados de Oriente', 'José Holguín Garcés', '20 de Julio', 'Pradera', 'La Fortaleza', 'Independencia', 'León XIII', 'Mariano Ramos'],
  'Comuna 12': ['Sindical', 'El Rodeo', 'Eduardo Santos', 'Alfonso Barberena', 'La Nueva Floresta', 'Julio Rincón', 'Doce de Octubre', 'Asturias', 'Fenalco Kennedy', 'El Paraíso', 'Villanueva'],
  'Comuna 13': ['Ulpiano Lloreda', 'Charco Azul', 'Lleras Restrepo I', 'Lleras Restrepo II', 'Poblado I', 'Poblado II', 'Rodrigo Lara Bonilla', 'Ricardo Balcázar', 'Diamante', 'Compartir', 'Puerta del Sol', 'Omar Torrijos', 'Villablanca', 'Calipso'],
  'Comuna 14': ['Alirio Mora Beltrán', 'Manuela Beltrán', 'Las Orquídeas', 'Alfonso Bonilla Aragón', 'Maranatha', 'Promesa de Dios', 'José Manuel Marroquín I', 'José Manuel Marroquín II', 'Los Naranjos', 'Pizamos I', 'Pizamos II', 'Pizamos III'],
  'Comuna 15': ['El Vallado', 'El Retiro', 'Los Comuneros I', 'Laureano Gómez', 'Talleres', 'Poblado II', 'Mojica', 'Comuneros II'],
  'Comuna 16': ['Mariano Ramos', 'República de Israel', 'Unión de Vivienda Popular', 'Antonio Pineda', 'Libertador', 'Ciudad de Quito', 'La Alborada'],
  'Comuna 17': ['Caney', 'Ciudad 2000', 'Valle del Lili', 'Gran Limonar', 'El Ingenio', 'Ciudad Capri', 'Santa Anita', 'La Hacienda', 'Mayapan', 'Pasoancho', 'Cascajal', 'Ciudad Universitaria', 'Pradera de Comfandi', 'La Selva', 'Primero de Mayo'],
  'Comuna 18': ['Meléndez', 'Buenos Aires', 'Los Chorros', 'Lourdes', 'Prados del Sur', 'Cuarto de Legua', 'Guadalupe', 'Alto Jordán', 'Polvorines', 'Nueva Esperanza', 'Mario Correa Rengifo'],
  'Comuna 19': ['San Fernando Viejo', 'San Fernando Nuevo', 'Eucarístico', 'El Templete', 'Miraflores', 'Champagnat', 'Tequendama', 'Los Cámbulos', 'Nueva Tequendama', 'Cuarto de Legua', 'Guadalupe', 'Camino Real', 'Limonar', 'Cañaveralejo', 'Bellavista', 'Cristal', 'Refugio', 'Santa Isabel'],
  'Comuna 20': ['Siloé', 'Belisario Caicedo', 'Lleras Camargo', 'Brújula', 'Venezuela', 'San Francisco', 'El Cortijo', 'Tierra Blanca', 'La Sultana'],
  'Comuna 21': ['Desepaz', 'Calimío Desepaz', 'Pizamos I', 'Pizamos II', 'Pizamos III', 'Potrero Grande', 'Talanga', 'Villamercedes', 'Las Dalias', 'Paso del Comercio'],
  'Comuna 22': ['Ciudad Jardín', 'Pance', 'Alférez Real', 'Río Lili', 'Bochalema', 'Parque Natura'],
  'Corregimiento Navarro': ['Navarro'],
  'Corregimiento La Buitrera': ['La Buitrera'],
  'Corregimiento Villacarmelo': ['Villacarmelo'],
  'Corregimiento Los Andes': ['Los Andes'],
  'Corregimiento Pichindé': ['Pichindé'],
  'Corregimiento Leonera': ['Leonera'],
  'Corregimiento Felidia': ['Felidia'],
  'Corregimiento El Saladito': ['El Saladito'],
  'Corregimiento La Elvira': ['La Elvira'],
  'Corregimiento La Castilla': ['La Castilla'],
  'Corregimiento La Paz': ['La Paz'],
  'Corregimiento Golondrinas': ['Golondrinas'],
  'Corregimiento Montebello': ['Montebello'],
  'Corregimiento Pance': ['Pance'],
  'Corregimiento Hormiguero': ['Hormiguero']
};

export const YUMBO_NEIGHBORHOODS_BY_COMMUNE: Record<string, string[]> = {
  'Comuna 1': ['Belalcázar', 'Bolívar', 'Puerto Isaacs', 'Las Américas', 'Guacandá', 'José María Córdoba', 'El Pedregal', 'Nuevo Horizonte'],
  'Comuna 2': ['Fray Peña', 'Portales de Comfandi', 'Pizarro', 'La Estancia', 'Madre Vieja', 'San Fernando', 'Buenos Aires', 'La Ceiba'],
  'Comuna 3': ['Panorama', 'Uribe Uribe', 'Valles de Yumbo', 'Juan Pablo II', 'Guadalupe', 'Bellavista Baja'],
  'Comuna 4': ['Bellavista', 'La Alborada', 'San Jorge', 'Lleras Camargo', 'Hacienda Rosablanca', 'Villas de Comfandi'],
  'Corregimiento Dapa': ['Dapa Centro', 'Miravalle', 'Rincón Dapa', 'Medio Dapa', 'Alto Dapa'],
  'Corregimiento Mulaló': ['Mulaló Centro', 'Manga Vieja', 'El Placer'],
  'Corregimiento San Marcos': ['San Marcos Centro', 'Viña del Mar'],
  'Corregimiento Yumbillo': ['Yumbillo', 'La Olga'],
  'Corregimiento Montañitas': ['Montañitas Centro', 'Santa Inés'],
  'Corregimiento Santa Inés': ['Santa Inés'],
  'Corregimiento La Cumbrecita': ['La Cumbrecita'],
  'Corregimiento Platanares': ['Platanares']
};

export const JAMUNDI_NEIGHBORHOODS_BY_COMMUNE: Record<string, string[]> = {
  'Comuna 1 (Zona Centro / Occidental)': [
    'Centro', 'El Rosario', 'La Esmeralda', 'Libertadores', 'Portal de Jamundí', 
    'Sachamate', 'Pangola', 'El Rodeo', 'La Pradera', 'Rincón de Zaragoza', 
    'Bello Horizonte', 'La Ceibita', 'El Bosque', 'La Alborada'
  ],
  'Comuna 2 (Zona Expansión / Ciudadelas)': [
    'Terranova', 'El Piloto', 'Ciudad de Dios', 'Bonanza', 'Las Flores', 
    'Ciudad Sur', 'Portal del Jordán', 'Campestre', 'Solarte', 'El Paraíso', 
    'Vergel', 'Manuela Beltrán', 'Arboleda', 'Bochalema Jamundí', 'Riberas del Rosario'
  ],
  'Corregimiento Potrerito': ['Potrerito Centro', 'San Antonio', 'Miravalle', 'La Liberia', 'Rincón Santo'],
  'Corregimiento Villa Paz': ['Villa Paz', 'San Vicente'],
  'Corregimiento Robles': ['Robles Centro'],
  'Corregimiento Quinamayó': ['Quinamayó Centro'],
  'Corregimiento Timba': ['Timba Valle'],
  'Corregimiento San Antonio': ['San Antonio'],
  'Corregimiento Ampudia': ['Ampudia'],
  'Corregimiento Villacolombia': ['Villacolombia'],
  'Corregimiento Paso de la Bolsa': ['Paso de la Bolsa'],
  'Corregimiento Guachinte': ['Guachinte'],
  'Corregimiento Chagres': ['Chagres']
};

export const NEIGHBORHOODS_BY_CITY: Record<CityName, Record<string, string[]>> = {
  'Cali': NEIGHBORHOODS_BY_COMMUNE,
  'Jamundí': JAMUNDI_NEIGHBORHOODS_BY_COMMUNE,
  'Yumbo': YUMBO_NEIGHBORHOODS_BY_COMMUNE
};

export function getNeighborhoodsFor(city: string | undefined, commune: string): string[] {
  const cityName = (city && (city === 'Jamundí' || city === 'Yumbo' || city === 'Cali')) ? (city as CityName) : 'Cali';
  const dict = NEIGHBORHOODS_BY_CITY[cityName] || NEIGHBORHOODS_BY_COMMUNE;
  return dict[commune] || [];
}

export const CALI_NEIGHBORHOODS = Object.values(NEIGHBORHOODS_BY_COMMUNE).flat();

export const TALENTS_CATEGORIES = [
  {
    category: "🎤 Arte y Recreación",
    options: ["Canto", "Danza", "Recreación juvenil"]
  },
  {
    category: "🎥 Producción Audiovisual",
    options: ["Manejo de Sonido", "Video y camarografía", "Edición audiovisual"]
  },
  {
    category: "🗣️ Formación y Liderazgo",
    options: ["Charlas y capacitaciones"]
  },
  {
    category: "📦 Logística y Apoyo Operativo",
    options: ["Apoyo logístico y eventos"]
  },
  {
    category: "⚽ Deporte y Bienestar",
    options: ["Recreación deportiva"]
  },
  {
    category: "🛡️ Seguridad y Apoyo Social",
    options: ["Primeros auxilios", "Seguridad en eventos", "Trabajo comunitario"]
  }
];


