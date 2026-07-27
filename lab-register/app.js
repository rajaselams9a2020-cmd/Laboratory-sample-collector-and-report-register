let allSamples = [];

// 1. Fetch data from backend API (Task 4 - Server-Side Search Add pannirukkom)
async function loadData(searchQuery = '') {
    // Start aagumpodhu Loading kaattanum, Table & Errors hide pannanum
    document.getElementById('loadingState').classList.remove('d-none');
    document.getElementById('dataContainer').classList.add('d-none');
    document.getElementById('errorState').classList.add('d-none');
    document.getElementById('emptyState').classList.add('d-none');

    try {
        // Ippo Server-kku search word-ah URL vazhiya anuppurom!
        const url = searchQuery ? `/api/samples?search=${encodeURIComponent(searchQuery)}` : '/api/samples';
        const response = await fetch(url);
        
        if (!response.ok) throw new Error("Server connection failed. Could not load data.");
        
        allSamples = await response.json();
        
        // Status filter mattum frontend-la irukkattum
        const statusText = document.getElementById('statusFilter').value;
        const filteredByStatus = allSamples.filter(sample => statusText === 'All' || sample.status === statusText);
        
        renderTable(filteredByStatus);
        
    } catch (error) {
        // Error vandha Loading-ah hide pannittu Error box-ah kaattanum
        document.getElementById('errorState').innerText = "❌ " + error.message;
        document.getElementById('errorState').classList.remove('d-none');
    } finally {
        // Success or Fail - Loading spinner-ah stop pannanum
        document.getElementById('loadingState').classList.add('d-none');
    }
}

// 2. Display data in the HTML table (Task 4 - Empty state handle pannirukkom)
function renderTable(data) {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    // EMPTY STATE CHECK: Data illana "No records found" kaattanum
    if (data.length === 0) {
        document.getElementById('emptyState').classList.remove('d-none');
        document.getElementById('dataContainer').classList.add('d-none');
        return; 
    } else {
        document.getElementById('emptyState').classList.add('d-none');
        document.getElementById('dataContainer').classList.remove('d-none');
    }

    data.forEach(sample => {
        // Status Colors
        let statusBadgeClass = 'bg-secondary';
        if (sample.status === 'Pending') statusBadgeClass = 'bg-warning text-dark';
        if (sample.status === 'Processed') statusBadgeClass = 'bg-info text-dark';
        if (sample.status === 'Reported') statusBadgeClass = 'bg-success';

        // Missing Name handling (Awkward case)
        const patientName = sample.patient_name || '<span class="text-danger fst-italic">Missing Name</span>';

        // Days Waiting Highlight
        let daysWaitingDisplay = '-';
        if (sample.days_waiting !== undefined && sample.status !== 'Reported') {
            daysWaitingDisplay = sample.days_waiting > 3 
                ? `<span class="badge bg-danger">${sample.days_waiting} Days</span>` 
                : `${sample.days_waiting} Days`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="fw-bold">${sample.sample_id}</td>
            <td>${patientName}</td>
            <td>${sample.phone_number || '-'}</td>
            <td>${sample.test_type}</td>
            <td>${sample.collected_date}</td>
            <td><span class="badge ${statusBadgeClass}">${sample.status}</span></td>
            <td>${daysWaitingDisplay}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="showUpdateModal('${sample.sample_id}')">Update</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 3. Search & Filter Logic
function applyFilters() {
    const searchText = document.getElementById('searchInput').value;
    // Pazhaiya madhiri array-la thedama, direct-ah server-kitteye theda sollurom
    loadData(searchText);
}

// Clear Filters (Empty state button click panna)
function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = 'All';
    applyFilters();
}

// Attach event listeners
document.getElementById('searchInput').addEventListener('input', applyFilters);
document.getElementById('statusFilter').addEventListener('change', applyFilters);

// Initial Load
loadData();

// --------------------------------------------------
// MODAL LOGIC (Task 3)
// --------------------------------------------------
let myModal;
document.addEventListener("DOMContentLoaded", () => {
    myModal = new bootstrap.Modal(document.getElementById('sampleModal'));
});

function showAddModal() {
    document.getElementById('sampleForm').reset(); 
    document.getElementById('formId').readOnly = false; 
    document.getElementById('isUpdate').value = "false"; 
    document.getElementById('modalTitle').innerText = "Add New Sample";
    document.getElementById('formError').classList.add('d-none'); 
    
    myModal.show();
}

function showUpdateModal(id) {
    const sample = allSamples.find(s => s.sample_id === id);
    if(!sample) return;

    document.getElementById('formId').value = sample.sample_id;
    document.getElementById('formId').readOnly = true; 
    document.getElementById('formName').value = sample.patient_name;
    document.getElementById('formPhone').value = sample.phone_number || '';
    document.getElementById('formTest').value = sample.test_type;
    document.getElementById('formDate').value = sample.collected_date;
    document.getElementById('formStatus').value = sample.status;
    document.getElementById('formTech').value = sample.collected_by || '';

    document.getElementById('isUpdate').value = "true"; 
    document.getElementById('modalTitle').innerText = "Update Sample";
    document.getElementById('formError').classList.add('d-none');
    
    myModal.show();
}

async function saveRecord() {
    const isUpdate = document.getElementById('isUpdate').value === "true";
    const id = document.getElementById('formId').value;
    
    const data = {
        sample_id: id,
        patient_name: document.getElementById('formName').value,
        phone_number: document.getElementById('formPhone').value,
        test_type: document.getElementById('formTest').value,
        collected_date: document.getElementById('formDate').value,
        status: document.getElementById('formStatus').value,
        collected_by: document.getElementById('formTech').value
    };

    const url = isUpdate ? `/api/samples/${id}` : '/api/samples';
    const method = isUpdate ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            const errorBox = document.getElementById('formError');
            errorBox.innerText = result.error;
            errorBox.classList.remove('d-none');
        } else {
            myModal.hide();
            // Pudhu record save aanadhum search input clear aagi reload aaganum
            document.getElementById('searchInput').value = '';
            loadData(); 
        }
    } catch (error) {
        console.error("Save failed:", error);
    }
}