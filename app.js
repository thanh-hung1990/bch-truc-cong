import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const $ = id => document.getElementById(id);
const state = { user:null, role:"member", students:[], records:[], selected:new Set(), page:"dashboard" };
const TYPES = {late:"Đi học muộn",uniform:"Vi phạm đồng phục",helmet:"Không đội mũ bảo hiểm"};
const CLASSES = Array.from({length:12},(_,i)=>`10A${i+1}`).concat(Array.from({length:8},(_,i)=>`11A${i+1}`),Array.from({length:8},(_,i)=>`12A${i+1}`));

function toast(message){const el=$("toast");el.textContent=message;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2800)}
function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function localDate(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function weekNumber(dateStr){const d=new Date(dateStr+"T00:00:00");const first=new Date(d.getFullYear(),0,1);return Math.ceil((((d-first)/86400000)+first.getDay()+1)/7)}
function showPage(page){state.page=page;document.querySelectorAll(".page").forEach(p=>p.classList.add("hidden"));$(`page-${page}`).classList.remove("hidden");document.querySelectorAll(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.page===page));$("pageTitle").textContent=({dashboard:"Tổng quan",record:"Ghi nhận vi phạm",records:"Sổ vi phạm",students:"Danh sách học sinh"})[page];$("sidebar")?.classList.remove("open");if(page==="dashboard")renderDashboard();if(page==="records")renderRecords();if(page==="students")renderStudents();if(page==="record")renderPicker()}
function setClasses(){["classFilter","filterClass"].forEach(id=>{const el=$(id);el.innerHTML='<option value="">Tất cả lớp</option>'+CLASSES.map(c=>`<option>${c}</option>`).join("")})}
async function loadData(){
  const [ss,rs]=await Promise.all([getDocs(query(collection(db,"students"),orderBy("name"))),getDocs(query(collection(db,"violations"),orderBy("createdAt","desc")))]);
  state.students=ss.docs.map(d=>({id:d.id,...d.data()}));state.records=rs.docs.map(d=>({id:d.id,...d.data()}));
  renderDashboard();renderRecords();renderStudents();renderPicker();
}
function renderDashboard(){
  const r=state.records; $("statTotal").textContent=r.length;$("statLate").textContent=r.filter(x=>x.type==="late").length;$("statUniform").textContent=r.filter(x=>x.type==="uniform").length;$("statHelmet").textContent=r.filter(x=>x.type==="helmet").length;
  const max=Math.max(1,...Object.keys(TYPES).map(k=>r.filter(x=>x.type===k).length));
  $("typeBars").innerHTML=Object.entries(TYPES).map(([k,v])=>{const n=r.filter(x=>x.type===k).length;return `<div class="bar-line"><span>${v}</span><div class="bar-track"><div class="bar-fill" style="width:${n/max*100}%"></div></div><b>${n}</b></div>`}).join("");
  $("recentRows").innerHTML=r.slice(0,8).map(x=>`<tr><td>${esc(x.date||"")}</td><td>${esc(x.studentName)}</td><td>${esc(x.className)}</td><td>${esc(TYPES[x.type]||x.type)}</td><td>${esc(x.team||"")}</td></tr>`).join("")||'<tr><td colspan="5" class="empty">Chưa có dữ liệu</td></tr>';
}
function renderPicker(){
  if(!$("studentPicker"))return;
  const cls=$("classFilter").value, term=$("studentSearch").value.trim().toLowerCase();
  const list=state.students.filter(s=>(!cls||s.className===cls)&&(!term||`${s.name} ${s.code||""} ${s.className}`.toLowerCase().includes(term)));
  $("studentPicker").innerHTML=list.map(s=>`<label class="student-option"><input type="checkbox" data-student="${s.id}" ${state.selected.has(s.id)?"checked":""}><span>${esc(s.name)} <small>· ${esc(s.className)}</small></span><small>${esc(s.code||"")}</small></label>`).join("")||'<p class="empty">Không tìm thấy học sinh phù hợp.</p>';
  $("studentCount").textContent=`${state.selected.size} học sinh được chọn`;
  $("studentPicker").querySelectorAll("input").forEach(c=>c.addEventListener("change",()=>{c.checked?state.selected.add(c.dataset.student):state.selected.delete(c.dataset.student);$("studentCount").textContent=`${state.selected.size} học sinh được chọn`}));
}
function filteredRecords(){
  const from=$("filterFrom").value,to=$("filterTo").value,type=$("filterType").value,cls=$("filterClass").value;
  return state.records.filter(x=>(!from||x.date>=from)&&(!to||x.date<=to)&&(!type||x.type===type)&&(!cls||x.className===cls));
}
function renderRecords(){
  const rows=filteredRecords();$("recordRows").innerHTML=rows.map(x=>`<tr><td>${esc(x.date||"")}</td><td>${esc(x.week||"")}</td><td>${esc(x.studentName)}</td><td>${esc(x.className)}</td><td>${esc(TYPES[x.type]||x.type)}</td><td>${esc(x.team||"")}</td><td>${esc(x.note||"")}</td></tr>`).join("")||'<tr><td colspan="7" class="empty">Không có dữ liệu phù hợp</td></tr>';
}
function renderStudents(){
  const term=$("studentListSearch").value.trim().toLowerCase(),list=state.students.filter(s=>`${s.name} ${s.className} ${s.code||""}`.toLowerCase().includes(term));
  $("studentTotal").textContent=`${state.students.length} học sinh`;
  $("studentsRows").innerHTML=list.map((s,i)=>`<tr><td>${i+1}</td><td>${esc(s.code||"—")}</td><td>${esc(s.name)}</td><td>${esc(s.className)}</td></tr>`).join("")||'<tr><td colspan="4" class="empty">Chưa có danh sách học sinh</td></tr>';
}
$("loginForm").addEventListener("submit",async e=>{e.preventDefault();$("loginMessage").textContent="";try{await signInWithEmailAndPassword(auth,$("loginEmail").value.trim(),$("loginPassword").value)}catch(err){$("loginMessage").textContent="Không đăng nhập được. Vui lòng kiểm tra email, mật khẩu và cấu hình Firebase."}});
$("logoutBtn").addEventListener("click",()=>signOut(auth));
onAuthStateChanged(auth,async user=>{
  state.user=user;
  $("loginView").classList.toggle("hidden",!!user);$("appView").classList.toggle("hidden",!user);
  if(user){$("userEmail").textContent=user.email||"Tài khoản";try{const snap=await getDocs(collection(db,"users"));const profile=snap.docs.find(d=>d.id===user.uid);state.role=profile?.data()?.role||"member";$("userRole").textContent=state.role==="admin"?"Quản trị viên":"Thành viên BCH";await loadData()}catch(e){toast("Không tải được dữ liệu. Kiểm tra cấu hình và quyền Firestore.");console.error(e)}}
});
document.querySelectorAll(".nav-link").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.page)));
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.go)));
$("mobileMenu").addEventListener("click",()=>document.querySelector(".sidebar").classList.toggle("open"));
$("classFilter").addEventListener("change",renderPicker);$("studentSearch").addEventListener("input",renderPicker);
$("recDate").value=localDate();$("recWeek").value=`Tuần ${weekNumber(localDate())}`;$("recDate").addEventListener("change",()=>{$("recWeek").value=`Tuần ${weekNumber($("recDate").value)}`});
$("recordForm").addEventListener("submit",async e=>{
  e.preventDefault();const type=$("recType").value,ids=[...state.selected];if(!type){$("recordMessage").textContent="Vui lòng chọn lỗi vi phạm.";return}if(!ids.length){$("recordMessage").textContent="Vui lòng chọn ít nhất một học sinh.";return}
  const students=state.students.filter(s=>state.selected.has(s.id));const btn=e.submitter;btn.disabled=true;btn.textContent="Đang gửi...";
  try{const batch=students.map(s=>addDoc(collection(db,"violations"),{team:$("recTeam").value.trim(),week:$("recWeek").value.trim(),date:$("recDate").value,type,studentId:s.id,studentName:s.name,className:s.className,studentCode:s.code||"",note:$("recNote").value.trim(),createdBy:state.user.uid,createdByEmail:state.user.email||"",createdAt:serverTimestamp()}));await Promise.all(batch);state.selected.clear();$("recNote").value="";$("recordMessage").textContent="";toast(`Đã gửi ${students.length} lượt ghi nhận.`);await loadData();showPage("records")}catch(err){console.error(err);$("recordMessage").textContent="Gửi dữ liệu thất bại. Kiểm tra kết nối và quyền Firestore."}finally{btn.disabled=false;btn.textContent="↗ Gửi kết quả ghi nhận"}
});
$("studentForm").addEventListener("submit",async e=>{e.preventDefault();try{await addDoc(collection(db,"students"),{name:$("studentName").value.trim(),className:$("studentClass").value.trim().toUpperCase(),code:$("studentCode").value.trim(),createdAt:serverTimestamp()});e.target.reset();await loadData();toast("Đã thêm học sinh.")}catch(err){toast("Không thêm được học sinh. Kiểm tra quyền truy cập.")}});
$("studentListSearch").addEventListener("input",renderStudents);
["filterFrom","filterTo","filterType","filterClass"].forEach(id=>$(id).addEventListener("change",renderRecords));
$("clearFilters").addEventListener("click",()=>{["filterFrom","filterTo","filterType","filterClass"].forEach(id=>$(id).value="");renderRecords()});
$("exportBtn").addEventListener("click",()=>{const rows=filteredRecords();const headers=["Ngay","Tuan","HoTen","Lop","MaHocSinh","LoiViPham","BCH_NguoiTruc","GhiChu"];const data=rows.map(x=>[x.date,x.week,x.studentName,x.className,x.studentCode,TYPES[x.type],x.team,x.note]);const csv=[headers,...data].map(row=>row.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\r\n");const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`so_vi_pham_${localDate()}.csv`;a.click();URL.revokeObjectURL(a.href)});
$("downloadTemplate").addEventListener("click",()=>{const csv="\ufeffHoTen,Lop,MaHocSinh\r\nNguyen Van A,10A1,HS001\r\nTran Thi B,10A1,HS002";const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));a.download="mau_danh_sach_hoc_sinh.csv";a.click();URL.revokeObjectURL(a.href)});
$("csvInput").addEventListener("change",async e=>{const file=e.target.files[0];if(!file)return;const text=await file.text();const lines=text.replace(/^\uFEFF/,"").split(/\r?\n/).filter(Boolean);const rows=lines.slice(1).map(line=>{const cells=line.split(",").map(x=>x.trim().replace(/^"|"$/g,""));return {name:cells[0],className:(cells[1]||"").toUpperCase(),code:cells[2]||""}}).filter(x=>x.name&&x.className);if(!rows.length){toast("Không tìm thấy dòng dữ liệu hợp lệ.");return}try{for(const s of rows)await addDoc(collection(db,"students"),{...s,createdAt:serverTimestamp()});await loadData();toast(`Đã nhập ${rows.length} học sinh.`)}catch(err){toast("Nhập danh sách thất bại. Kiểm tra quyền Firestore.")}e.target.value=""});
setClasses();
