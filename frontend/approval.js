
// SCRIPT PARA EL PORTAL DE APROBACIONES (TE ESTÉTICA)

const GAS_WEBAPP_URL = 'URL_DE_TU_APPS_SCRIPT_AQUI';

document.addEventListener('DOMContentLoaded', () => {
    const loadingSection = document.getElementById('loadingSection');
    const approvalForm = document.getElementById('approvalForm');
    const approveBtn = document.getElementById('approveBtn');
    const rejectBtn = document.getElementById('rejectBtn');
    const actionButtons = document.getElementById('actionButtons');
    
    const artistNameInput = document.getElementById('artistName');
    const companySelect = document.getElementById('companySelect'); 
    const studioSelect = document.getElementById('studioSelect');
    const bookingDateInput = document.getElementById('bookingDate');
    const timeStartInput = document.getElementById('timeStart');
    const timeEndInput = document.getElementById('timeEnd');
    const pmEmailInput = document.getElementById('pmEmail');

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        showStatus('error', 'NO TOKEN. ENLACE CADUCADO O ROTO.');
        loadingSection.classList.add('hidden');
        approvalForm.classList.remove('hidden');
        actionButtons.classList.add('hidden');
        return;
    }

    // CARGA DE DATOS
    fetch(`${GAS_WEBAPP_URL}?action=getSessionData&token=${token}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'error') throw new Error(data.message);
            
            artistNameInput.value = data.artistName || '';
            companySelect.value = data.company || ''; 
            studioSelect.value = data.studio || '';
            bookingDateInput.value = data.bookingDate || '';
            timeStartInput.value = data.timeStart || '';
            timeEndInput.value = data.timeEnd || '';
            pmEmailInput.value = data.pmEmail || '';
            
            document.getElementById('screenStatus').textContent = "REQ_AUTH";
            document.getElementById('screenStatus').className = "font-mono-te text-[10px] tracking-widest uppercase text-[#F59E0B]";
            document.getElementById('screenUser').innerHTML = `> WAITING ADMIN ACTION`;
            
            loadingSection.classList.add('hidden');
            approvalForm.classList.remove('hidden');
        })
        .catch(error => {
            showStatus('error', `AVISO: ${error.message}`);
            loadingSection.classList.add('hidden');
            approvalForm.classList.remove('hidden');
            actionButtons.classList.add('hidden');
        });

    function sendStatusUpdate(statusAction) {
        approveBtn.disabled = true;
        rejectBtn.disabled = true;
        actionButtons.classList.add('opacity-50', 'pointer-events-none');
        document.getElementById('screenStatus').textContent = "PROCESSING...";
        document.getElementById('teConsole').classList.add('hidden');

        const startDateTimeObj = new Date(`${bookingDateInput.value}T${timeStartInput.value}:00`);
        const endDateTimeObj = new Date(`${bookingDateInput.value}T${timeEndInput.value}:00`);
        if (timeEndInput.value < timeStartInput.value) endDateTimeObj.setDate(endDateTimeObj.getDate() + 1);
        
        const newEventData = {
            summary: `${artistNameInput.value} - ${companySelect.value}`,
            location: studioSelect.value,
            description: `(Reserva solicitada por ${pmEmailInput.value} y aprobada vía Cerebro)`,
            start: { dateTime: startDateTimeObj.toISOString() },
            end: { dateTime: endDateTimeObj.toISOString() }
        };

        const payload = { action: 'updateSessionStatus', token: token, status: statusAction, pmEmail: pmEmailInput.value, events: [newEventData] };

        fetch(GAS_WEBAPP_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        .then(() => {
            actionButtons.classList.add('hidden');
            if(statusAction === 'approve') showStatus('success', 'AUTORIZADO. EVENTO ESCRITO EN BD.');
            else showStatus('warn', 'RECHAZADO. PETICIÓN ELIMINADA.');
        })
        .catch(error => {
            showStatus('error', 'ERROR DE CONEXIÓN. REINTENTANDO...');
            actionButtons.classList.remove('opacity-50', 'pointer-events-none');
            approveBtn.disabled = false;
            rejectBtn.disabled = false;
        });
    }

    approveBtn.addEventListener('click', () => sendStatusUpdate('approve'));
    rejectBtn.addEventListener('click', () => sendStatusUpdate('reject'));

    function showStatus(type, text) {
        const consoleBox = document.getElementById('teConsole');
        consoleBox.className = "te-console"; 
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
            document.getElementById('screenStatus').textContent = "DENIED";
            document.getElementById('screenStatus').className = "font-mono-te text-[10px] tracking-widest uppercase text-[#F59E0B]";
            consoleBox.classList.add('warn');
            consoleBox.innerHTML = `> [SYS.WARN] ${text}`;
        }
    }
});