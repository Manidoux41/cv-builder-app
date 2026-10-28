export type Entry = { id: string; title: string; organization: string; location?: string; start?: string; end?: string; description: string };
export type ResumeData = {
  fullName: string; headline: string; email: string; phone: string; location: string;
  linkedin: string; github: string; website: string; summary: string; photo: string;
  theme: string; layout: string; font: string; showPhoto: boolean;
  skills: string[]; languages: { id: string; name: string; level: string }[];
  strengths: string[]; availability: string;
  experience: Entry[]; education: Entry[]; projects: Entry[];
};

export const defaultResume: ResumeData = {
  fullName: "Manfred Parbatia",
  headline: "Support IT • Administrateur systèmes junior • Solutions web & digitales",
  email: "manfredparbatia@gmail.com", phone: "+855 76 252 3154", location: "Siem Reap, Cambodge",
  linkedin: "", github: "github.com/Manidoux41", website: "", photo: "", theme: "#245c73",
  layout: "sidebar", font: "Arial", showPhoto: true,
  summary: "Professionnel technique bilingue Français-Anglais combinant des compétences en développement web/mobile, exploitation technique, diagnostic de pannes et service client. Expérience en création d'applications (APIs, bases de données, déploiement) et plusieurs années en environnement aéronautique exigeant (Safran Aerosystems : normes PART 145, documentation CMM, reporting technique en anglais). Recherche un poste en Support IT, Administration Systèmes Junior, Support Technique, Développement Web ou Solutions Numériques.",
  skills: [
    "Dépannage & diagnostic de pannes", "Support matériel et logiciel (N1/N2)", "Documentation technique (CMM / anglais)",
    "Analyse d’incidents & maintenance N1", "Windows Server & Active Directory (notions)", "Microsoft 365 & bases réseaux",
    "Docker, virtualisation (notions)", "HTML5 / CSS3 / JavaScript", "React / Next.js / Node.js", "PHP / React Native / Flutter",
    "APIs REST", "PostgreSQL / MongoDB", "Git / GitHub", "Support utilisateurs & service client"
  ],
  languages: [
    { id: "lang-fr", name: "Français", level: "Langue maternelle" },
    { id: "lang-en", name: "Anglais", level: "Courant / professionnel" },
    { id: "lang-de", name: "Allemand", level: "Intermédiaire" },
    { id: "lang-kh", name: "Khmer", level: "Débutant" }
  ],
  strengths: ["Résolution de problèmes techniques", "Autonomie & apprentissage rapide", "Méthodique et souci du détail", "Sens du service client & calme"],
  availability: "Temps plein • Présentiel / hybride • Visa et permis de travail à jour",
  experience: [
    { id: "exp-safran", title: "Opérateur technique MRO & reporting", organization: "Safran Aerosystems Hydraulics", location: "Châteaudun, France", start: "2018", end: "2022", description: "Tests et réparation d’équipements hydrauliques aéronautiques ; maintenance N1 et diagnostic de pannes. Utilisation de la documentation technique et des manuels de maintenance (CMM). Rédaction de rapports d’inspection, réparation et diagnostic en anglais. Travail sur bancs d’essais automatisés dans le respect des normes PART 145, des délais et de la traçabilité." },
    { id: "exp-transport", title: "Professionnel du transport de voyageurs", organization: "Cars Simplon / TASM / Promotrans", location: "France", start: "2022", end: "2026", description: "Réalisation autonome de prestations de transport, gestion des aléas et incidents opérationnels sous pression. Sens élevé du service client, communication claire et respect strict des règles de sécurité." },
    { id: "exp-industry", title: "Production industrielle & conseil commercial", organization: "Hutchinson / Inergy / GAN Assurances", location: "France", start: "2005", end: "2018", description: "Conduite d’installations automatisées, contrôles par endoscopie, contrôles qualité et maintenance N1. Gestion de portefeuille clients, analyse des besoins et tenue rigoureuse des dossiers techniques et commerciaux." }
  ],
  education: [
    { id: "edu-web", title: "Formation professionnelle Développeur Web", organization: "OpenClassrooms", location: "Full-stack", start: "", end: "Validé", description: "HTML, CSS, JavaScript, React, Node.js, PHP et bases de données." },
    { id: "edu-bac", title: "Baccalauréat général – série littéraire", organization: "France", location: "", start: "", end: "1999", description: "" },
    { id: "edu-other", title: "Autres diplômes & certifications", organization: "AFPA / Formation continue", location: "France", start: "", end: "2001–2007", description: "DEUG Droit (2001) • AFPA Agent commercial (2006) • Niveau BTS Assurance (2007)." }
  ],
  projects: [
    { id: "proj-mmc", title: "MMC Go Drivers & solutions digitales transport", organization: "Projets logiciels indépendants", location: "Cambodge / France", start: "", end: "En cours", description: "Conception d’applications de gestion de flotte et d’outils chauffeurs. Architecture applicative, APIs REST, authentification, bases PostgreSQL/MongoDB, apps mobiles React Native/Flutter et portails web Next.js/Node.js. GitHub : github.com/Manidoux41/mmc-go-drivers." },
    { id: "proj-planning", title: "Application de gestion de planning", organization: "Application web sur mesure", location: "Déployée sur Vercel", start: "", end: "En ligne", description: "Application responsive de gestion de planning, suivi du temps et des tâches. URL : gestion-planning-delta.vercel.app." },
    { id: "proj-web", title: "Projets de développement web full-stack", organization: "OpenClassrooms & projets personnels", location: "", start: "2022", end: "Présent", description: "Applications web réactives (HTML5, CSS3, JavaScript, React, Node.js, PHP) orientées vers la résolution de besoins opérationnels." }
  ]
};
