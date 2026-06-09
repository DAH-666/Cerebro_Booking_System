
// SCRIPT DE MODIFICACIÓN DE RESERVAS


const GAS_WEBAPP_URL = 'URL_DE_TU_APPS_SCRIPT_AQUI';

document.addEventListener('DOMContentLoaded', () => {
    const loadingSection = document.getElementById('loadingSection');
    const modificationForm = document.getElementById('modificationForm');
    const submitBtn = document.getElementById('submitBtn');
    
    const eventIdsInput = document.getElementById('eventIds');
    const artistNameInput = document.getElementById('artistName');
    const companySelect = document.getElementById('companySelect'); 
    const pmEmailInput = document.getElementById('pmEmail');
    const pmEmailContainer = document.getElementById('pmEmailContainer');
    const studioSelect = document.getElementById('studioSelect');
    const bookingDateInput = document.getElementById('bookingDate');
    const timeStartInput = document.getElementById('timeStart');
    const timeEndInput = document.getElementById('timeEnd');

    const urlParams = new URLSearchParams(window.location.search);
    const idsToModify = urlParams.get('ids') || urlParams.get('modify');
    const pmEmailParam = urlParams.get('pm');

    if (!idsToModify) {
        showStatus('error', 'NO SE ENCONTRÓ EVENT_ID. ENLACE INVÁLIDO.');
        loadingSection.classList.add('hidden');
        modificationForm.classList.remove('hidden');
        submitBtn.disabled = true;
        return;
    }

    if (pmEmailParam) pmEmailInput.value = pmEmailParam;
    else { pmEmailContainer.classList.remove('hidden'); pmEmailInput.required = true; }

    eventIdsInput.value = idsToModify;

    // CARGA DE DATOS AL SERVIDOR
    fetch(`${GAS_WEBAPP_URL}?action=getEventDetails&ids=${idsToModify}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'error') throw new Error(data.message);
            
            artistNameInput.value = data.artist || '';
            companySelect.innerHTML = `<option value="${data.company}" selected>${data.company}</option>`;
            studioSelect.value = data.location || '';
            bookingDateInput.value = data.date || '';
            timeStartInput.value = data.timeStart || '';
            timeEndInput.value = data.timeEnd || '';
            
            document.getElementById('screenStatus').textContent = "SYSTEM READY";
            document.getElementById('screenStatus').className = "font-mono-te text-[10px] tracking-widest uppercase text-[#10B981]";
            document.getElementById('screenUser').innerHTML = `> MODIFYING DATA_`;
            
            loadingSection.classList.add('hidden');
            modificationForm.classList.remove('hidden');
        })
        .catch(error => {
            showStatus('error', `ERROR DE CARGA: ${error.message}`);
            loadingSection.classList.add('hidden');
            modificationForm.classList.remove('hidden');
            submitBtn.disabled = true;
        });

    modificationForm.addEventListener('submit', function(e) {
        e.preventDefault();

        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="loader-spinner"></span>`;
        document.getElementById('screenStatus').textContent = "PROCESSING...";
        document.getElementById('teConsole').classList.add('hidden');
        
        const startDateTimeObj = new Date(`${bookingDateInput.value}T${timeStartInput.value}:00`);
        const endDateTimeObj = new Date(`${bookingDateInput.value}T${timeEndInput.value}:00`);
        if (timeEndInput.value < timeStartInput.value) endDateTimeObj.setDate(endDateTimeObj.getDate() + 1);

        const newEventData = {
            summary: `${artistNameInput.value} - ${companySelect.value}`,
            location: studioSelect.value,
            description: `(Reserva modificada desde Cerebro por ${pmEmailInput.value})`,
            start: { dateTime: startDateTimeObj.toISOString() },
            end: { dateTime: endDateTimeObj.toISOString() }
        };

        const payload = { oldIds: eventIdsInput.value, pmEmail: pmEmailInput.value, events: [newEventData] };

        fetch(GAS_WEBAPP_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        .then(() => {
            showStatus('success', 'DATOS ACTUALIZADOS CON ÉXITO EN EL SERVIDOR.');
            submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> <span>MODIFICADO</span>';
        })
        .catch(error => {
            showStatus('error', `ERROR GUARDANDO CAMBIOS.`);
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-bolt" id="btnIcon"></i> <span id="btnText">GUARDAR CAMBIOS</span>';
        });
    });

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
        }
    }
});