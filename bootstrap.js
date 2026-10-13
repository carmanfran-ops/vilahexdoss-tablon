/* VilahexDoss — arranque con Supabase; la clave publishable es pública, NUNCA service_role. */
(()=>{
'use strict';
const URL_BASE='https://twhjprhhglukanfqfbhe.supabase.co';
const PUBLIC_KEY='sb_publishable_U97-fhcw50PWhr6fJ8HKPA_QpMiLnq9';
const KEYS=['tablon_obras_v1','tablon_agenda_v1','tablon_personal_v1','tablon_asignaciones_v1','tablon_maquinaria_v1'];
const msg=document.getElementById('vh-auth-message');
const info=document.getElementById('vh-sync-text');
const panel=document.getElementById('vh-sync');
const retry=document.getElementById('vh-retry');
let client, session, timer=null, saving=false, dirty=false, loaded=false;
function alertState(text,fail=false){panel.hidden=false;info.textContent=text;retry.hidden=!fail;}
function snapshot(){const out={};for(const k of KEYS){out[k]=JSON.parse(localStorage.getItem(k)||'[]');}return out;}
function dataHash(obj){return JSON.stringify(obj);}
async function save(){
 if(!loaded||!dirty||saving||!session)return;
 saving=true;
 try{
  do{
   dirty=false;const data=snapshot();
   const {error}=await client.from('app_state').upsert({user_id:session.user.id,data,updated_at:new Date().toISOString()},{onConflict:'user_id'});
   if(error)throw error;
  }while(dirty);
  alertState('Cambios guardados en Supabase');
 }catch(e){dirty=true;alertState('Sin sincronizar: '+(e.message||'Error de red')+'. No cierres esta pestaña antes de reintentar.',true);}
 finally{saving=false;}
}
function queue(){if(!loaded)return;dirty=true;alertState('Guardando cambios…');clearTimeout(timer);timer=setTimeout(save,650);}
function installWatcher(){
 const set=Storage.prototype.setItem, remove=Storage.prototype.removeItem;
 Storage.prototype.setItem=function(k,v){const r=set.call(this,k,v);if(this===localStorage&&KEYS.includes(k))queue();return r;};
 Storage.prototype.removeItem=function(k){const r=remove.call(this,k);if(this===localStorage&&KEYS.includes(k))queue();return r;};
}
async function openApp(nextSession){
 if(loaded)return;
 session=nextSession;
 msg.textContent='Cargando tus datos de Supabase…';
 const {data,error}=await client.from('app_state').select('data').eq('user_id',session.user.id).maybeSingle();
 if(error)throw error;
 const stored=(data&&data.data&&typeof data.data==='object')?data.data:{};
 for(const k of KEYS){
  const value=Array.isArray(stored[k])?stored[k]:[];
  localStorage.setItem(k,JSON.stringify(value));
 }
 // Los scripts de la app original se activan SOLO después de cargar los datos del usuario.
 installWatcher();
 await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='app.js';s.onload=resolve;s.onerror=()=>reject(new Error('No se pudo cargar app.js'));document.body.appendChild(s);});
 loaded=true;
 document.body.classList.add('vh-ready');
 document.getElementById('vh-auth').classList.add('hidden');
 alertState('Sesión: '+session.user.email+' · Datos cargados');
}
async function start(){
 try{
  if(!window.supabase?.createClient)throw new Error('No se pudo descargar la librería Supabase. Comprueba tu conexión.');
  client=window.supabase.createClient(URL_BASE,PUBLIC_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const {data,error}=await client.auth.getSession();if(error)throw error;
  if(data.session)await openApp(data.session);else msg.textContent='Introduce tu correo y contraseña.';
 }catch(e){msg.textContent='Error: '+(e.message||e);}
}
document.getElementById('vh-login-form').addEventListener('submit',async e=>{
 e.preventDefault();if(!client)return;
 msg.textContent='Comprobando credenciales…';
 const {data,error}=await client.auth.signInWithPassword({email:document.getElementById('vh-email').value.trim(),password:document.getElementById('vh-password').value});
 if(error){msg.textContent='No se pudo entrar: '+error.message;return;}
 try{await openApp(data.session);}catch(err){msg.textContent='Error de lectura: '+err.message;}
});
document.getElementById('vh-register').addEventListener('click',async()=>{
 if(!client)return;
 const email=document.getElementById('vh-email').value.trim(),password=document.getElementById('vh-password').value;
 if(!email||password.length<6){msg.textContent='Introduce correo y contraseña de al menos 6 caracteres.';return;}
 msg.textContent='Creando cuenta…';
 const {data,error}=await client.auth.signUp({email,password,options:{emailRedirectTo:location.origin+location.pathname}});
 if(error){msg.textContent='Error al crear cuenta: '+error.message;return;}
 if(data.session){try{await openApp(data.session);}catch(e){msg.textContent=e.message;}}
 else msg.textContent='Revisa tu correo para confirmar la cuenta. Después vuelve aquí e inicia sesión.';
});
document.getElementById('vh-retry').addEventListener('click',()=>{if(dirty)save();});
document.getElementById('vh-signout').addEventListener('click',async()=>{
 if(dirty){await save();if(dirty){alert('Hay cambios sin guardar. Reintenta cuando tengas conexión.');return;}}
 await client.auth.signOut();for(const k of KEYS)localStorage.removeItem(k);location.reload();
});
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
start();
})();
