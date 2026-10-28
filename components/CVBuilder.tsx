"use client";

import { useEffect, useMemo, useState } from "react";
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

  useEffect(() => {
    fetch("/api/cv").then(r => r.json()).then(r => {
      if (r?.data) setResume({ ...defaultResume, ...r.data });
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
      const response = await fetch("/api/cv", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: resumeId, title: resume.fullName || "Mon CV", data: resume }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Erreur");
      setResumeId(result.id); setSaved("Enregistré ✓");
    } catch (e) {
      localStorage.setItem("cv-studio-draft", JSON.stringify(resume));
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
          {section === "style" && <section className="form-section"><SectionTitle number="06" title="Style du document" description="Personnalisez les couleurs, la police et la disposition."/><Field label="Couleur principale"><div className="color-row"><input className="color-input" type="color" value={resume.theme} onChange={e => update("theme", e.target.value)}/><input value={resume.theme} onChange={e => update("theme", e.target.value)} aria-label="Code couleur"/></div><div className="swatches">{["#245c73","#164e63","#2563eb","#6d28d9","#0f766e","#b45309","#374151","#9f1239"].map(color => <button key={color} aria-label={`Choisir ${color}`} className={`swatch ${resume.theme === color ? "chosen" : ""}`} style={{background:color}} onClick={() => update("theme", color)}/>)}</div></Field><Field label="Disposition du CV"><div className="layout-options"><button className={resume.layout === "sidebar" ? "layout-option chosen" : "layout-option"} onClick={() => update("layout","sidebar")}><LayoutTemplate/><strong>Colonne latérale</strong><small>Style moderne, compact</small></button><button className={resume.layout === "classic" ? "layout-option chosen" : "layout-option"} onClick={() => update("layout","classic")}><LayoutTemplate/><strong>Classique</strong><small>Une colonne, sobre</small></button></div></Field><Field label="Police d'écriture"><select value={resume.font} onChange={e => update("font", e.target.value)}><option>Arial</option><option>Inter</option><option>Georgia</option><option>Verdana</option><option>Trebuchet MS</option></select></Field><label className="toggle-row"><span><strong>Afficher la photo</strong><small>Inclure le portrait dans l'en-tête du CV</small></span><input type="checkbox" checked={resume.showPhoto} onChange={e => update("showPhoto", e.target.checked)}/></label><div className="print-note"><Printer size={18}/><div><strong>Format A4, une page</strong><p>Le modèle est optimisé pour une feuille A4. Si le contenu devient trop long, réduisez le texte ou retirez des éléments avant impression.</p></div></div></section>}
        </div>
        <footer className="editor-footer"><span>CV Studio <span className="muted">· Format A4</span></span><button className="btn btn-primary" onClick={() => window.print()}><Printer size={16}/> Exporter / imprimer</button></footer>
      </aside>
      <section className={`preview-panel ${showPreview ? "" : "preview-hidden"}`}>
        <div className="preview-toolbar"><div><span className="live-dot"/> <strong>Aperçu en direct</strong><span className="muted">· A4 portrait</span></div><div className="preview-tools"><button className="icon-button" onClick={() => setShowPreview(!showPreview)} title="Afficher / masquer"><Eye size={17}/></button><button className="btn btn-outline btn-small" onClick={downloadPDF}><Download size={15}/> Télécharger PDF</button></div></div>
        {showPreview ? <div className="paper-stage"><ResumePreview resume={resume}/></div> : <button className="show-preview" onClick={() => setShowPreview(true)}><Eye size={17}/> Afficher l’aperçu</button>}
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

function ResumePreview({resume}:{resume:ResumeData}) {
  const sidebar = resume.layout === "sidebar";
  return <article className={`resume-paper ${sidebar?"resume-sidebar":"resume-classic"}`} style={{"--accent":resume.theme,"fontFamily":resume.font} as React.CSSProperties}>
    <header className="resume-header">
      {resume.showPhoto && resume.photo && <img className="resume-photo" src={resume.photo} alt="Photo"/>}
      <div className="resume-name"><h1>{resume.fullName || "Votre nom"}</h1><p>{resume.headline}</p></div>
      {!sidebar && <div className="resume-contact">{[resume.email,resume.phone,resume.location,resume.linkedin,resume.github].filter(Boolean).join("  •  ")}</div>}
    </header>
    {sidebar ? <div className="resume-columns"><aside className="resume-side">
      <ResumeSection title="CONTACT"><ContactLine label="Localisation" value={resume.location}/><ContactLine label="Téléphone" value={resume.phone}/><ContactLine label="E-mail" value={resume.email}/><ContactLine label="LinkedIn" value={resume.linkedin}/><ContactLine label="GitHub" value={resume.github}/></ResumeSection>
      <ResumeSection title="COMPÉTENCES"><ul className="resume-bullets">{resume.skills.map((s,i)=><li key={`${s}-${i}`}>{s}</li>)}</ul></ResumeSection>
      <ResumeSection title="LANGUES"><ul className="resume-languages">{resume.languages.filter(l=>l.name).map(l=><li key={l.id}><strong>{l.name}</strong><span>{l.level}</span></li>)}</ul></ResumeSection>
      <ResumeSection title="ATOUTS"><ul className="resume-bullets">{resume.strengths.map((s,i)=><li key={`${s}-${i}`}>{s}</li>)}</ul></ResumeSection>
      {resume.availability && <ResumeSection title="DISPONIBILITÉ"><p>{resume.availability}</p></ResumeSection>}
    </aside><div className="resume-main"><ResumeSection title="PROFIL PROFESSIONNEL"><p>{resume.summary}</p></ResumeSection><ResumeEntries title="PROJETS IT & NUMÉRIQUES" entries={resume.projects}/><ResumeEntries title="EXPÉRIENCE PROFESSIONNELLE" entries={resume.experience}/><ResumeEntries title="FORMATION & DIPLÔMES" entries={resume.education}/></div></div>
    : <div className="resume-classic-body"><ResumeSection title="PROFIL PROFESSIONNEL"><p>{resume.summary}</p></ResumeSection><ResumeEntries title="EXPÉRIENCE PROFESSIONNELLE" entries={resume.experience}/><ResumeEntries title="PROJETS & RÉALISATIONS" entries={resume.projects}/><ResumeEntries title="FORMATION & DIPLÔMES" entries={resume.education}/><div className="classic-bottom"><ResumeSection title="COMPÉTENCES"><p>{resume.skills.join(" · ")}</p></ResumeSection><ResumeSection title="LANGUES & ATOUTS"><p>{resume.languages.map(l=>`${l.name} (${l.level})`).join(" · ")}. {resume.strengths.join(" · ")}</p></ResumeSection></div></div>}
    <footer className="resume-footer">{resume.fullName} <span>•</span> {resume.location} <span>•</span> {resume.headline}</footer>
  </article>;
}
function ContactLine({label,value}:{label:string,value:string}){return value?<div className="contact-line"><small>{label}</small><span>{value}</span></div>:null}
function ResumeSection({title,children}:{title:string,children:React.ReactNode}){return <section className="resume-section"><h2>{title}</h2>{children}</section>}
function ResumeEntries({title,entries}:{title:string,entries:Entry[]}){return <ResumeSection title={title}><div className="resume-entries">{entries.filter(e=>e.title||e.organization).map(e=><article className="resume-entry" key={e.id}><div className="entry-top"><strong>{e.title}</strong><span>{[e.start,e.end].filter(Boolean).join(" – ")}</span></div><div className="entry-org">{[e.organization,e.location].filter(Boolean).join(" • ")}</div>{e.description && <p>{e.description}</p>}</article>)}</div></ResumeSection>}
