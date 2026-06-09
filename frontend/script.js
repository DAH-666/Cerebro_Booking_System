const GOOGLE_CLIENT_ID = 'TU_CLIENT_ID.apps.googleusercontent.com'; 
const ALLOWED_DOMAINS = ['@dom1', '@dom2', '@dom3']; 
const CENTRAL_CALENDAR_ID = 'TU_EMAIL_DE_CALENDARIO_AQUI'; 
const GAS_WEBAPP_URL = 'URL_DE_TU_APPS_SCRIPT_AQUI'; 


const dateInput = document.getElementById('bookingDate');
const today = new Date().toISOString().split('T')[0];
if(dateInput) dateInput.setAttribute('min', today);

let tokenClient;
let gapiAccessToken = null;
let currentUserInfo = null;

const loginSection = document.getElementById('loginSection');
const bookingForm = document.getElementById('bookingForm');
const loginError = document.getElementById('loginError');

window.onload = function () {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
        callback: async (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
                await validateUser(tokenResponse.access_token);
            }
        },
    });
};

async function validateUser(token) {
    loginError.classList.add('hidden');
    document.getElementById('powerLed').className = "led-indicator led-warn animate-pulse";
    document.getElementById('screenStatus').textContent = "AUTH_CHECK...";

    try {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const userInfo = await response.json();
        const userEmail = userInfo.email.toLowerCase();
        const hasAccess = ALLOWED_DOMAINS.some(domain => userEmail.includes(domain));

        if (!hasAccess && GOOGLE_CLIENT_ID !== 'TU_CLIENT_ID_AQUI.apps.googleusercontent.com') {
            loginError.innerHTML = `> [SYS.ERR] ACCESO DENEGADO.<br>> DOMINIO NO AUTORIZADO.`;
            loginError.classList.remove('hidden');
            document.getElementById('powerLed').className = "led-indicator led-error";
            document.getElementById('screenStatus').textContent = "AUTH_FAILED";
            google.accounts.oauth2.revoke(token, () => {});
            gapiAccessToken = null;
            currentUserInfo = null;
        } else {
            gapiAccessToken = token;
            currentUserInfo = userInfo;
            showBookingForm(userInfo);
        }
    } catch (error) {
        console.error("Error validando usuario:", error);
        loginError.innerHTML = `> [SYS.ERR] ERROR DE CONEXIÓN CON GOOGLE.`;
        loginError.classList.remove('hidden');
        document.getElementById('powerLed').className = "led-indicator led-error";
    }
}

document.getElementById('googleLoginBtn').addEventListener('click', () => {
    if (GOOGLE_CLIENT_ID === 'TU_CLIENT_ID_AQUI.apps.googleusercontent.com') {
        gapiAccessToken = "SIMULATED_TOKEN";
        currentUserInfo = { name: "Manager", email: "manager@administrador.com", picture: "" };
        showBookingForm(currentUserInfo);
        return;
    }
    tokenClient.requestAccessToken();
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    if (gapiAccessToken && gapiAccessToken !== "SIMULATED_TOKEN") {
        google.accounts.oauth2.revoke(gapiAccessToken, () => {});
    }
    gapiAccessToken = null;
    currentUserInfo = null;
    bookingForm.classList.add('hidden');
    loginSection.classList.remove('hidden');
    loginError.classList.add('hidden');
    
    // Reseteo visual OLED
    document.getElementById('screenStatus').textContent = "WAITING_AUTH";
    document.getElementById('screenStatus').className = "font-mono-te text-[10px] tracking-widest uppercase";
    document.getElementById('powerLed').className = "led-indicator";
    document.getElementById('screenUser').textContent = "> PLEASE LOGIN";
    document.getElementById('teConsole').classList.add('hidden');
});

function showBookingForm(userInfo) {
    loginSection.classList.add('hidden');
    bookingForm.classList.remove('hidden');
    
    // Actualización Visual OLED
    document.getElementById('screenStatus').textContent = "SYSTEM READY";
    document.getElementById('screenStatus').className = "font-mono-te text-[10px] tracking-widest uppercase text-[#10B981]";
    document.getElementById('powerLed').className = "led-indicator led-on";
    const shortEmail = userInfo.email.split('@')[0] + '@...';
    document.getElementById('screenUser').innerHTML = `> USER: <span style="color:#fff;">${shortEmail}</span>`;
    
    filterCompaniesByEmail(userInfo.email);
}

function filterCompaniesByEmail(email) {
    const select = document.getElementById('companySelect');
    select.innerHTML = '<option value="" disabled selected>SEL...</option>';

    const allCompanies = [
        { name: 'Compañía 1', group: '@dom1' },
        { name: 'Compañía 2', group: '@dom2' },
        { name: 'Compañía 3', group: '@dom3' },
        { name: 'Editorial 1', group: '@dom1' },
        { name: 'Editorial 2', group: '@dom2' }, 
    ];

    let allowed = [];
    const userEmail = email.toLowerCase();
    
    if (userEmail.includes('@administrador')) allowed = allCompanies; 
    else if (userEmail.includes('@dom1')) allowed = allCompanies.filter(c => c.group === '@dom1' || c.group === 'all');
    else if (userEmail.includes('@dom2')) allowed = allCompanies.filter(c => c.group === '@dom2' || c.group === 'all');
    else allowed = allCompanies.filter(c => c.group === 'all'); 

    allowed.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.name;
        opt.textContent = c.name;
        select.appendChild(opt);
    });
}


const form = document.getElementById('bookingForm');
const submitBtn = document.getElementById('submitBtn');

form.addEventListener('submit', async function(e) {
    e.preventDefault();

    if (GAS_WEBAPP_URL === 'PEGAR_AQUI_LA_URL_DEL_SCRIPT_DE_GOOGLE' && gapiAccessToken !== "SIMULATED_TOKEN") {
        alert("Falta GAS_WEBAPP_URL."); return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="loader-spinner"></span>`;
    document.getElementById('screenStatus').textContent = "PROCESSING...";
    document.getElementById('teConsole').classList.add('hidden');

    const date = document.getElementById('bookingDate').value;
    const start = document.getElementById('timeStart').value;
    const end = document.getElementById('timeEnd').value;
    const artist = document.getElementById('artistName').value;
    const company = document.getElementById('companySelect').value;
    const studio = document.getElementById('studioSelect').value;
    const extraRoom = document.getElementById('extraRoomSelect').value;
    const extraRoomContainer = document.getElementById('extraRoomContainer');
    const isOutsideHours = !document.getElementById('extendedHoursAlert').classList.contains('hidden');

    const hasExtraRoom = !extraRoomContainer.classList.contains('hidden');
    const includesSuite = hasExtraRoom && extraRoom && extraRoom.includes('Suite de producción');
    
    let finalLocation = studio;
    if (hasExtraRoom && extraRoom && !extraRoom.includes('sin sala de grabacion')) {
        finalLocation += includesSuite ? ' + Suite de producción' : ` - ${extraRoom}`;
    }

    const startDateTime = new Date(`${date}T${start}:00`).toISOString();
    const endDateObj = new Date(`${date}T${end}:00`);
    if (end < start) endDateObj.setDate(endDateObj.getDate() + 1);
    const endDateTime = endDateObj.toISOString();

    try {
        let occupiedStudios = new Set(); 
        
        if (gapiAccessToken !== "SIMULATED_TOKEN") {
            const timeMin = new Date(`${date}T00:00:00`).toISOString();
            const timeMax = new Date(`${date}T23:59:59`).toISOString();
            
            const calResponse = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CENTRAL_CALENDAR_ID)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true`, {
                headers: { 'Authorization': `Bearer ${gapiAccessToken}` }
            });

            if (!calResponse.ok) throw new Error(`Google Calendar API bloqueada. Desconecta y vuelve a entrar.`);
            const calData = await calResponse.json();
            
            let conflictingEvent = null;
            const rStart = new Date(startDateTime).getTime();
            const rEnd = new Date(endDateTime).getTime();

            for (const evt of (calData.items || [])) {
                if (!evt.start || !evt.end || evt.status === 'cancelled') continue;
                
                const eStart = new Date(evt.start.dateTime || evt.start.date).getTime();
                const eEnd = new Date(evt.end.dateTime || evt.end.date).getTime();
                
                if (rStart < eEnd && eStart < rEnd) {
                    const evtLoc = evt.location || "";
                    let locationConflict = false;
                    
                    if (evtLoc.includes(studio)) locationConflict = true;
                    if (hasExtraRoom && extraRoom && !extraRoom.includes('sin sala de grabacion')) {
                        if (includesSuite && evtLoc.includes('Suite de producción')) locationConflict = true;
                        if (!includesSuite && evtLoc.includes(extraRoom)) locationConflict = true;
                    }
                    if (locationConflict) { conflictingEvent = evt; break; }
                }

                if (evt.summary && evt.summary.includes(company)) {
                    let loc = evt.location || "";
                    if (loc && !(loc.includes('Suite de producción') && evt.description && evt.description.includes('reserva paralela en'))) {
                        occupiedStudios.add(loc);
                    }
                }
            }

            if (conflictingEvent) {
                const cStart = new Date(conflictingEvent.start.dateTime || conflictingEvent.start.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                const cEnd = new Date(conflictingEvent.end.dateTime || conflictingEvent.end.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                showStatus('error', `ESPACIO OCUPADO: ${cStart} - ${cEnd}`);
                restoreButton(); return; 
            }
        }

        let newStudios = new Set(occupiedStudios);
        newStudios.add(studio); 
        let limit = Infinity;
        if (company === 'Compañía 1') limit = 2;
        if (company.includes('Compañía 2')) limit = 1;

        let exceptionReason = null;
        if (isOutsideHours) exceptionReason = "HORARIO ESPECIAL / FUERA DE JORNADA / FIN DE SEMANA.";
        else if (newStudios.size > limit) exceptionReason = `LÍMITE COMPAÑÍA EXCEDIDO. MAX: ${limit}. EN USO: ${Array.from(occupiedStudios).join(', ')}.`;

        let baseDescription = `Reserva gestionada vía Cerebro por ${currentUserInfo.email}.\n\nArtista: ${artist}\nCompañía: ${company}`;
        let eventsToCreate = [];

        if (includesSuite) {
            eventsToCreate.push({ summary: `${artist} - ${company}`, location: studio, description: baseDescription + `\n\n🔗 NOTA: Esta sesión se realiza en conjunto con una reserva paralela en la Suite de producción.`, start: { dateTime: startDateTime }, end: { dateTime: endDateTime } });
            eventsToCreate.push({ summary: `${artist} - ${company}`, location: 'Suite de producción', description: baseDescription + `\n\n🔗 NOTA: Esta sesión se realiza en conjunto con una reserva paralela en ${studio}.`, start: { dateTime: startDateTime }, end: { dateTime: endDateTime } });
        } else {
            eventsToCreate.push({ summary: `${artist} - ${company}`, location: finalLocation, description: baseDescription, start: { dateTime: startDateTime }, end: { dateTime: endDateTime } });
        }

        if (exceptionReason) {
            const payload = { events: eventsToCreate, pmEmail: currentUserInfo.email, isOutsideHours: true, exceptionReason: exceptionReason };
            await fetch(GAS_WEBAPP_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
            showStatus('warn', `PETICIÓN EXCEPCIONAL REGISTRADA.<br>> MOTIVO: ${exceptionReason}<br>> ENVIADA A ADMIN PARA REVISIÓN.`);
            restoreButton(); return;
        }

        if (gapiAccessToken === "SIMULATED_TOKEN") {
            await new Promise(resolve => setTimeout(resolve, 1500));
            showStatus('success', `DATOS ESCRITOS EN BD (SIMULACIÓN).`);
        } else {
            const payload = { events: eventsToCreate, pmEmail: currentUserInfo.email };
            await fetch(GAS_WEBAPP_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
            showStatus('success', `DATOS TRANSFERIDOS. EVENTO(S) CREADO(S) EN CALENDARIO.`);
        }
        
        form.reset();
        extraRoomContainer.classList.add('hidden');
        document.getElementById('extraRoomSelect').removeAttribute('required');
        document.getElementById('extendedHoursAlert').classList.add('hidden');
    } catch (error) {
        showStatus('error', `FATAL ERROR: ${error.message}`);
    }
    restoreButton();
});

function restoreButton() {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<i class="fa-solid fa-bolt" id="btnIcon"></i> <span id="btnText">ENVIAR</span>`;
}

function showStatus(type, text) {
    const consoleBox = document.getElementById('teConsole');
    consoleBox.className = "te-console"; // Reset classes
    consoleBox.classList.remove('hidden');
    
    if (type === 'success') {
        document.getElementById('screenStatus').textContent = "SYNC_OK";
        document.getElementById('screenStatus').className = "font-mono-te text-[10px] tracking-widest uppercase text-[#10B981]";
        consoleBox.innerHTML = `> [SYS.OK] ${text}`;
    } else if (type === 'error'){
        document.getElementById('screenStatus').textContent = "ERROR";
        document.getElementById('screenStatus').className = "font-mono-te text-[10px] tracking-widest uppercase text-[#EF4444]";
        consoleBox.classList.add('error');
        consoleBox.innerHTML = `> [SYS.ERR] ${text}`;
    } else if (type === 'warn') {
        document.getElementById('screenStatus').textContent = "REQ_AUTH";
        document.getElementById('screenStatus').className = "font-mono-te text-[10px] tracking-widest uppercase text-[#F59E0B]";
        document.getElementById('powerLed').className = "led-indicator led-warn";
        consoleBox.classList.add('warn');
        consoleBox.innerHTML = `> [SYS.WARN] ${text}`;
    }
}

const studioSelectEl = document.getElementById('studioSelect');
const extraRoomContainerEl = document.getElementById('extraRoomContainer');
const extraRoomSelectEl = document.getElementById('extraRoomSelect');

studioSelectEl.addEventListener('change', function() {
    if (this.value === 'Control 1' || this.value === 'Control 2 + Sala B') {
        extraRoomContainerEl.classList.remove('hidden');
        extraRoomSelectEl.setAttribute('required', 'required'); 
    } else {
        extraRoomContainerEl.classList.add('hidden');
        extraRoomSelectEl.removeAttribute('required');
        extraRoomSelectEl.value = ''; 
    }
});

const timeStartInput = document.getElementById('timeStart');
const timeEndInput = document.getElementById('timeEnd');
const extendedHoursAlert = document.getElementById('extendedHoursAlert');

function checkExtendedHours() {
    const start = timeStartInput.value;
    const end = timeEndInput.value;
    const dateVal = document.getElementById('bookingDate').value;
    let isOutsideHours = false;

    if (start && start < "10:00") isOutsideHours = true;
    if (end && (end > "22:00" || (start && end < start))) isOutsideHours = true;
    if (dateVal) {
        const [y, m, d] = dateVal.split('-');
        const day = new Date(y, m - 1, d).getDay();
        if (day === 0 || day === 6) isOutsideHours = true;
    }

    if (isOutsideHours) extendedHoursAlert.classList.remove('hidden');
    else extendedHoursAlert.classList.add('hidden');
}

timeStartInput.addEventListener('change', checkExtendedHours);
timeEndInput.addEventListener('change', checkExtendedHours);
document.getElementById('bookingDate').addEventListener('change', checkExtendedHours);