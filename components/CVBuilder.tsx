"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Save, Printer, Eye, UserRound, Palette, LayoutTemplate, Download, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { defaultResume, type ResumeData, type Entry } from "@/lib/default-resume";

type Section = "profile" | "experience" | "education" | "projects" | "skills" | "style";
const uid = () => Math.random().toString(36).slice(2, 10);
const blankEntry = (): Entry => ({ id: uid(), title: "", organization: "", location: "", start: "", end: "", description: "" });

// Crée un CV vide en conservant uniquement les réglages de présentation par défaut.
const createEmptyResume = (): ResumeData => ({
  fullName: "",
  headline: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  github: "",
  website: "",
  summary: "",
  photo: "",
  theme: defaultResume.theme,
  layout: defaultResume.layout,
  font: defaultResume.font,
  showPhoto: defaultResume.showPhoto,
  skills: [],
  languages: [],
  strengths: [],
  availability: "",
  experience: [],
  education: [],
  projects: [],
});

export default function CVBuilder() {
  const [resume, setResume] = useState<ResumeData>(defaultResume);
  const [resumeId, setResumeId] = useState("local-default");
  const [section, setSection] = useState<Section>("profile");
  const [saved, setSaved] = useState("Chargement…");
  const [showPreview, setShowPreview] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [cvLanguage, setCvLanguage] = useState<"fr" | "en">("fr");

  useEffect(() => {
    fetch("/api/cv").then(r => r.json()).then(r => {
      if (r?.data) {
        setResume({ ...defaultResume, ...r.data });
        if (r.data.cvLanguage === "en" || r.data.cvLanguage === "fr") setCvLanguage(r.data.cvLanguage);
      }
      if (r?.id) setResumeId(r.id);
      setSaved("Prêt à modifier");
    }).catch(() => setSaved("Mode local — configurez la base pour sauvegarder"));
  }, []);

  const update = <K extends keyof ResumeData>(key: K, value: ResumeData[K]) => setResume(prev => ({ ...prev, [key]: value }));
  const updateEntry = (kind: "experience" | "education" | "projects", id: string, key: keyof Entry, value: string) =>
    setResume(prev => ({ ...prev, [kind]: prev[kind].map(item => item.id === id ? { ...item, [key]: value } : item) }));
  const addEntry = (kind: "experience" | "education" | "projects") => {
    const entry = blankEntry();
    setResume(prev => ({ ...prev, [kind]: [...prev[kind], entry] }));
    setExpanded(entry.id);
  };
  const deleteEntry = (kind: "experience" | "education" | "projects", id: string) =>
    setResume(prev => ({ ...prev, [kind]: prev[kind].filter(item => item.id !== id) }));

  function resetResume() {
    const confirmed = window.confirm(
      "Voulez-vous vraiment vider tous les champs du CV ? Cette action ne peut pas être annulée. Pensez à enregistrer ou télécharger votre CV actuel avant de continuer."
    );
    if (!confirmed) return;

    setResume(createEmptyResume());
    setCvLanguage("fr");
    setSection("profile");
    setExpanded(null);
    setSaved("CV vierge — pensez à enregistrer");

    // Supprime uniquement le brouillon local ; la base sera mise à jour
    // lorsque l'utilisateur cliquera sur « Enregistrer ».
    try {
      localStorage.removeItem("cv-studio-draft");
    } catch {
      // Le stockage local peut être indisponible dans certains navigateurs.
    }
  }

  async function save() {
    setSaved("Enregistrement…");
    try {
      const response = await fetch("/api/cv", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: resumeId, title: resume.fullName || (cvLanguage === "fr" ? "Mon CV" : "My CV"), data: { ...resume, cvLanguage } }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Erreur");
      setResumeId(result.id); setSaved("Enregistré ✓");
    } catch (e) {
      localStorage.setItem("cv-studio-draft", JSON.stringify({ ...resume, cvLanguage }));
      setSaved("Brouillon conservé dans ce navigateur");
    }
  }

  async function downloadPDF() {
    const element = document.querySelector(".resume-paper") as HTMLElement | null;
    if (!element) {
      window.alert("Impossible de trouver l’aperçu du CV.");
      return;
    }

    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const safeName = (resume.fullName || "Mon-CV").replace(/[^a-zA-Z0-9À-ÿ_-]/g, "-");
      await html2pdf()
        .set({
          filename: `CV-${safeName}.pdf`,
          margin: 0,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(element)
        .save();
    } catch (error) {
      console.error("PDF export failed:", error);
      window.alert("Le téléchargement du PDF a échoué. Essaie avec le bouton Imprimer.");
    }
  }

  async function uploadPhoto(file?: File) {
    if (!file) return;
    const form = new FormData(); form.append("file", file);
    try {
      const response = await fetch("/api/upload", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      update("photo", result.url);
    } catch {
      const reader = new FileReader(); reader.onload = () => update("photo", String(reader.result)); reader.readAsDataURL(file);
    }
  }

  const nav: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Identité & profil", icon: <UserRound size={17}/> },
    { id: "experience", label: "Expériences", icon: <BriefcaseIcon/> },
    { id: "education", label: "Diplômes & formation", icon: <GraduationIcon/> },
    { id: "projects", label: "Projets", icon: <LayoutTemplate size={17}/> },
    { id: "skills", label: "Compétences & langues", icon: <SparkIcon/> },
    { id: "style", label: "Design & disposition", icon: <Palette size={17}/> }
  ];

  return <main className="app-shell">
    <header className="topbar">
      <a className="brand" href="#"><span className="brand-mark">CV</span><span>CV Studio<small>CRÉATEUR DE CV PROFESSIONNEL</small></span></a>
      <div className="top-actions"><span className="save-status">{saved}</span><button className="btn btn-quiet" onClick={resetResume} title="Vider tous les champs et commencer un nouveau CV"><RotateCcw size={16}/> Réinitialiser</button><button className="btn btn-primary" onClick={save}><Save size={16}/> Enregistrer</button><button className="btn btn-dark" onClick={downloadPDF}><Download size={16}/> Télécharger le PDF</button><button className="btn btn-outline" onClick={() => window.print()}><Printer size={16}/> Imprimer</button></div>
    </header>
    <div className="workspace">
      <aside className="editor">
        <div className="editor-heading"><div><p className="eyebrow">ESPACE DE CRÉATION</p><h1>Votre CV, à votre image.</h1><p className="muted">Modifiez chaque détail et suivez le résultat en direct.</p></div></div>
        <nav className="section-nav">{nav.map(item => <button key={item.id} className={section === item.id ? "nav-item active" : "nav-item"} onClick={() => setSection(item.id)}>{item.icon}<span>{item.label}</span>{section === item.id && <span className="nav-dot"/>}</button>)}</nav>
        <div className="form-area">
          {section === "profile" && <section className="form-section">
            <SectionTitle number="01" title="Informations personnelles" description="Les informations qui apparaissent en haut du CV."/>
            <div className="photo-row"><div className="avatar-preview">{resume.photo ? <img src={resume.photo} alt="Portrait du CV"/> : <UserRound size={26}/>}</div><div className="photo-actions"><strong>Photo de profil</strong><p>Portrait carré recommandé · 3 Mo max.</p><label className="btn btn-outline upload-label">Choisir une photo<input type="file" accept="image/*" onChange={e => uploadPhoto(e.target.files?.[0])}/></label>{resume.photo && <button className="text-button" onClick={() => update("photo", "")}>Retirer la photo</button>}</div></div>
            <Field label="Nom complet"><input value={resume.fullName} onChange={e => update("fullName", e.target.value)}/></Field>
            <Field label="Titre professionnel"><input value={resume.headline} onChange={e => update("headline", e.target.value)}/></Field>
            <div className="field-grid"><Field label="E-mail"><input type="email" value={resume.email} onChange={e => update("email", e.target.value)}/></Field><Field label="Téléphone"><input value={resume.phone} onChange={e => update("phone", e.target.value)}/></Field></div>
            <Field label="Ville / pays"><input value={resume.location} onChange={e => update("location", e.target.value)}/></Field>
            <div className="field-grid"><Field label="LinkedIn"><input value={resume.linkedin} onChange={e => update("linkedin", e.target.value)} placeholder="linkedin.com/in/…"/></Field><Field label="GitHub / portfolio"><input value={resume.github} onChange={e => update("github", e.target.value)}/></Field></div>
            <Field label="Profil professionnel"><textarea rows={5} value={resume.summary} onChange={e => update("summary", e.target.value)}/><Hint>Astuce : visez 3 à 5 lignes pour tenir sur une page A4.</Hint></Field>
            <Field label="Disponibilité"><input value={resume.availability} onChange={e => update("availability", e.target.value)}/></Field>
          </section>}
          {section === "experience" && <EntriesSection title="Expériences professionnelles" description="Ajoutez vos postes, dates, employeurs et missions." items={resume.experience} kind="experience" updateEntry={updateEntry} addEntry={addEntry} deleteEntry={deleteEntry} expanded={expanded} setExpanded={setExpanded}/>}
          {section === "education" && <EntriesSection title="Diplômes & formations" description="Formations, diplômes, certifications et années." items={resume.education} kind="education" updateEntry={updateEntry} addEntry={addEntry} deleteEntry={deleteEntry} expanded={expanded} setExpanded={setExpanded}/>}
          {section === "projects" && <EntriesSection title="Projets & réalisations" description="Mettez en valeur vos réalisations concrètes." items={resume.projects} kind="projects" updateEntry={updateEntry} addEntry={addEntry} deleteEntry={deleteEntry} expanded={expanded} setExpanded={setExpanded}/>}
          {section === "skills" && <section className="form-section"><SectionTitle number="05" title="Compétences & langues" description="Une compétence ou une langue par ligne."/><Field label="Compétences techniques et transversales"><textarea rows={10} value={resume.skills.join("\n")} onChange={e => update("skills", e.target.value.split("\n").map(s => s.trim()).filter(Boolean))}/><Hint>Chaque ligne devient un élément de la liste.</Hint></Field><div className="subheading"><h3>Langues</h3><button className="btn btn-outline btn-small" onClick={() => update("languages", [...resume.languages, { id: uid(), name: "", level: "" }])}><Plus size={14}/> Ajouter</button></div>{resume.languages.map(lang => <div className="language-row" key={lang.id}><input aria-label="Langue" value={lang.name} placeholder="Langue" onChange={e => update("languages", resume.languages.map(l => l.id === lang.id ? {...l, name: e.target.value} : l))}/><input aria-label="Niveau" value={lang.level} placeholder="Niveau" onChange={e => update("languages", resume.languages.map(l => l.id === lang.id ? {...l, level: e.target.value} : l))}/><button className="icon-button danger" onClick={() => update("languages", resume.languages.filter(l => l.id !== lang.id))}><Trash2 size={15}/></button></div>)}<Field label="Qualités professionnelles"><textarea rows={4} value={resume.strengths.join("\n")} onChange={e => update("strengths", e.target.value.split("\n").map(s => s.trim()).filter(Boolean))}/></Field></section>}
          {section === "style" && <section className="form-section"><SectionTitle number="06" title="Style du document" description="Personnalisez les couleurs, la police et la disposition."/><Field label="Langue du CV"><select value={cvLanguage} onChange={e => setCvLanguage(e.target.value as "fr" | "en")}><option value="fr">Français</option><option value="en">English</option></select><Hint>Cette option traduit les titres et libellés du document. Le contenu que tu saisis dans les champs n’est pas traduit automatiquement.</Hint></Field><Field label="Couleur principale"><div className="color-row"><input className="color-input" type="color" value={resume.theme} onChange={e => update("theme", e.target.value)}/><input value={resume.theme} onChange={e => update("theme", e.target.value)} aria-label="Code couleur"/></div><div className="swatches">{["#245c73","#164e63","#2563eb","#6d28d9","#0f766e","#b45309","#374151","#9f1239"].map(color => <button key={color} aria-label={`Choisir ${color}`} className={`swatch ${resume.theme === color ? "chosen" : ""}`} style={{background:color}} onClick={() => update("theme", color)}/>)}</div></Field><Field label="Disposition du CV"><div className="layout-options"><button className={resume.layout === "sidebar" ? "layout-option chosen" : "layout-option"} onClick={() => update("layout","sidebar")}><LayoutTemplate/><strong>Colonne latérale</strong><small>Style moderne, compact</small></button><button className={resume.layout === "classic" ? "layout-option chosen" : "layout-option"} onClick={() => update("layout","classic")}><LayoutTemplate/><strong>Classique</strong><small>Une colonne, sobre</small></button></div></Field><Field label="Police d'écriture"><select value={resume.font} onChange={e => update("font", e.target.value)}><option>Arial</option><option>Inter</option><option>Georgia</option><option>Verdana</option><option>Trebuchet MS</option></select></Field><label className="toggle-row"><span><strong>Afficher la photo</strong><small>Inclure le portrait dans l'en-tête du CV</small></span><input type="checkbox" checked={resume.showPhoto} onChange={e => update("showPhoto", e.target.checked)}/></label><div className="print-note"><Printer size={18}/><div><strong>Format A4, une page</strong><p>Le modèle est optimisé pour une feuille A4. Si le contenu devient trop long, réduisez le texte ou retirez des éléments avant impression.</p></div></div></section>}
        </div>
        <footer className="editor-footer"><span>CV Studio <span className="muted">· Format A4</span></span><button className="btn btn-primary" onClick={() => window.print()}><Printer size={16}/> Exporter / imprimer</button></footer>
      </aside>
      <section className={`preview-panel ${showPreview ? "" : "preview-hidden"}`}>
        <div className="preview-toolbar"><div><span className="live-dot"/> <strong>Aperçu en direct</strong><span className="muted">· A4 portrait</span></div><div className="preview-tools"><button className="icon-button" onClick={() => setShowPreview(!showPreview)} title="Afficher / masquer"><Eye size={17}/></button><button className="btn btn-outline btn-small" onClick={downloadPDF}><Download size={15}/> Télécharger PDF</button></div></div>
        {showPreview ? <div className="paper-stage"><ResumePreview resume={resume} language={cvLanguage}/></div> : <button className="show-preview" onClick={() => setShowPreview(true)}><Eye size={17}/> Afficher l’aperçu</button>}
      </section>
    </div>
  </main>;
}

function BriefcaseIcon(){ return <span className="nav-emoji">▣</span>; }
function GraduationIcon(){ return <span className="nav-emoji">⌑</span>; }
function SparkIcon(){ return <span className="nav-emoji">✳</span>; }
function SectionTitle({number,title,description}:{number:string,title:string,description:string}){return <div className="section-title"><span>{number}</span><div><h2>{title}</h2><p>{description}</p></div></div>}
function Field({label,children}:{label:string,children:React.ReactNode}){return <label className="field"><span>{label}</span>{children}</label>}
function Hint({children}:{children:React.ReactNode}){return <small className="hint">{children}</small>}

function EntriesSection({title,description,items,kind,updateEntry,addEntry,deleteEntry,expanded,setExpanded}:{title:string;description:string;items:Entry[];kind:"experience"|"education"|"projects";updateEntry:(kind:"experience"|"education"|"projects",id:string,key:keyof Entry,value:string)=>void;addEntry:(kind:"experience"|"education"|"projects")=>void;deleteEntry:(kind:"experience"|"education"|"projects",id:string)=>void;expanded:string|null;setExpanded:(id:string|null)=>void}) {
  return <section className="form-section"><SectionTitle number={kind==="experience"?"02":kind==="education"?"03":"04"} title={title} description={description}/>{items.map((item,index)=><article className="entry-card" key={item.id}><button className="entry-head" onClick={() => setExpanded(expanded===item.id?null:item.id)}><span className="entry-index">{String(index+1).padStart(2,"0")}</span><span className="entry-summary"><strong>{item.title || "Nouvel élément"}</strong><small>{item.organization || "Organisation"}{item.start||item.end ? ` · ${item.start} – ${item.end}` : ""}</small></span>{expanded===item.id?<ChevronUp size={17}/>:<ChevronDown size={17}/>}</button>{expanded===item.id && <div className="entry-fields"><Field label="Intitulé"><input value={item.title} onChange={e=>updateEntry(kind,item.id,"title",e.target.value)}/></Field><Field label="Entreprise / établissement"><input value={item.organization} onChange={e=>updateEntry(kind,item.id,"organization",e.target.value)}/></Field><Field label="Lieu"><input value={item.location||""} onChange={e=>updateEntry(kind,item.id,"location",e.target.value)}/></Field><div className="field-grid"><Field label="Date de début"><input value={item.start||""} onChange={e=>updateEntry(kind,item.id,"start",e.target.value)} placeholder="2022"/></Field><Field label="Date de fin"><input value={item.end||""} onChange={e=>updateEntry(kind,item.id,"end",e.target.value)} placeholder="Présent"/></Field></div><Field label="Description / missions"><textarea rows={5} value={item.description} onChange={e=>updateEntry(kind,item.id,"description",e.target.value)}/></Field><button className="text-button danger-text" onClick={()=>deleteEntry(kind,item.id)}><Trash2 size={14}/> Supprimer cet élément</button></div>}</article>)}<button className="add-entry" onClick={()=>addEntry(kind)}><Plus size={17}/> Ajouter {kind==="experience"?"une expérience":kind==="education"?"un diplôme ou une formation":"un projet"}</button></section>
}

type CVLanguage = "fr" | "en";

const cvLabels = {
  fr: {
    contact: "CONTACT", location: "Localisation", phone: "Téléphone", email: "E-mail", linkedin: "LinkedIn", github: "GitHub",
    skills: "COMPÉTENCES", languages: "LANGUES", strengths: "ATOUTS", availability: "DISPONIBILITÉ", profile: "PROFIL PROFESSIONNEL",
    projects: "PROJETS & RÉALISATIONS", itProjects: "PROJETS IT & NUMÉRIQUES", experience: "EXPÉRIENCE PROFESSIONNELLE",
    education: "FORMATION & DIPLÔMES", languagesStrengths: "LANGUES & ATOUTS", yourName: "", photo: "Photo", strengthsOnly: "ATOUTS",
  },
  en: {
    contact: "CONTACT", location: "Location", phone: "Phone", email: "Email", linkedin: "LinkedIn", github: "GitHub",
    skills: "SKILLS", languages: "LANGUAGES", strengths: "STRENGTHS", availability: "AVAILABILITY", profile: "PROFESSIONAL PROFILE",
    projects: "PROJECTS & ACHIEVEMENTS", itProjects: "IT & DIGITAL PROJECTS", experience: "PROFESSIONAL EXPERIENCE",
    education: "EDUCATION & QUALIFICATIONS", languagesStrengths: "LANGUAGES", yourName: "", photo: "Photo", strengthsOnly: "STRENGTHS",
  },
} as const;

function ResumePreview({resume, language}: {resume: ResumeData; language: CVLanguage}) {
  const sidebar = resume.layout === "sidebar";
  const t = cvLabels[language];
  const experiences = resume.experience.filter(hasEntryContent);
  const education = resume.education.filter(hasEntryContent);
  const projects = resume.projects.filter(hasEntryContent);
  const skills = resume.skills.map(s => s.trim()).filter(Boolean);
  const languages = resume.languages.filter(l => l.name.trim() || l.level.trim());
  const strengths = resume.strengths.map(s => s.trim()).filter(Boolean);
  const contacts = [resume.email, resume.phone, resume.location, resume.linkedin, resume.github].filter(v => v?.trim());
  const hasIdentity = Boolean(resume.fullName.trim() || resume.headline.trim() || (resume.showPhoto && resume.photo));
  const hasProfile = Boolean(resume.summary.trim());
  const hasContact = Boolean(resume.location.trim() || resume.phone.trim() || resume.email.trim() || resume.linkedin.trim() || resume.github.trim());
  const hasSidebarContent = hasContact || skills.length > 0 || languages.length > 0 || strengths.length > 0 || Boolean(resume.availability.trim());
  const useSidebarLayout = sidebar && hasSidebarContent;
  const hasFooter = Boolean(resume.fullName.trim() || resume.location.trim() || resume.headline.trim());

  return <article className={`resume-paper ${useSidebarLayout ? "resume-sidebar" : "resume-classic"}`} style={{"--accent": resume.theme, fontFamily: resume.font} as React.CSSProperties}>
    {hasIdentity && <header className="resume-header">
      {resume.showPhoto && resume.photo && <img className="resume-photo" src={resume.photo} alt={t.photo}/>}
      {(resume.fullName.trim() || resume.headline.trim()) && <div className="resume-name">{resume.fullName.trim() && <h1>{resume.fullName}</h1>}{resume.headline.trim() && <p>{resume.headline}</p>}</div>}
      {!useSidebarLayout && contacts.length > 0 && <div className="resume-contact">{contacts.join("  •  ")}</div>}
    </header>}
    {useSidebarLayout ? <div className="resume-columns">
      <aside className="resume-side">
        {hasContact && <ResumeSection title={t.contact}><ContactLine label={t.location} value={resume.location}/><ContactLine label={t.phone} value={resume.phone}/><ContactLine label={t.email} value={resume.email}/><ContactLine label={t.linkedin} value={resume.linkedin}/><ContactLine label={t.github} value={resume.github}/></ResumeSection>}
        {skills.length > 0 && <ResumeSection title={t.skills}><ul className="resume-bullets">{skills.map((skill, i) => <li key={`${skill}-${i}`}>{skill}</li>)}</ul></ResumeSection>}
        {languages.length > 0 && <ResumeSection title={t.languages}><ul className="resume-languages">{languages.map((lang, i) => <li key={lang.id || `${lang.name}-${i}`}>{lang.name.trim() && <strong>{lang.name}</strong>}{lang.level.trim() && <span>{lang.level}</span>}</li>)}</ul></ResumeSection>}
        {strengths.length > 0 && <ResumeSection title={t.strengths}><ul className="resume-bullets">{strengths.map((strength, i) => <li key={`${strength}-${i}`}>{strength}</li>)}</ul></ResumeSection>}
        {resume.availability.trim() && <ResumeSection title={t.availability}><p>{resume.availability}</p></ResumeSection>}
      </aside>
      <div className="resume-main">
        {hasProfile && <ResumeSection title={t.profile}><p>{resume.summary}</p></ResumeSection>}
        {projects.length > 0 && <ResumeEntries title={t.itProjects} entries={projects}/> }
        {experiences.length > 0 && <ResumeEntries title={t.experience} entries={experiences}/>}
        {education.length > 0 && <ResumeEntries title={t.education} entries={education}/>}
      </div>
    </div> : <div className="resume-classic-body">
      {hasProfile && <ResumeSection title={t.profile}><p>{resume.summary}</p></ResumeSection>}
      {experiences.length > 0 && <ResumeEntries title={t.experience} entries={experiences}/>}
      {projects.length > 0 && <ResumeEntries title={t.projects} entries={projects}/>}
      {education.length > 0 && <ResumeEntries title={t.education} entries={education}/>}
      {(skills.length > 0 || languages.length > 0 || strengths.length > 0) && <div className="classic-bottom">
        {skills.length > 0 && <ResumeSection title={t.skills}><p>{skills.join(" · ")}</p></ResumeSection>}
        {languages.length > 0 && <ResumeSection title={t.languages}><p>{languages.map(l => [l.name.trim(), l.level.trim() ? `(${l.level})` : ""].filter(Boolean).join(" ")).filter(Boolean).join(" · ")}</p></ResumeSection>}
        {strengths.length > 0 && <ResumeSection title={t.strengthsOnly}><p>{strengths.join(" · ")}</p></ResumeSection>}
      </div>}
      {resume.availability.trim() && <ResumeSection title={t.availability}><p>{resume.availability}</p></ResumeSection>}
    </div>}
    {hasFooter && <footer className="resume-footer">{[resume.fullName, resume.location, resume.headline].map(v => v.trim()).filter(Boolean).map((v, i) => <span key={`${v}-${i}`}>{i > 0 && <> <span>•</span> </>}{v}</span>)}</footer>}
  </article>;
}

function hasEntryContent(entry: Entry) {
  return Boolean(entry.title?.trim() || entry.organization?.trim() || entry.location?.trim() || entry.start?.trim() || entry.end?.trim() || entry.description?.trim());
}

function ContactLine({label, value}: {label: string; value: string}) {
  return value?.trim() ? <div className="contact-line"><small>{label}</small><span>{value}</span></div> : null;
}
function ResumeSection({title, children}: {title: string; children: React.ReactNode}) {
  return <section className="resume-section"><h2>{title}</h2>{children}</section>;
}
function ResumeEntries({title, entries}: {title: string; entries: Entry[]}) {
  const filledEntries = entries.filter(hasEntryContent);
  if (filledEntries.length === 0) return null;
  return <ResumeSection title={title}><div className="resume-entries">{filledEntries.map(e => <article className="resume-entry" key={e.id}>
    {(e.title?.trim() || e.start?.trim() || e.end?.trim()) && <div className="entry-top">{e.title?.trim() && <strong>{e.title}</strong>}<span>{[e.start, e.end].filter(v => v?.trim()).join(" – ")}</span></div>}
    {[e.organization, e.location].some(v => v?.trim()) && <div className="entry-org">{[e.organization, e.location].filter(v => v?.trim()).join(" • ")}</div>}
    {e.description?.trim() && <p>{e.description}</p>}
  </article>)}</div></ResumeSection>;
}
