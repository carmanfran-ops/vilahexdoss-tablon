const STORAGE_KEY = "tablon_obras_v1";
const AGENDA_STORAGE_KEY = "tablon_agenda_v1";
const PERSONAL_STORAGE_KEY = "tablon_personal_v1";
const ASIGNACIONES_STORAGE_KEY = "tablon_asignaciones_v1";
const MAQUINARIA_STORAGE_KEY = "tablon_maquinaria_v1";
let maquinaria = JSON.parse(localStorage.getItem(MAQUINARIA_STORAGE_KEY) || "[]");
if(!Array.isArray(maquinaria)) maquinaria=[];
let agendaRegistros = JSON.parse(localStorage.getItem(AGENDA_STORAGE_KEY) || "[]");

function crearId(){
  return "obra-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2,8);
}

let obras = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || [
  {
    id: crearId(),
    nombre: "Centro Logístico Norte",
    cliente: "Cliente A",
    responsable: "Juan Martínez",
    urgencia: "Alta",
    hito: "Prueba hidráulica",
    fechaHito: "2026-09-20",
    requerimiento: "Llevar 4 detectores antes del jueves",
    material: "4 BIE + 2 válvulas",
    mediosElevacion: "Plataforma tijera",
    faltaMaterial: true,
    incidencias: 1,
    personas: ["Juan Martínez","Laura Pérez","Alberto Gil","Miguel Ruiz","Carlos Sanz"]
  },
  {
    id: crearId(),
    nombre: "Hospital Torrent",
    cliente: "Cliente B",
    responsable: "Laura Pérez",
    urgencia: "Media",
    hito: "Inspección parcial",
    fechaHito: "2026-09-22",
    requerimiento: "Cerrar pruebas en planta 2",
    material: "",
    mediosElevacion: "",
    faltaMaterial: false,
    incidencias: 0,
    personas: ["Laura Pérez","Miguel Ruiz","Ana Gómez"]
  },
  {
    id: crearId(),
    nombre: "Nave Industrial Sur",
    cliente: "Cliente C",
    responsable: "Alberto Gil",
    urgencia: "Alta",
    hito: "Montaje de red",
    fechaHito: "2026-09-18",
    requerimiento: "Falta material para terminar ramal",
    material: "30 m tubo rojo + 6 soportes",
    mediosElevacion: "Brazo articulado",
    faltaMaterial: true,
    incidencias: 2,
    personas: ["Alberto Gil","Carlos Sanz","Jorge Vidal","Pedro León"]
  }
];

function normalizarAccionesObra(obra){
  if(Array.isArray(obra.acciones)){
    return obra.acciones
      .map(a=>typeof a==="string" ? {id:"acc-"+Math.random().toString(36).slice(2,10),texto:a,hecha:false} : a)
      .filter(a=>a && String(a.texto||"").trim())
      .map(a=>({id:String(a.id||("acc-"+Math.random().toString(36).slice(2,10))),texto:String(a.texto).trim(),hecha:!!a.hecha}));
  }
  const legado=String(obra.requerimiento||"").trim();
  return legado ? [{id:"acc-"+Math.random().toString(36).slice(2,10),texto:legado,hecha:false}] : [];
}
function normalizarEstadoMaterial(v){
  const e=String(v||"").toLowerCase().trim();
  if(e==="presupuesto" || e==="presupuesto solicitado" || e==="solicitado presupuesto") return "presupuesto";
  if(e==="pedido") return "pedido";
  if(e==="recibido") return "recibido";
  return "pendiente";
}
function normalizarMaterialesObra(obra){
  if(Array.isArray(obra.materiales)){
    return obra.materiales
      .map(m=>typeof m==="string" ? {id:"mat-"+Math.random().toString(36).slice(2,10),texto:m,estado:"pendiente"} : m)
      .filter(m=>m && String(m.texto||"").trim())
      .map(m=>{
        const estado=normalizarEstadoMaterial(m.estado || (m.recibido ? "recibido" : "pendiente"));
        return {id:String(m.id||("mat-"+Math.random().toString(36).slice(2,10))),texto:String(m.texto).trim(),estado,recibido:estado==="recibido"};
      });
  }
  const legado=String(obra.material||"").trim();
  const estado=obra.faltaMaterial ? "pendiente" : "recibido";
  return legado ? [{id:"mat-"+Math.random().toString(36).slice(2,10),texto:legado,estado,recibido:estado==="recibido"}] : [];
}
obras=obras.map(o=>({...o,acciones:normalizarAccionesObra(o),materiales:normalizarMaterialesObra(o)}));

function crearPersonaId(){
  return "persona-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2,8);
}

function nombreClave(v){ return String(v||"").trim().toLocaleLowerCase("es-ES"); }

let personal = JSON.parse(localStorage.getItem(PERSONAL_STORAGE_KEY) || "null");
if(!Array.isArray(personal)){
  const nombres=[...new Set(obras.flatMap(o=>[o.responsable,...(o.personas||[])]).map(x=>(x||"").trim()).filter(Boolean))];
  personal=nombres.map(nombre=>({id:crearPersonaId(),nombre,tipo:"interno"}));
  localStorage.setItem(PERSONAL_STORAGE_KEY, JSON.stringify(personal));
}
personal = personal.filter(p=>p && p.id && String(p.nombre||"").trim()).map(p=>({id:String(p.id),nombre:String(p.nombre).trim(),tipo:p.tipo==="externo"?"externo":"interno"}));

let asignaciones = JSON.parse(localStorage.getItem(ASIGNACIONES_STORAGE_KEY) || "[]");
if(!Array.isArray(asignaciones)) asignaciones=[];

function guardarPersonal(){ localStorage.setItem(PERSONAL_STORAGE_KEY, JSON.stringify(personal)); }
function guardarAsignaciones(){ localStorage.setItem(ASIGNACIONES_STORAGE_KEY, JSON.stringify(asignaciones)); }
function personaPorId(id){ return personal.find(p=>p.id===id); }
function idPersonaPorNombre(nombre){ return personal.find(p=>nombreClave(p.nombre)===nombreClave(nombre))?.id || ""; }
function nombrePersonaPorId(id){ return personaPorId(id)?.nombre || "Persona eliminada"; }
function asignacionDe(fecha,obraId){ return asignaciones.find(a=>a.fecha===fecha && a.obraId===obraId); }

function idsAsignadosObraFecha(obraId,fecha){
  const a=asignacionDe(fecha,obraId);
  if(a) return [...new Set((a.personaIds||[]).filter(id=>personaPorId(id)))];
  const o=obras.find(x=>x.id===obraId);
  if(!o) return [];
  return [...new Set((o.personas||[]).map(idPersonaPorNombre).filter(Boolean))];
}
function nombresAsignadosObraFecha(obraId,fecha){
  return idsAsignadosObraFecha(obraId,fecha).map(nombrePersonaPorId);
}
function obrasPersonaEnFecha(personaId,fecha){
  return asignaciones.filter(a=>a.fecha===fecha && (a.personaIds||[]).includes(personaId)).map(a=>a.obraId);
}

const $ = id => document.getElementById(id);

const OBRA_COLORES = [
  {color:"#ff6b16", soft:"#fff0e7", deep:"#9f3500", text:"#ffffff"}, // naranja vivo
  {color:"#178cff", soft:"#e8f4ff", deep:"#075ea8", text:"#ffffff"}, // azul vivo
  {color:"#22c55e", soft:"#e9f9ef", deep:"#0f7133", text:"#ffffff"}, // verde vivo
  {color:"#ffd51e", soft:"#fff9d9", deep:"#8a6a00", text:"#222831"}, // amarillo vivo
  {color:"#9938ef", soft:"#f4e8ff", deep:"#63209a", text:"#ffffff"}, // violeta vivo
  {color:"#ef3340", soft:"#ffe9eb", deep:"#9f1520", text:"#ffffff"}, // rojo vivo
  {color:"#00a9b7", soft:"#e3f8fa", deep:"#006b73", text:"#ffffff"}, // turquesa vivo
  {color:"#ff3d91", soft:"#ffe8f2", deep:"#9f1454", text:"#ffffff"}  // fucsia
];

function colorObraPorIndice(index){
  return OBRA_COLORES[index % OBRA_COLORES.length];
}

function estiloObraPorId(id){
  const idx = Math.max(0, obras.findIndex(o => o.id === id));
  const c = colorObraPorIndice(idx);
  return `--obra-color:${c.color};--obra-soft:${c.soft};--obra-deep:${c.deep};--obra-text:${c.text||"#fff"};`;
}


function guardar(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obras));
}

function iniciales(nombre){
  return nombre.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0].toUpperCase()).join("");
}
function tipoPersonaPorNombre(nombre){ return personaPorId(idPersonaPorNombre(nombre))?.tipo || "interno"; }
function iconoTipoPersona(tipo){ return tipo==="externo" ? "🤝" : "🏢"; }
function etiquetaTipoPersona(tipo){ return tipo==="externo" ? "Externo" : "Interno"; }
function avatarPersona(nombre){
  const tipo=tipoPersonaPorNombre(nombre);
  return `<div class="avatar" title="${escapeHtml(nombre)} · ${etiquetaTipoPersona(tipo)}">${escapeHtml(iniciales(nombre))}<span class="person-origin">${iconoTipoPersona(tipo)}</span></div>`;
}

function escapeHtml(v){
  return String(v ?? "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  })[m]);
}

let accionesEdicion=[];
function crearAccionId(){ return "acc-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,7); }
function accionesDe(obra){ return normalizarAccionesObra(obra||{}); }
function accionesPendientesDe(obra){ return accionesDe(obra).filter(a=>!a.hecha); }
function renderEditorAcciones(){
  const el=$("accionesEditorLista");
  if(!el) return;
  if(!accionesEdicion.length){
    el.innerHTML='<div style="font-size:11px;color:#7b858e;padding:4px 0">Todavía no hay acciones. Pulsa “Añadir acción”.</div>';
    return;
  }
  el.innerHTML=accionesEdicion.map((a,i)=>`
    <div class="action-edit-row">
      <input type="checkbox" ${a.hecha?'checked':''} onchange="cambiarEstadoAccionEdicion(${i},this.checked)" title="Marcar como hecha">
      <input type="text" value="${escapeHtml(a.texto)}" oninput="cambiarTextoAccionEdicion(${i},this.value)" placeholder="Describe la acción">
      <button type="button" class="action-remove" onclick="quitarAccionEdicion(${i})">Borrar</button>
    </div>`).join("");
}
window.cambiarEstadoAccionEdicion=(i,v)=>{ if(accionesEdicion[i]) accionesEdicion[i].hecha=!!v; };
window.cambiarTextoAccionEdicion=(i,v)=>{ if(accionesEdicion[i]) accionesEdicion[i].texto=v; };
window.quitarAccionEdicion=i=>{ accionesEdicion.splice(i,1); renderEditorAcciones(); };
function agregarAccionEdicion(){ accionesEdicion.push({id:crearAccionId(),texto:"",hecha:false}); renderEditorAcciones(); setTimeout(()=>$("accionesEditorLista")?.querySelector('.action-edit-row:last-child input[type="text"]')?.focus(),0); }
let materialesEdicion=[];
function crearMaterialId(){ return "mat-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,7); }
function etiquetaEstadoMaterial(estado){
  return ({pendiente:"Pendiente",presupuesto:"Presupuesto solicitado",pedido:"Pedido",recibido:"Recibido"})[normalizarEstadoMaterial(estado)] || "Pendiente";
}
function opcionesEstadoMaterial(actual){
  const a=normalizarEstadoMaterial(actual);
  return [["pendiente","Pendiente"],["presupuesto","Presupuesto solicitado"],["pedido","Pedido"],["recibido","Recibido"]]
    .map(([v,l])=>`<option value="${v}" ${a===v?'selected':''}>${l}</option>`).join("");
}
function materialesDe(obra){
  return normalizarMaterialesObra(obra||{}).filter(m=>m && String(m.texto||"").trim());
}
function materialesPendientesDe(obra){
  return materialesDe(obra).filter(m=>normalizarEstadoMaterial(m.estado)!=="recibido" && String(m.texto||"").trim());
}
function renderEditorMateriales(){
  const el=$("materialesEditorLista"); if(!el) return;
  if(!materialesEdicion.length){ el.innerHTML='<div style="font-size:11px;color:#7b858e;padding:4px 0">Todavía no hay materiales. Pulsa “Añadir material”.</div>'; return; }
  el.innerHTML=materialesEdicion.map((m,i)=>`<div class="material-edit-row">
    <input type="text" value="${escapeHtml(m.texto)}" oninput="cambiarTextoMaterialEdicion(${i},this.value)" placeholder="Ej: 4 BIE, 2 válvulas...">
    <select onchange="cambiarEstadoMaterialEdicion(${i},this.value)" title="Estado del material">${opcionesEstadoMaterial(m.estado)}</select>
    <button type="button" class="action-remove" onclick="quitarMaterialEdicion(${i})">Borrar</button>
  </div>`).join("");
}
window.cambiarEstadoMaterialEdicion=(i,v)=>{ if(materialesEdicion[i]){ materialesEdicion[i].estado=normalizarEstadoMaterial(v); materialesEdicion[i].recibido=materialesEdicion[i].estado==="recibido"; } };
window.cambiarTextoMaterialEdicion=(i,v)=>{ if(materialesEdicion[i]) materialesEdicion[i].texto=v; };
window.quitarMaterialEdicion=i=>{ materialesEdicion.splice(i,1); renderEditorMateriales(); };
function agregarMaterialEdicion(){ materialesEdicion.push({id:crearMaterialId(),texto:"",estado:"pendiente",recibido:false}); renderEditorMateriales(); setTimeout(()=>$("materialesEditorLista")?.querySelector('.material-edit-row:last-child input[type="text"]')?.focus(),0); }
function htmlMateriales(obra,soloPendientes=false){
  const arr=(soloPendientes?materialesPendientesDe(obra):materialesDe(obra)).filter(m=>String(m?.texto||"").trim());
  if(!arr.length) return '<span>Sin material pendiente</span>';
  return `<div class="material-chip-list">${arr.map(m=>{const e=normalizarEstadoMaterial(m.estado);return `<div class="material-chip ${e==='recibido'?'done':''}"><span class="material-chip-main"><span>${e==='recibido'?'✓':'•'}</span><span>${escapeHtml(m.texto)}</span></span><span class="material-status ${e}">${etiquetaEstadoMaterial(e)}</span></div>`}).join("")}</div>`;
}
function actualizarEstadoMaterial(obraId,materialId,estado){
  const o=obras.find(x=>x.id===obraId); if(!o) return;
  o.materiales=materialesDe(o).map(m=>m.id===materialId?{...m,estado:normalizarEstadoMaterial(estado),recibido:normalizarEstadoMaterial(estado)==="recibido"}:m);
  o.material=o.materiales.filter(m=>m.estado!=="recibido").map(m=>m.texto).join(" · ");
  o.faltaMaterial=o.materiales.some(m=>m.estado!=="recibido");
  guardar(); render(); renderMaterial();
}
window.actualizarEstadoMaterial=actualizarEstadoMaterial;

const MAQUINAS_OPCIONES=[
  "Plataforma tijera","Brazo articulado","Plataforma telescópica","Manipulador telescópico",
  "Carretilla elevadora","Camión grúa","Elevador de material","Andamio","Torre móvil","Otra maquinaria"
];
const EMPRESAS_MAQUINARIA=["","VALQUISA","KYO","MAXBER","MATECON","LOXAM"];
let maquinariaEdicion=[];
function opcionesSelect(valores,actual){
  const lista=[...valores];
  if(actual && !lista.includes(actual)) lista.unshift(actual);
  return lista.map(v=>`<option value="${escapeHtml(v)}" ${v===actual?'selected':''}>${v===""?"Seleccionar empresa":escapeHtml(v)}</option>`).join("");
}
function maquinasActivasObra(obraId){ return maquinaria.filter(m=>m.obraId===obraId && m.estado!=="baja"); }
function renderEditorMaquinaria(){
  const el=$("maquinariaEditorLista"); if(!el) return;
  if(!maquinariaEdicion.length){ el.innerHTML='<div style="font-size:11px;color:#7b858e;padding:4px 0">No hay maquinaria activa. Pulsa “Añadir maquinaria”.</div>'; return; }
  el.innerHTML=maquinariaEdicion.map((m,i)=>`<div class="machine-edit-row">
    <label>Máquina<select onchange="cambiarMaquinaEdicion(${i},'maquina',this.value)">${opcionesSelect(MAQUINAS_OPCIONES,m.maquina||MAQUINAS_OPCIONES[0])}</select></label>
    <label>Empresa<select onchange="cambiarMaquinaEdicion(${i},'empresa',this.value)">${opcionesSelect(EMPRESAS_MAQUINARIA,m.empresa||EMPRESAS_MAQUINARIA[0])}</select></label>
    <label>Contacto<input value="${escapeHtml(m.contacto||'')}" oninput="cambiarMaquinaEdicion(${i},'contacto',this.value)" placeholder="Nombre contacto"></label>
    <label>Teléfono<input type="tel" value="${escapeHtml(m.telefono||'')}" oninput="cambiarMaquinaEdicion(${i},'telefono',this.value)" placeholder="600 000 000"></label>
    <button type="button" class="action-remove" onclick="quitarMaquinaEdicion(${i})">Borrar</button>
  </div>`).join("");
}
window.cambiarMaquinaEdicion=(i,k,v)=>{ if(maquinariaEdicion[i]) maquinariaEdicion[i][k]=v; };
window.quitarMaquinaEdicion=i=>{ maquinariaEdicion.splice(i,1); renderEditorMaquinaria(); };
function agregarMaquinaEdicion(){ maquinariaEdicion.push({id:"tmp-"+crearMaquinariaId(),maquina:MAQUINAS_OPCIONES[0],empresa:"VALQUISA",contacto:"",telefono:"",fechaAlta:hoyISO(),estado:"activa"}); renderEditorMaquinaria(); }
function textoMaquinariaObra(obraId){
  const arr=maquinasActivasObra(obraId);
  return arr.length ? arr.map(m=>`${m.maquina}${m.empresa?` (${m.empresa})`:''}`).join(" · ") : "No indicada";
}

function htmlAccionesTarjeta(obra){
  const todas=accionesDe(obra), pendientes=todas.filter(a=>!a.hecha);
  if(!todas.length) return '<span>Sin acciones</span>';
  const mostrar=[...pendientes,...todas.filter(a=>a.hecha)].slice(0,3);
  return `<div class="action-card-list">${mostrar.map(a=>`<div class="action-card-line ${a.hecha?'done':''}"><span>${a.hecha?'✓':'•'}</span><span>${escapeHtml(a.texto)}</span></div>`).join('')}</div><div class="action-count">${pendientes.length} pendiente(s) · ${todas.length} total</div>`;
}
function htmlAccionesDetalle(obra){
  const todas=accionesDe(obra);
  if(!todas.length) return '<div style="font-size:12px;color:#7b858e;margin-top:6px">Sin acciones.</div>';
  return `<div class="actions-display">${todas.map(a=>`<div class="action-display-item ${a.hecha?'done':''}"><span class="action-status">${a.hecha?'✓':'○'}</span><span class="action-text">${escapeHtml(a.texto)}</span><span><button class="action-inline-btn" onclick="alternarAccion('${obra.id}','${a.id}')">${a.hecha?'Reabrir':'Hecha'}</button><button class="action-inline-btn" onclick="borrarAccion('${obra.id}','${a.id}')">Borrar</button></span></div>`).join('')}</div>`;
}
window.alternarAccion=(obraId,accionId)=>{
  const o=obras.find(x=>x.id===obraId); if(!o) return;
  o.acciones=accionesDe(o); const a=o.acciones.find(x=>x.id===accionId); if(!a) return;
  a.hecha=!a.hecha; o.requerimiento=accionesPendientesDe(o).map(x=>x.texto).join(' · '); guardar(); render(); abrirDetalle(obraId);
};
window.borrarAccion=(obraId,accionId)=>{
  const o=obras.find(x=>x.id===obraId); if(!o) return;
  o.acciones=accionesDe(o).filter(a=>a.id!==accionId); o.requerimiento=accionesPendientesDe(o).map(x=>x.texto).join(' · '); guardar(); render(); abrirDetalle(obraId);
};

function render(){
  const texto = $("buscar").value.toLowerCase().trim();
  const urgencia = $("filtroUrgencia").value;
  const soloMaterial = $("soloMaterial").checked;
  const fecha=hoyISO();

  const filtradas = obras.filter(o => {
    const personasHoy=nombresAsignadosObraFecha(o.id,fecha);
    const blob = [o.nombre,o.cliente,o.responsable,o.requerimiento,...accionesDe(o).map(a=>a.texto),...materialesDe(o).map(m=>m.texto),...maquinasActivasObra(o.id).flatMap(m=>[m.maquina,m.empresa,m.contacto]),...personasHoy].join(" ").toLowerCase();
    return (!texto || blob.includes(texto))
      && (!urgencia || o.urgencia === urgencia)
      && (!soloMaterial || materialesPendientesDe(o).length>0);
  });

  $("obrasGrid").innerHTML = filtradas.map(o => {
    const personasHoy=nombresAsignadosObraFecha(o.id,fecha);
    const visibles = personasHoy.slice(0,4);
    const extra = Math.max(0, personasHoy.length - visibles.length);

    return `
      <article class="obra-card urgencia-${escapeHtml(o.urgencia)}"
               style="${estiloObraPorId(o.id)}"
               onclick="abrirDetalle('${o.id}')">
        <div class="card-head">
          <div>
            <h3>${escapeHtml(o.nombre)}</h3>
            <p>${escapeHtml(o.cliente || "Sin cliente")}</p>
          </div>
          <span class="urgencia-tag">${escapeHtml(o.urgencia)}</span>
        </div>

        <div class="card-body">
          <div class="info-row">
            <div class="label">Responsable</div>
            <div class="value">${escapeHtml(o.responsable||"-")}</div>
          </div>
          <div class="info-row">
            <div class="label">Próximo hito</div>
            <div class="value">${escapeHtml(o.hito || "-")} · ${escapeHtml(o.fechaHito || "-")}</div>
          </div>

          <div class="pending-grid">
            <div class="pending-item"><b>Acciones</b>${htmlAccionesTarjeta(o)}</div>
            <div class="pending-item"><b>Material pendiente</b>${htmlMateriales(o,true)}</div>
            <div class="pending-item"><b>Maquinaria</b>${escapeHtml(textoMaquinariaObra(o.id))}</div>
          </div>

          <div class="people-block">
            <div class="people-title">
              <strong>Personal de hoy</strong>
              <span>${personasHoy.length} persona(s)</span>
            </div>
            <div class="avatars">
              ${visibles.map(p => avatarPersona(p)).join("")}
              ${extra ? `<div class="avatar more">+${extra}</div>` : ""}
              ${!personasHoy.length?'<span style="font-size:11px;color:#7b858e">Sin asignación para hoy</span>':""}
            </div>
          </div>

          ${o.incidencias > 0 ? `<div class="alert-box urgent">⚠ ${o.incidencias} incidencia(s) abierta(s)</div>` : ""}
        </div>

        <div class="card-footer">
          <span>Hito: <strong>${escapeHtml(o.fechaHito || "-")}</strong></span>
          <span>Resp.: <strong>${escapeHtml(o.responsable||"-")}</strong></span>
        </div>
      </article>`;
  }).join("");

  $("kpiObras").textContent = obras.length;
  $("kpiUrgentes").textContent = obras.filter(o => o.urgencia === "Alta").length;
  $("kpiMaterial").textContent = obras.filter(o => materialesPendientesDe(o).length).length;
  $("kpiPersonas").textContent = personal.length;
  $("kpiIncidencias").textContent = obras.reduce((a,o)=>a+Number(o.incidencias||0),0);
}

function abrirNueva(){
  $("obraForm").reset();
  $("obraId").value = "";
  $("incidenciasObra").value = 0;
  $("faltaMaterialObra").value = "false";
  $("urgenciaObra").value = "Baja";
  $("mediosElevacionObra").value = "";
  accionesEdicion=[]; materialesEdicion=[]; maquinariaEdicion=[];
  renderEditorAcciones(); renderEditorMateriales(); renderEditorMaquinaria();
  $("modalTitulo").textContent = "Nueva obra";
  $("obraModal").showModal();
}

function editarObra(id){
  const o = obras.find(x=>x.id===id);
  if(!o) return;
  $("obraId").value=o.id;
  $("nombreObra").value=o.nombre;
  $("clienteObra").value=o.cliente || "";
  $("responsableObra").value=o.responsable || "";
  $("urgenciaObra").value=o.urgencia || "Baja";
  $("hitoObra").value=o.hito || "";
  $("fechaHitoObra").value=o.fechaHito || "";
  accionesEdicion=accionesDe(o).map(a=>({...a}));
  renderEditorAcciones();
  $("requerimientoObra").value=o.requerimiento || "";
  materialesEdicion=materialesDe(o).map(m=>({...m}));
  renderEditorMateriales();
  $("materialObra").value=o.material || "";
  $("incidenciasObra").value=o.incidencias || 0;
  $("faltaMaterialObra").value=String(materialesPendientesDe(o).length>0);
  sincronizarMaquinariaDesdeObras();
  maquinariaEdicion=maquinasActivasObra(o.id).map(m=>({...m}));
  renderEditorMaquinaria();
  $("mediosElevacionObra").value=textoMaquinariaObra(o.id)==="No indicada"?"":textoMaquinariaObra(o.id);
  $("personasObra").value=(o.personas||[]).join(", ");
  $("modalTitulo").textContent="Editar obra";
  $("obraModal").showModal();
}

window.abrirDetalle = function(id){
  const o=obras.find(x=>x.id===id);
  if(!o) return;
  const personasHoy=nombresAsignadosObraFecha(o.id,hoyISO());
  $("detalleTitulo").textContent=o.nombre;
  $("detalleContenido").innerHTML=`
    <div class="detail-grid">
      <div class="detail-box"><span>Cliente</span><strong>${escapeHtml(o.cliente||"-")}</strong></div>
      <div class="detail-box"><span>Responsable</span><strong>${escapeHtml(o.responsable||"-")}</strong></div>
      <div class="detail-box"><span>Urgencia</span><strong>${escapeHtml(o.urgencia)}</strong></div>
      <div class="detail-box"><span>Fecha hito</span><strong>${escapeHtml(o.fechaHito||"-")}</strong></div>
      <div class="detail-box full"><span>Próximo hito</span><strong>${escapeHtml(o.hito||"-")}</strong></div>
      <div class="detail-box full"><span>Acciones</span>${htmlAccionesDetalle(o)}</div>
      <div class="detail-box full"><span>Materiales</span>${htmlMateriales(o,false)}</div>
      <div class="detail-box full"><span>Maquinaria</span><strong>${escapeHtml(textoMaquinariaObra(o.id))}</strong></div>
      <div class="detail-box"><span>Incidencias</span><strong>${Number(o.incidencias||0)}</strong></div>
      <div class="detail-box full">
        <span>Personal asignado hoy</span>
        <div class="avatars" style="margin-top:8px">
          ${personasHoy.length?personasHoy.map(p=>avatarPersona(p)).join(""):'<span style="font-size:11px;color:#7b858e">Sin asignación para hoy</span>'}
        </div>
      </div>
    </div>`;
  $("editarDetalle").onclick=()=>{
    $("detalleModal").close();
    editarObra(id);
  };
  $("borrarDetalle").onclick=()=>borrarObra(id);
  if(!$("detalleModal").open) $("detalleModal").showModal();
};


function borrarObra(id){
  const o=obras.find(x=>x.id===id);
  if(!o) return;
  if(!confirm(`¿Borrar la obra "${o.nombre}"?\n\nSe eliminarán sus asignaciones futuras/diarias, pero se conservará el histórico de horas para los informes.`)) return;
  agendaRegistros=agendaRegistros.map(r=>r.obraId===id ? {...r,obraNombre:r.obraNombre||o.nombre} : r);
  guardarAgenda();
  maquinaria=maquinaria.map(m=>m.obraId===id ? {...m,obraNombre:m.obraNombre||o.nombre} : m);
  guardarMaquinaria();
  asignaciones=asignaciones.filter(a=>a.obraId!==id);
  guardarAsignaciones();
  obras=obras.filter(x=>x.id!==id);
  guardar();
  $("detalleModal")?.close();
  render();
  if(vistaActual==="personal") renderPersonal();
  if(vistaActual==="agenda") renderAgenda();
  if(vistaActual==="maquinaria") renderMaquinaria();
}

$("obraForm").addEventListener("submit", e=>{
  e.preventDefault();
  const id=$("obraId").value || crearId();
  const obra={
    id,
    nombre:$("nombreObra").value.trim(),
    cliente:$("clienteObra").value.trim(),
    responsable:$("responsableObra").value.trim(),
    urgencia:$("urgenciaObra").value,
    hito:$("hitoObra").value.trim(),
    fechaHito:$("fechaHitoObra").value,
    acciones:accionesEdicion.filter(a=>String(a.texto||"").trim()).map(a=>({id:a.id||crearAccionId(),texto:String(a.texto).trim(),hecha:!!a.hecha})),
    requerimiento:accionesEdicion.filter(a=>!a.hecha && String(a.texto||"").trim()).map(a=>String(a.texto).trim()).join(" · "),
    materiales:materialesEdicion.filter(m=>String(m.texto||"").trim()).map(m=>{const estado=normalizarEstadoMaterial(m.estado);return {id:m.id||crearMaterialId(),texto:String(m.texto).trim(),estado,recibido:estado==="recibido"};}),
    material:materialesEdicion.filter(m=>normalizarEstadoMaterial(m.estado)!=="recibido" && String(m.texto||"").trim()).map(m=>String(m.texto).trim()).join(" · "),
    mediosElevacion:maquinariaEdicion.map(m=>m.maquina).filter(Boolean).join(" · "),
    incidencias:Number($("incidenciasObra").value||0),
    faltaMaterial:materialesEdicion.some(m=>normalizarEstadoMaterial(m.estado)!=="recibido" && String(m.texto||"").trim()),
    personas:(obras.find(x=>x.id===id)?.personas||[])
  };
  const i=obras.findIndex(x=>x.id===id);
  if(i>=0) obras[i]=obra; else obras.push(obra);
  guardar();
  // La maquinaria se da de alta exclusivamente desde la ficha de obra.
  const idsEdicion=new Set();
  maquinariaEdicion.forEach(m=>{
    let reg=maquinaria.find(x=>x.id===m.id && x.obraId===id);
    if(!reg){
      reg={id:crearMaquinariaId(),obraId:id,obraNombre:obra.nombre,fechaAlta:m.fechaAlta||hoyISO(),estado:"activa",fechaBaja:"",bajaPor:"",origen:"obra"};
      maquinaria.push(reg);
    }
    Object.assign(reg,{obraId:id,obraNombre:obra.nombre,maquina:m.maquina||MAQUINAS_OPCIONES[0],empresa:m.empresa||"",contacto:m.contacto||"",telefono:m.telefono||"",origen:"obra"});
    idsEdicion.add(reg.id);
  });
  maquinaria=maquinaria.filter(m=>!(m.obraId===id && m.origen==="obra" && m.estado!=="baja" && !idsEdicion.has(m.id)));
  guardarMaquinaria();
  $("obraModal").close();
  render();
  poblarSelectObrasAgenda();
  if(vistaActual==="maquinaria") renderMaquinaria();
  if(vistaActual==="personal") renderPersonal();
});

$("btnNuevaObra").addEventListener("click", abrirNueva);
$("btnAgregarAccion")?.addEventListener("click", agregarAccionEdicion);
$("btnAgregarMaterial")?.addEventListener("click", agregarMaterialEdicion);
$("btnAgregarMaquina")?.addEventListener("click", agregarMaquinaEdicion);
$("cerrarModal").addEventListener("click",()=>$("obraModal").close());
$("cancelar").addEventListener("click",()=>$("obraModal").close());
$("cerrarDetalle").addEventListener("click",()=>$("detalleModal").close());
$("cerrarDetalle2").addEventListener("click",()=>$("detalleModal").close());
$("buscar").addEventListener("input",render);
$("filtroUrgencia").addEventListener("change",render);
$("soloMaterial").addEventListener("change",render);

sincronizarMaquinariaDesdeObras();
render();


let vistaActual = "obras";

function activarMenu(id){
  document.querySelectorAll(".menu-item").forEach(b=>b.classList.remove("active"));
  const btn = document.getElementById(id);
  if(btn) btn.classList.add("active");
}

function mostrarVista(nombre){
  ["Obras","Urgencias","Material","Personal","Maquinaria","Agenda"].forEach(v=>{
    document.getElementById("vista"+v)?.classList.add("hidden");
  });
  document.getElementById("vista"+nombre)?.classList.remove("hidden");
  document.getElementById("corporateHero")?.classList.toggle("hidden", nombre!=="Obras");
  vistaActual = nombre.toLowerCase();

  if(nombre==="Obras"){
    activarMenu("navObras");
    render();
  }
  if(nombre==="Urgencias"){
    activarMenu("navUrgencias");
    renderUrgencias();
  }
  if(nombre==="Material"){
    activarMenu("navMaterial");
    renderMaterial();
  }
  if(nombre==="Personal"){
    activarMenu("navPersonal");
    renderPersonal();
  }
  if(nombre==="Maquinaria"){
    activarMenu("navMaquinaria");
    renderMaquinaria();
  }
  if(nombre==="Agenda"){
    activarMenu("navAgenda");
    renderAgenda();
    prepararRegistroHoras(agendaDiaSeleccionado||hoyISO(), false);
  }
}

function renderUrgencias(){
  const items = obras
    .filter(o => o.urgencia === "Alta" || (o.requerimiento||"").trim())
    .sort((a,b)=>{
      const peso={Alta:3,Media:2,Baja:1};
      return (peso[b.urgencia]||0)-(peso[a.urgencia]||0);
    });

  const el = document.getElementById("urgenciasLista");
  if(!items.length){
    el.innerHTML='<div class="empty-state">No hay urgencias abiertas.</div>';
    return;
  }

  el.innerHTML = items.map(o=>`
    <div class="work-item ${o.urgencia==="Alta"?"danger":"warning"}" style="${estiloObraPorId(o.id)}">
      <div>
        <div class="work-title">${escapeHtml(o.nombre)}</div>
        <div class="work-sub">Responsable: ${escapeHtml(o.responsable||"-")} · Urgencia ${escapeHtml(o.urgencia)}</div>
      </div>
      <div class="work-note">${escapeHtml(o.requerimiento || "Revisar prioridad de la obra")}</div>
      <button class="work-action" onclick="abrirDetalle('${o.id}')">Ver obra</button>
    </div>
  `).join("");
}

function renderMaterial(){
  const items=obras.flatMap(o=>materialesPendientesDe(o).filter(m=>String(m?.texto||"").trim()).map(m=>({obra:o,material:m})));
  const el=document.getElementById("materialLista");
  if(!items.length){ el.innerHTML='<div class="empty-state">No hay avisos de material pendientes.</div>'; return; }
  el.innerHTML=items.map(({obra:o,material:m})=>{
    const estado=normalizarEstadoMaterial(m.estado);
    return `
    <div class="work-item warning" style="${estiloObraPorId(o.id)}">
      <div>
        <div class="work-title">${escapeHtml(o.nombre)}</div>
        <div class="work-sub">Responsable: ${escapeHtml(o.responsable||"-")}</div>
      </div>
      <div class="work-note">
        <div style="font-weight:800;margin-bottom:6px">${escapeHtml(m.texto)}</div>
        <select class="material-quick-status" onchange="actualizarEstadoMaterial('${o.id}','${m.id}',this.value)">${opcionesEstadoMaterial(estado)}</select>
      </div>
      <button class="work-action" onclick="abrirDetalle('${o.id}')">Ver obra</button>
    </div>`;
  }).join("");
}

function renderPersonal(){
  const fechaEl=document.getElementById("asignacionFecha");
  const obraEl=document.getElementById("asignacionObra");
  if(fechaEl && !fechaEl.value) fechaEl.value=hoyISO();
  const fecha=fechaEl?.value||hoyISO();
  const obraActual=obraEl?.value||"";

  if(obraEl){
    obraEl.innerHTML='<option value="">Selecciona una obra</option>'+obras.map(o=>`<option value="${escapeHtml(o.id)}">${escapeHtml(o.nombre)}</option>`).join("");
    if(obras.some(o=>o.id===obraActual)) obraEl.value=obraActual;
    else if(obras.length) obraEl.value=obras[0].id;
  }
  const obraId=obraEl?.value||"";
  const asignados=new Set(idsAsignadosObraFecha(obraId,fecha));

  const master=document.getElementById("personalMasterList");
  if(master){
    if(!personal.length) master.innerHTML='<div class="empty-state">Todavía no has añadido personal.</div>';
    else master.innerHTML=personal.map(p=>{
      const obrasIds=obrasPersonaEnFecha(p.id,fecha);
      const estado=obrasIds.length ? obrasIds.map(nombreObraPorId).join(", ") : "Libre / sin asignar";
      return `<div class="person-master-row">
        <div class="person-master-meta">
          <div class="person-master-name">👷 ${escapeHtml(p.nombre)} <span class="person-type-badge ${p.tipo==='externo'?'external':'internal'}">${iconoTipoPersona(p.tipo)} ${etiquetaTipoPersona(p.tipo)}</span></div>
          <div class="person-master-status">${escapeHtml(fecha)} · ${escapeHtml(estado)}</div>
        </div>
        <button class="icon-danger" type="button" data-delete-person="${escapeHtml(p.id)}">Borrar</button>
      </div>`;
    }).join("");
  }

  const checks=document.getElementById("asignacionPersonas");
  if(checks){
    if(!personal.length) checks.innerHTML='<div class="empty-state" style="grid-column:1/-1">Añade personal primero.</div>';
    else if(!obraId) checks.innerHTML='<div class="empty-state" style="grid-column:1/-1">Selecciona una obra.</div>';
    else checks.innerHTML=personal.map(p=>{
      const otras=obrasPersonaEnFecha(p.id,fecha).filter(id=>id!==obraId).map(nombreObraPorId);
      return `<label class="assignment-person">
        <input type="checkbox" value="${escapeHtml(p.id)}" ${asignados.has(p.id)?"checked":""}>
        <span>${iconoTipoPersona(p.tipo)} ${escapeHtml(p.nombre)} <span class="person-type-badge ${p.tipo==='externo'?'external':'internal'}">${etiquetaTipoPersona(p.tipo)}</span><small>${otras.length?`Ahora en: ${escapeHtml(otras.join(", "))} · al guardar se moverá`:"Disponible"}</small></span>
      </label>`;
    }).join("");
  }

  const resumen=document.getElementById("asignacionResumen");
  if(resumen){
    const delDia=asignaciones.filter(a=>a.fecha===fecha && (a.personaIds||[]).length);
    resumen.innerHTML=delDia.length
      ? delDia.map(a=>`<div class="assignment-chip"><b>${escapeHtml(nombreObraPorId(a.obraId))}:</b> ${(a.personaIds||[]).map(nombrePersonaPorId).map(escapeHtml).join(", ")||"Sin personal"}</div>`).join("")
      : '<div class="assignment-chip">No hay asignaciones guardadas para este día.</div>';
  }
}

function guardarAsignacionActual(){
  const fecha=document.getElementById("asignacionFecha")?.value;
  const obraId=document.getElementById("asignacionObra")?.value;
  if(!fecha||!obraId){ alert("Selecciona fecha y obra."); return; }
  const seleccionados=[...document.querySelectorAll("#asignacionPersonas input[type=checkbox]:checked")].map(x=>x.value);

  asignaciones=asignaciones.map(a=>{
    if(a.fecha!==fecha || a.obraId===obraId) return a;
    return {...a,personaIds:(a.personaIds||[]).filter(id=>!seleccionados.includes(id))};
  });

  const i=asignaciones.findIndex(a=>a.fecha===fecha&&a.obraId===obraId);
  const nueva={fecha,obraId,personaIds:seleccionados};
  if(i>=0) asignaciones[i]=nueva;
  else asignaciones.push(nueva);
  guardarAsignaciones();
  renderPersonal();
  render();
  if(vistaActual==="agenda"){
    renderAgenda();
    prepararRegistroHoras(fecha,false);
  }
}

function borrarPersona(id){
  const p=personaPorId(id);
  if(!p) return;
  if(!confirm(`¿Borrar a "${p.nombre}" de la plantilla?

Sus horas históricas se conservarán.`)) return;
  personal=personal.filter(x=>x.id!==id);
  asignaciones=asignaciones.map(a=>({...a,personaIds:(a.personaIds||[]).filter(x=>x!==id)}));
  guardarPersonal(); guardarAsignaciones();
  renderPersonal(); render();
}



/* ===== CONTROL DE MAQUINARIA ===== */
function crearMaquinariaId(){ return "maq-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,8); }
function guardarMaquinaria(){ localStorage.setItem(MAQUINARIA_STORAGE_KEY, JSON.stringify(maquinaria)); }
function obraMaquinariaNombre(m){ return obras.find(o=>o.id===m.obraId)?.nombre || m.obraNombre || "Obra eliminada"; }
function telefonoHref(v){ return String(v||"").replace(/[^+\d]/g,""); }

function sincronizarMaquinariaDesdeObras(){
  let cambiado=false;
  // Migración de versiones antiguas: si una obra tenía texto libre en medios de elevación
  // y todavía no tiene registros de maquinaria, se crea un registro para no perderlo.
  obras.forEach(o=>{
    const legado=String(o.mediosElevacion||"").trim();
    const existe=maquinaria.some(m=>m.obraId===o.id);
    if(legado && !existe){
      const primera=legado.split(/[,·]/).map(x=>x.trim()).filter(Boolean)[0]||legado;
      maquinaria.push({id:crearMaquinariaId(),obraId:o.id,obraNombre:o.nombre,maquina:MAQUINAS_OPCIONES.includes(primera)?primera:primera,empresa:"",contacto:"",telefono:"",fechaAlta:hoyISO(),estado:"activa",fechaBaja:"",bajaPor:"",origen:"obra"});
      cambiado=true;
    }
  });
  if(cambiado) guardarMaquinaria();
}

function renderMaquinaria(){
  sincronizarMaquinariaDesdeObras();
  const q=String($("maquinariaBuscar")?.value||"").toLowerCase().trim();
  const estado=$("maquinariaEstado")?.value||"";
  const filtrada=maquinaria.filter(m=>{
    const o=obras.find(x=>x.id===m.obraId);
    const blob=[m.maquina,obraMaquinariaNombre(m),o?.cliente,o?.responsable,o?.hito,m.empresa,m.contacto,m.telefono,m.bajaPor].join(" ").toLowerCase();
    return (!q||blob.includes(q)) && (!estado||m.estado===estado);
  }).sort((a,b)=>{
    if(a.estado!==b.estado) return a.estado==="activa"?-1:1;
    return obraMaquinariaNombre(a).localeCompare(obraMaquinariaNombre(b),"es");
  });

  const activas=maquinaria.filter(m=>m.estado!=="baja").length;
  const bajas=maquinaria.filter(m=>m.estado==="baja").length;
  const obrasCon=new Set(maquinaria.filter(m=>m.estado!=="baja").map(m=>m.obraId||m.obraNombre).filter(Boolean)).size;
  if($("kpiMaquinasActivas")) $("kpiMaquinasActivas").textContent=activas;
  if($("kpiMaquinasBaja")) $("kpiMaquinasBaja").textContent=bajas;
  if($("kpiObrasMaquinaria")) $("kpiObrasMaquinaria").textContent=obrasCon;

  const el=$("maquinariaLista"); if(!el) return;
  if(!filtrada.length){ el.innerHTML='<div class="empty-state">No hay maquinaria que coincida con el filtro.</div>'; return; }
  el.innerHTML=`<div class="machinery-table-wrap"><table class="machinery-table"><thead><tr><th>Obra</th><th>Información de obra</th><th>Máquina</th><th>Empresa</th><th>Contacto</th><th>Estado</th><th>Acción</th></tr></thead><tbody>${filtrada.map(m=>{
    const o=obras.find(x=>x.id===m.obraId);
    return `<tr class="${m.estado==="baja"?"machine-row-inactive":"machine-row-active"}">
      <td><strong>${escapeHtml(obraMaquinariaNombre(m))}</strong></td>
      <td>${o?`Cliente: ${escapeHtml(o.cliente||"-")}<br>Resp.: ${escapeHtml(o.responsable||"-")}<br>Hito: ${escapeHtml(o.hito||"-")} ${o.fechaHito?`· ${escapeHtml(o.fechaHito)}`:""}`:'Obra eliminada'}</td>
      <td><strong>${escapeHtml(m.maquina||"-")}</strong><span class="machine-origin-note">Añadida desde la obra</span></td>
      <td>${escapeHtml(m.empresa||"-")}</td>
      <td><div class="machine-contact-edit"><input id="contacto-${m.id}" value="${escapeHtml(m.contacto||'')}" placeholder="Contacto"><input id="telefono-${m.id}" value="${escapeHtml(m.telefono||'')}" placeholder="Teléfono"><button class="machine-contact-save" type="button" onclick="guardarContactoMaquinaria('${m.id}')">Guardar contacto</button></div></td>
      <td>${m.estado==="baja"?`<span class="machine-status inactive">● Baja${m.fechaBaja?` · ${escapeHtml(m.fechaBaja)}`:""}</span>${m.bajaPor?`<br><small>Por: ${escapeHtml(m.bajaPor)}</small>`:""}`:'<span class="machine-status active">● Activa</span>'}</td>
      <td><div class="machine-actions">${m.estado==="baja"?`<button class="machine-btn restore" type="button" onclick="reactivarMaquinaria('${m.id}')">Reactivar</button>`:`<button class="machine-btn danger" type="button" onclick="darBajaMaquinaria('${m.id}')">Dar de baja</button>`}</div></td>
    </tr>`;
  }).join("")}</tbody></table></div>`;
}
window.guardarContactoMaquinaria=id=>{
  const m=maquinaria.find(x=>x.id===id); if(!m) return;
  m.contacto=document.getElementById(`contacto-${id}`)?.value.trim()||"";
  m.telefono=document.getElementById(`telefono-${id}`)?.value.trim()||"";
  guardarMaquinaria(); renderMaquinaria();
};

window.darBajaMaquinaria=id=>{
  const m=maquinaria.find(x=>x.id===id); if(!m) return;
  const quien=prompt("¿Quién da de baja esta máquina?",m.bajaPor||"");
  if(quien===null) return;
  const limpio=quien.trim();
  if(!limpio){ alert("Indica quién realiza la baja."); return; }
  m.estado="baja"; m.fechaBaja=hoyISO(); m.bajaPor=limpio; guardarMaquinaria(); renderMaquinaria();
};
window.reactivarMaquinaria=id=>{
  const m=maquinaria.find(x=>x.id===id); if(!m) return;
  m.estado="activa"; m.fechaBaja=""; m.bajaPor=""; guardarMaquinaria(); renderMaquinaria();
};
window.borrarMaquinaria=id=>{
  const m=maquinaria.find(x=>x.id===id); if(!m) return;
  if(!confirm(`¿Borrar del seguimiento la máquina "${m.maquina}"?`)) return;
  maquinaria=maquinaria.filter(x=>x.id!==id); guardarMaquinaria(); renderMaquinaria();
};


/* ===== AGENDA DIARIA ===== */
let agendaMesActual = new Date();
agendaMesActual = new Date(agendaMesActual.getFullYear(), agendaMesActual.getMonth(), 1);
let agendaDiaSeleccionado = "";

function fechaISOlocal(d){
  const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,"0"), day=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}
function hoyISO(){ return fechaISOlocal(new Date()); }
function guardarAgenda(){ localStorage.setItem(AGENDA_STORAGE_KEY, JSON.stringify(agendaRegistros)); }
function nombreObraPorId(id){ return obras.find(o=>o.id===id)?.nombre || agendaRegistros.find(r=>r.obraId===id&&r.obraNombre)?.obraNombre || "Obra eliminada"; }
function personasDeObra(id){
  const fecha=document.getElementById("agendaFecha")?.value || hoyISO();
  return nombresAsignadosObraFecha(id,fecha);
}
function poblarSelectObrasAgenda(){
  const opts=obras.map(o=>`<option value="${escapeHtml(o.id)}">${escapeHtml(o.nombre)}</option>`).join("");
  const filtro=document.getElementById("agendaFiltroObra");
  const actualFiltro=filtro?.value||"";
  if(filtro){ filtro.innerHTML='<option value="">Todas las obras</option>'+opts; filtro.value=actualFiltro; }
  const sel=document.getElementById("agendaObra");
  const actual=sel?.value||"";
  if(sel){ sel.innerHTML='<option value="">Selecciona una obra</option>'+opts; if(obras.some(o=>o.id===actual)) sel.value=actual; }
}
function minutosHora(v){
  if(!v || !/^\d{2}:\d{2}$/.test(v)) return null;
  const [h,m]=v.split(":").map(Number); return h*60+m;
}
function calcularHoras(entrada,salida,pausaMin){
  const e=minutosHora(entrada), sa=minutosHora(salida);
  if(e===null||sa===null) return 0;
  let dif=sa-e; if(dif<0) dif+=24*60;
  dif=Math.max(0,dif-(Number(pausaMin)||0));
  return Math.round((dif/60)*100)/100;
}
function formatoHoras(n){
  const num=Number(n)||0;
  return `${num.toLocaleString("es-ES",{minimumFractionDigits:num%1?1:0,maximumFractionDigits:2})} h`;
}
function partesRegistro(r){
  if(Array.isArray(r.partes) && r.partes.length) return r.partes;
  return (r.personas||[]).map(persona=>({persona,entrada:"",salida:"",pausaMin:0,horas:0}));
}
function renderChecksPersonasAgenda(){
  const obraId=document.getElementById("agendaObra")?.value;
  const fecha=document.getElementById("agendaFecha")?.value||hoyISO();
  const el=document.getElementById("agendaPersonas");
  if(!el) return;
  const ids=idsAsignadosObraFecha(obraId,fecha);
  if(!ids.length){
    el.innerHTML='<div class="empty-state" style="grid-column:1/-1;padding:14px">No hay personal asignado a esta obra en esta fecha. Haz la asignación desde la pestaña Personal.</div>';
    return;
  }
  el.innerHTML=ids.map(id=>{
    const p=nombrePersonaPorId(id);
    return `<div class="person-hours-row" data-person-row data-person-id="${escapeHtml(id)}">
    <label class="person-hours-name"><input type="checkbox" name="agendaPersona" value="${escapeHtml(p)}" checked> ${escapeHtml(p)}</label>
    <label>Entrada<input class="agenda-entrada" type="time" value="08:00"></label>
    <label>Salida<input class="agenda-salida" type="time" value="17:00"></label>
    <label>Pausa (min)<input class="agenda-pausa" type="number" min="0" max="480" step="5" value="60"></label>
    <div class="person-total" data-person-total>8 h</div>
  </div>`;
  }).join("");
  actualizarTotalesFilas();
}
function actualizarTotalesFilas(){
  document.querySelectorAll("#agendaPersonas [data-person-row]").forEach(row=>{
    const checked=row.querySelector('input[name="agendaPersona"]')?.checked;
    const entrada=row.querySelector('.agenda-entrada')?.value||"";
    const salida=row.querySelector('.agenda-salida')?.value||"";
    const pausa=row.querySelector('.agenda-pausa')?.value||0;
    const h=checked?calcularHoras(entrada,salida,pausa):0;
    const t=row.querySelector('[data-person-total]'); if(t) t.textContent=formatoHoras(h);
    row.style.opacity=checked?"1":".48";
  });
}
function prepararRegistroHoras(fecha, limpiar=true){
  poblarSelectObrasAgenda();
  if(limpiar) document.getElementById("agendaForm")?.reset();
  const fechaEl=document.getElementById("agendaFecha");
  if(fechaEl) fechaEl.value=fecha||fechaEl.value||hoyISO();
  const filtro=document.getElementById("agendaFiltroObra")?.value;
  const obraEl=document.getElementById("agendaObra");
  if(obraEl){
    if(filtro && obras.some(o=>o.id===filtro)) obraEl.value=filtro;
    else if(!obraEl.value && obras.length) obraEl.value=obras[0].id;
  }
  renderChecksPersonasAgenda();
}
function abrirAgendaModal(fecha){
  prepararRegistroHoras(fecha,true);
  document.getElementById("registroHorasPanel")?.scrollIntoView({behavior:"smooth",block:"start"});
}
function registrosFiltradosAgenda(){
  const filtro=document.getElementById("agendaFiltroObra")?.value||"";
  return agendaRegistros.filter(r=>!filtro || r.obraId===filtro);
}
function renderListaAgenda(fecha){
  const el=document.getElementById("agendaListaDia");
  if(!el) return;
  let regs=registrosFiltradosAgenda();
  if(fecha) regs=regs.filter(r=>r.fecha===fecha);
  else {
    const pref=`${agendaMesActual.getFullYear()}-${String(agendaMesActual.getMonth()+1).padStart(2,"0")}-`;
    regs=regs.filter(r=>r.fecha.startsWith(pref));
  }
  regs.sort((a,b)=>a.fecha.localeCompare(b.fecha)||nombreObraPorId(a.obraId).localeCompare(nombreObraPorId(b.obraId)));
  if(fecha){
    const d=new Date(fecha+"T12:00:00");
    document.getElementById("agendaDiaTitulo").textContent=d.toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"});
    document.getElementById("agendaDiaSubtitulo").textContent=`${regs.length} registro(s) en este día.`;
  } else {
    document.getElementById("agendaDiaTitulo").textContent="Registros del mes";
    document.getElementById("agendaDiaSubtitulo").textContent=`${regs.length} registro(s) guardado(s).`;
  }
  if(!regs.length){ el.innerHTML='<div class="agenda-empty">No hay personal ni horas registradas.</div>'; return; }
  el.innerHTML=regs.map(r=>{
    const partes=partesRegistro(r);
    const total=partes.reduce((a,p)=>a+(Number(p.horas)||0),0);
    const lineas=partes.map(p=>`<div class="person-hour-line"><span>👷 ${escapeHtml(p.persona)}${p.entrada&&p.salida?` · ${escapeHtml(p.entrada)}–${escapeHtml(p.salida)}${Number(p.pausaMin)?` · pausa ${Number(p.pausaMin)} min`:""}`:""}</span><b>${formatoHoras(p.horas)}</b></div>`).join("");
    return `<div class="agenda-record" style="${estiloObraPorId(r.obraId)}"><strong>${escapeHtml(nombreObraPorId(r.obraId))}</strong><small>${escapeHtml(r.fecha)} · Total: ${formatoHoras(total)}</small>${lineas}${r.nota?`<div class="names">📝 ${escapeHtml(r.nota)}</div>`:""}<div class="agenda-record-actions"><button class="agenda-delete" type="button" data-agenda-delete="${escapeHtml(r.id)}">Eliminar</button></div></div>`;
  }).join("");
}
function renderAgenda(){
  poblarSelectObrasAgenda();
  const titulo=document.getElementById("agendaMesTitulo");
  const cal=document.getElementById("agendaCalendario");
  if(!titulo||!cal) return;
  titulo.textContent=agendaMesActual.toLocaleDateString("es-ES",{month:"long",year:"numeric"}).replace(/^./,c=>c.toUpperCase());
  const y=agendaMesActual.getFullYear(), m=agendaMesActual.getMonth();
  const first=new Date(y,m,1); const offset=(first.getDay()+6)%7;
  const start=new Date(y,m,1-offset);
  const regs=registrosFiltradosAgenda();
  let html="";
  for(let i=0;i<42;i++){
    const d=new Date(start); d.setDate(start.getDate()+i);
    const iso=fechaISOlocal(d); const dayRegs=regs.filter(r=>r.fecha===iso);
    const classes=["calendar-day"];
    if(d.getMonth()!==m) classes.push("other");
    if(iso===hoyISO()) classes.push("today");
    if(dayRegs.length) classes.push("has-data");
    const dayStyle=dayRegs.length===1 ? estiloObraPorId(dayRegs[0].obraId) : "";
    html+=`<div class="${classes.join(" ")}" style="${dayStyle}" data-agenda-date="${iso}" tabindex="0" role="button" aria-label="${iso}"><div class="day-number">${d.getDate()}</div>${dayRegs.slice(0,3).map(r=>{const partes=partesRegistro(r);const th=partes.reduce((a,p)=>a+(Number(p.horas)||0),0);return `<div class="day-entry" style="${estiloObraPorId(r.obraId)}"><strong>${escapeHtml(nombreObraPorId(r.obraId))}</strong><span>${partes.map(p=>escapeHtml(p.persona)).join(", ")}</span><span class="hours-mini">${formatoHoras(th)}</span></div>`}).join("")}${dayRegs.length>3?`<div class="day-entry day-entry-more"><strong>+${dayRegs.length-3} registro(s)</strong></div>`:""}</div>`;
  }
  cal.innerHTML=html;
  const prefMes=`${y}-${String(m+1).padStart(2,"0")}-`;
  const regsMes=regs.filter(r=>r.fecha.startsWith(prefMes));
  const partesMes=regsMes.flatMap(partesRegistro);
  const horasMes=partesMes.reduce((a,p)=>a+(Number(p.horas)||0),0);
  const personasMes=new Set(partesMes.filter(p=>(Number(p.horas)||0)>0).map(p=>p.persona));
  const hEl=document.getElementById("agendaHorasMes"), jEl=document.getElementById("agendaJornadasMes"), pEl=document.getElementById("agendaPersonasMes");
  if(hEl) hEl.textContent=formatoHoras(horasMes);
  if(jEl) jEl.textContent=regsMes.length;
  if(pEl) pEl.textContent=personasMes.size;
  renderListaAgenda(agendaDiaSeleccionado);
}


function xmlEsc(v){
  return String(v??"").replace(/[<>&'"]/g,ch=>({"<":"&lt;",">":"&gt;","&":"&amp;","'":"&apos;",'"':"&quot;"}[ch]));
}
function xlsCell(v,type="String"){
  if(type==="Number") return `<Cell><Data ss:Type="Number">${Number(v)||0}</Data></Cell>`;
  return `<Cell><Data ss:Type="String">${xmlEsc(v)}</Data></Cell>`;
}
function xlsRow(vals, numericIdx=[]){
  return "<Row>"+vals.map((v,i)=>xlsCell(v,numericIdx.includes(i)?"Number":"String")).join("")+"</Row>";
}
function exportarExcel(){
  const detalle=[];
  agendaRegistros.slice().sort((a,b)=>a.fecha.localeCompare(b.fecha)).forEach(r=>{
    partesRegistro(r).forEach(p=>detalle.push({
      fecha:r.fecha,obra:r.obraNombre||nombreObraPorId(r.obraId),
      persona:p.persona||nombrePersonaPorId(p.personaId),
      personaId:p.personaId||idPersonaPorNombre(p.persona)||nombreClave(p.persona),
      entrada:p.entrada||"",salida:p.salida||"",pausa:Number(p.pausaMin)||0,
      horas:Number(p.horas)||0,nota:r.nota||""
    }));
  });

  const porPersona=new Map();
  detalle.forEach(d=>{
    const k=d.personaId||nombreClave(d.persona);
    if(!porPersona.has(k)) porPersona.set(k,{nombre:d.persona,horas:0,jornadas:new Set(),obras:new Set()});
    const x=porPersona.get(k); x.horas+=d.horas; x.jornadas.add(d.fecha); x.obras.add(d.obra);
  });
  const resumenPersonas=[...porPersona.values()].sort((a,b)=>a.nombre.localeCompare(b.nombre,"es")).map(x=>[
    x.nombre,x.jornadas.size,x.obras.size,Math.round(x.horas*100)/100,
    x.jornadas.size?Math.round((x.horas/x.jornadas.size)*100)/100:0
  ]);

  const porObra=new Map();
  detalle.forEach(d=>{
    if(!porObra.has(d.obra)) porObra.set(d.obra,{nombre:d.obra,horas:0,dias:new Set(),personas:new Set(),partes:0});
    const x=porObra.get(d.obra); x.horas+=d.horas; x.dias.add(d.fecha); x.personas.add(d.personaId||nombreClave(d.persona)); x.partes++;
  });
  const resumenObras=[...porObra.values()].sort((a,b)=>a.nombre.localeCompare(b.nombre,"es")).map(x=>[
    x.nombre,x.dias.size,x.personas.size,Math.round(x.horas*100)/100,
    x.dias.size?Math.round((x.horas/x.dias.size)*100)/100:0
  ]);

  const detalleRows=[
    xlsRow(["Fecha","Obra","Persona","Entrada","Salida","Pausa (min)","Horas","Observación"]),
    ...detalle.map(d=>xlsRow([d.fecha,d.obra,d.persona,d.entrada,d.salida,d.pausa,d.horas,d.nota],[5,6]))
  ].join("");
  const personaRows=[
    xlsRow(["Persona","Días trabajados","Obras distintas","Total horas","Media horas/día"]),
    ...resumenPersonas.map(r=>xlsRow(r,[1,2,3,4]))
  ].join("");
  const obraRows=[
    xlsRow(["Obra","Días con registro","Personas distintas","Total horas","Media horas/día de obra"]),
    ...resumenObras.map(r=>xlsRow(r,[1,2,3,4]))
  ].join("");

  const xml=`<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Detalle horas"><Table>${detalleRows}</Table></Worksheet>
 <Worksheet ss:Name="Media por persona"><Table>${personaRows}</Table></Worksheet>
 <Worksheet ss:Name="Media por obra"><Table>${obraRows}</Table></Worksheet>
</Workbook>`;
  const blob=new Blob([xml],{type:"application/vnd.ms-excel;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url; a.download=`Horas_VilahexDoss_${hoyISO()}.xls`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}


document.getElementById("agendaObra")?.addEventListener("change",renderChecksPersonasAgenda);
document.getElementById("agendaFecha")?.addEventListener("change",renderChecksPersonasAgenda);
document.getElementById("agendaPersonas")?.addEventListener("input",actualizarTotalesFilas);
document.getElementById("agendaPersonas")?.addEventListener("change",actualizarTotalesFilas);
document.getElementById("btnRegistrarDia")?.addEventListener("click",()=>abrirAgendaModal(agendaDiaSeleccionado||hoyISO()));
document.getElementById("agendaPrev")?.addEventListener("click",()=>{agendaMesActual=new Date(agendaMesActual.getFullYear(),agendaMesActual.getMonth()-1,1);agendaDiaSeleccionado="";renderAgenda();});
document.getElementById("agendaNext")?.addEventListener("click",()=>{agendaMesActual=new Date(agendaMesActual.getFullYear(),agendaMesActual.getMonth()+1,1);agendaDiaSeleccionado="";renderAgenda();});
document.getElementById("agendaHoy")?.addEventListener("click",()=>{const h=new Date();agendaMesActual=new Date(h.getFullYear(),h.getMonth(),1);agendaDiaSeleccionado=hoyISO();renderAgenda();});
document.getElementById("agendaFiltroObra")?.addEventListener("change",()=>{agendaDiaSeleccionado="";renderAgenda();});
document.getElementById("agendaCalendario")?.addEventListener("click",e=>{const cell=e.target.closest("[data-agenda-date]");if(!cell)return;agendaDiaSeleccionado=cell.dataset.agendaDate;renderListaAgenda(agendaDiaSeleccionado);const f=document.getElementById("agendaFecha");if(f)f.value=agendaDiaSeleccionado;});
document.getElementById("agendaCalendario")?.addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target.matches("[data-agenda-date]")){e.preventDefault();agendaDiaSeleccionado=e.target.dataset.agendaDate;renderListaAgenda(agendaDiaSeleccionado);}});
document.getElementById("agendaListaDia")?.addEventListener("click",e=>{const b=e.target.closest("[data-agenda-delete]");if(!b)return;agendaRegistros=agendaRegistros.filter(r=>r.id!==b.dataset.agendaDelete);guardarAgenda();renderAgenda();});
document.getElementById("agendaForm")?.addEventListener("submit",e=>{
  e.preventDefault();
  const fecha=document.getElementById("agendaFecha").value;
  const obraId=document.getElementById("agendaObra").value;
  const partes=[...document.querySelectorAll('#agendaPersonas [data-person-row]')].filter(row=>row.querySelector('input[name="agendaPersona"]')?.checked).map(row=>{
    const persona=row.querySelector('input[name="agendaPersona"]').value;
    const personaId=row.dataset.personId||idPersonaPorNombre(persona)||"";
    const entrada=row.querySelector('.agenda-entrada').value;
    const salida=row.querySelector('.agenda-salida').value;
    const pausaMin=Math.max(0,Number(row.querySelector('.agenda-pausa').value)||0);
    return {personaId,persona,entrada,salida,pausaMin,horas:calcularHoras(entrada,salida,pausaMin)};
  });
  if(!fecha||!obraId){return;}
  if(!partes.length){alert("Marca al menos una persona que estuvo en la obra.");return;}
  if(partes.some(p=>!p.entrada||!p.salida)){alert("Indica la hora de entrada y salida de todas las personas marcadas.");return;}
  const personas=partes.map(p=>p.persona);
  const existente=agendaRegistros.findIndex(r=>r.fecha===fecha&&r.obraId===obraId);
  const registro={id:existente>=0?agendaRegistros[existente].id:"agenda-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,7),fecha,obraId,obraNombre:nombreObraPorId(obraId),personas,partes,nota:document.getElementById("agendaNota").value.trim()};
  if(existente>=0) agendaRegistros[existente]=registro; else agendaRegistros.push(registro);
  guardarAgenda();
  const d=new Date(fecha+"T12:00:00"); agendaMesActual=new Date(d.getFullYear(),d.getMonth(),1); agendaDiaSeleccionado=fecha;
  renderAgenda(); prepararRegistroHoras(fecha,true);
});


document.getElementById("personalForm")?.addEventListener("submit",e=>{
  e.preventDefault();
  const inp=document.getElementById("nuevoPersonalNombre");
  const nombre=inp?.value.trim()||"";
  if(!nombre) return;
  if(personal.some(p=>nombreClave(p.nombre)===nombreClave(nombre))){ alert("Esa persona ya está en la plantilla."); return; }
  const tipo=document.getElementById("nuevoPersonalTipo")?.value==="externo"?"externo":"interno";
  personal.push({id:crearPersonaId(),nombre,tipo});
  guardarPersonal();
  if(inp) inp.value="";
  renderPersonal(); render();
});
document.getElementById("personalMasterList")?.addEventListener("click",e=>{
  const b=e.target.closest("[data-delete-person]");
  if(b) borrarPersona(b.dataset.deletePerson);
});
document.getElementById("asignacionFecha")?.addEventListener("change",renderPersonal);
document.getElementById("asignacionObra")?.addEventListener("change",renderPersonal);
document.getElementById("guardarAsignacion")?.addEventListener("click",guardarAsignacionActual);
document.getElementById("btnExportarExcel")?.addEventListener("click",exportarExcel);


document.getElementById("maquinariaBuscar")?.addEventListener("input",renderMaquinaria);
document.getElementById("maquinariaEstado")?.addEventListener("change",renderMaquinaria);

document.getElementById("navObras")?.addEventListener("click",()=>mostrarVista("Obras"));
document.getElementById("navUrgencias")?.addEventListener("click",()=>mostrarVista("Urgencias"));
document.getElementById("navMaterial")?.addEventListener("click",()=>mostrarVista("Material"));
document.getElementById("navPersonal")?.addEventListener("click",()=>mostrarVista("Personal"));
document.getElementById("navMaquinaria")?.addEventListener("click",()=>mostrarVista("Maquinaria"));
document.getElementById("navAgenda")?.addEventListener("click",()=>mostrarVista("Agenda"));

document.getElementById("volverObrasUrgencias")?.addEventListener("click",()=>mostrarVista("Obras"));
document.getElementById("volverObrasMaterial")?.addEventListener("click",()=>mostrarVista("Obras"));
document.getElementById("volverObrasPersonal")?.addEventListener("click",()=>mostrarVista("Obras"));
document.getElementById("volverObrasMaquinaria")?.addEventListener("click",()=>mostrarVista("Obras"));
