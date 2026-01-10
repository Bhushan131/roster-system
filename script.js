// Sample data structure (in production, use backend database)
let employees = [
    { id: 'EMP001', name: 'Rajesh Kumar', password: '123456', role: 'employee', office: 'IC 07 GAVNER' },
    { id: 'EMP002', name: 'Priya Sharma', password: '123456', role: 'employee', office: 'IC 07 GAVNER' },
    { id: 'EMP003', name: 'Amit Patel', password: '123456', role: 'employee', office: 'IC 07 GAVNER' },
    { id: 'ADMIN01', name: 'Manager', password: 'admin123', role: 'admin', office: 'IC 07 GAVNER' }
];

let roster = [
    { id: 1, empId: 'EMP001', date: '2026-01-05', shift: '6AM-2PM', status: 'assigned' },
    { id: 2, empId: 'EMP002', date: '2026-01-05', shift: '2PM-10PM', status: 'assigned' },
    { id: 3, empId: 'EMP003', date: '2026-01-05', shift: '10PM-6AM', status: 'assigned' }
];

let shiftRequests = [];
let leaveRequests = [];

// Current user
let currentUser = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        // Only load data if we're NOT already logged in
        const savedUser = localStorage.getItem('currentUser');
        if (!savedUser) {
            loadData();
        }
    } else {
        // We're on admin page
        loadData();
    }
});

// Login handler
function handleLogin(e) {
    e.preventDefault();
    const empId = document.getElementById('empId').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('errorMsg');

    const user = employees.find(u => u.id === empId && u.password === password);
    
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        saveData();
        
        if (user.role === 'admin') {
            window.location.href = 'admin.html';
        } else {
            showDashboard();
        }
    } else {
        errorMsg.textContent = 'Invalid Employee ID or Password';
        errorMsg.className = 'error';
    }
}

function showDashboard() {
    document.body.innerHTML = `
        <div class="container">
            <div class="dashboard">
                <div class="header">
                    <h1>🛣️ Welcome, ${currentUser.name}</h1>
                    <h2>Employee ID: ${currentUser.id}</h2>
                    <p>IC 07 GAVNER (SHIVNI) TOLL PLAZA</p>
                </div>
                
                <div class="nav-tabs">
                    <button class="nav-tab active" onclick="showTab('roster')">My Roster</button>
                    <button class="nav-tab" onclick="showTab('shift-exchange')">Shift Exchange</button>
                    <button class="nav-tab" onclick="showTab('leave')">Leave Request</button>
                </div>
                
                <div id="roster-tab" class="tab-content active"></div>
                <div id="shift-exchange-tab" class="tab-content"></div>
                <div id="leave-tab" class="tab-content"></div>
                
                <button class="action-btn" onclick="logout()">Logout</button>
            </div>
        </div>
        
        <div id="shiftExchangeModal" class="modal">
            <div class="modal-content">
                <span class="close" onclick="closeModal()">&times;</span>
                <h3>Shift Exchange Request</h3>
                <form onsubmit="submitShiftExchange(); return false;">
                    <input type="hidden" id="shift-roster-id">
                    <div class="input-group">
                        <label>Date</label>
                        <input type="date" id="shift-date" readonly>
                    </div>
                    <div class="input-group">
                        <label>My Shift</label>
                        <input type="text" id="shift-my-shift" readonly>
                    </div>
                    <div class="input-group">
                        <label>Exchange with Employee ID</label>
                        <input type="text" id="shift-with-emp" required>
                    </div>
                    <button type="submit" class="action-btn">Submit Request</button>
                </form>
            </div>
        </div>

        <div id="leaveModal" class="modal">
            <div class="modal-content">
                <span class="close" onclick="closeModal()">&times;</span>
                <h3>Leave Request</h3>
                <form onsubmit="submitLeaveRequest(); return false;">
                    <div class="input-group">
                        <label>Number of Days</label>
                        <input type="number" id="leave-days" min="1" max="30" required>
                    </div>
                    <div class="input-group">
                        <label>Reason</label>
                        <textarea id="leave-reason" rows="4" required></textarea>
                    </div>
                    <button type="submit" class="action-btn">Submit Request</button>
                </form>
            </div>
        </div>
    `;
    
    setTimeout(() => {
        loadTabData();
    }, 100);
}

function showTab(tabName) {
    // Update nav tabs
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabName + '-tab').classList.add('active');
    
    loadTabData(tabName);
}

function loadTabData(tabName = 'roster') {
    if (tabName === 'roster') {
        loadRoster();
    } else if (tabName === 'shift-exchange') {
        loadShiftExchange();
    } else if (tabName === 'leave') {
        loadLeaveRequests();
    }
}

function loadRoster() {
    const container = document.getElementById('roster-tab');
    const myRoster = roster.filter(r => r.empId === currentUser.id);
    
    if (myRoster.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #7f8c8d;">No roster assigned yet.</p>';
        return;
    }
    
    let tableHTML = `
        <table class="roster-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Shift</th>
                    <th>Status</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    myRoster.forEach(row => {
        tableHTML += `
            <tr>
                <td>${formatDate(row.date)}</td>
                <td>${row.shift}</td>
                <td><span class="status-${row.status}">${row.status.toUpperCase()}</span></td>
                <td>
                    <button class="action-btn" onclick="openShiftExchange('${row.id}')">Exchange Shift</button>
                </td>
            </tr>
        `;
    });
    
    tableHTML += '</tbody></table>';
    container.innerHTML = tableHTML;
}

function loadShiftExchange() {
    const container = document.getElementById('shift-exchange-tab');
    const myRequests = shiftRequests.filter(r => r.fromEmpId === currentUser.id);
    
    container.innerHTML = `
        <h3>Shift Exchange Requests</h3>
        ${myRequests.length > 0 ? 
            myRequests.map(req => `
                <div class="request-card">
                    <p><strong>Date:</strong> ${formatDate(req.date)}</p>
                    <p><strong>My Shift:</strong> ${req.myShift}</p>
                    <p><strong>With:</strong> ${req.withEmpName} (${req.withEmpId})</p>
                    <p><strong>Status:</strong> <span class="status-${req.status}">${req.status.toUpperCase()}</span></p>
                </div>
            `).join('') : 
            '<p>No pending shift exchange requests.</p>'
        }
        <button class="action-btn" onclick="openShiftExchangeModal()">New Shift Exchange</button>
    `;
}

function loadLeaveRequests() {
    const container = document.getElementById('leave-tab');
    const myRequests = leaveRequests.filter(r => r.empId === currentUser.id);
    
    container.innerHTML = `
        <h3>Leave Requests</h3>
        ${myRequests.length > 0 ? 
            myRequests.map(req => `
                <div class="request-card">
                    <p><strong>Days:</strong> ${req.days}</p>
                    <p><strong>Reason:</strong> ${req.reason}</p>
                    <p><strong>Status:</strong> <span class="status-${req.status}">${req.status.toUpperCase()}</span></p>
                </div>
            `).join('') : 
            '<p>No pending leave requests.</p>'
        }
        <button class="action-btn" onclick="openLeaveModal()">New Leave Request</button>
    `;
}

function openShiftExchange(rosterId) {
    const rosterItem = roster.find(r => r.id == rosterId);
    document.getElementById('shift-roster-id').value = rosterId;
    document.getElementById('shift-date').value = formatDateInput(rosterItem.date);
    document.getElementById('shift-my-shift').value = rosterItem.shift;
    showModal('shiftExchangeModal');
}

function openShiftExchangeModal() {
    showModal('shiftExchangeModal');
}

function openLeaveModal() {
    showModal('leaveModal');
}

function submitShiftExchange() {
    const rosterId = document.getElementById('shift-roster-id').value;
    const withEmpId = document.getElementById('shift-with-emp').value;
    const rosterItem = roster.find(r => r.id == rosterId);
    
    const request = {
        id: Date.now(),
        fromEmpId: currentUser.id,
        fromEmpName: currentUser.name,
        date: rosterItem.date,
        myShift: rosterItem.shift,
        withEmpId: withEmpId,
        withEmpName: employees.find(e => e.id === withEmpId)?.name || 'Unknown',
        status: 'pending'
    };
    
    shiftRequests.push(request);
    saveData();
    closeModal();
    loadTabData('shift-exchange');
    
    alert('Shift exchange request submitted for manager approval!');
}

function submitLeaveRequest() {
    const days = document.getElementById('leave-days').value;
    const reason = document.getElementById('leave-reason').value;
    
    const request = {
        id: Date.now(),
        empId: currentUser.id,
        empName: currentUser.name,
        days: days,
        reason: reason,
        status: 'pending'
    };
    
    leaveRequests.push(request);
    saveData();
    closeModal();
    loadLeaveRequests();
    
    alert('Leave request submitted for manager approval!');
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    // Force reload to login page
    window.location.replace('index.html');
}

// Admin functions (admin.html)
function initAdmin() {
    if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = 'index.html';
        return;
    }
    
    loadAdminData();
}

function loadAdminData() {
    document.getElementById('admin-roster').innerHTML = generateRosterTable();
    document.getElementById('admin-shift-requests').innerHTML = generateShiftRequestsTable();
    document.getElementById('admin-leave-requests').innerHTML = generateLeaveRequestsTable();
}

function generateRosterTable() {
    let html = `
        <table class="roster-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Employee</th>
                    <th>Date</th>
                    <th>Shift</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    roster.forEach(row => {
        const emp = employees.find(e => e.id === row.empId);
        html += `
            <tr>
                <td>${row.id}</td>
                <td>${emp ? emp.name : 'Unknown'} (${row.empId})</td>
                <td>${formatDate(row.date)}</td>
                <td>${row.shift}</td>
                <td>
                    <button class="action-btn" onclick="editRoster(${row.id})">Edit</button>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    return html;
}

function generateShiftRequestsTable() {
    if (shiftRequests.length === 0) return '<p>No pending shift exchange requests.</p>';
    
    let html = `
        <table class="roster-table">
            <thead>
                <tr>
                    <th>From</th>
                    <th>Date</th>
                    <th>Shift</th>
                    <th>With</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    shiftRequests.forEach(req => {
        html += `
            <tr>
                <td>${req.fromEmpName} (${req.fromEmpId})</td>
                <td>${formatDate(req.date)}</td>
                <td>${req.myShift}</td>
                <td>${req.withEmpName} (${req.withEmpId})</td>
                <td>
                    <button class="action-btn" onclick="approveShift(${req.id}, true)">Approve</button>
                    <button class="action-btn" style="background: #e74c3c;" onclick="approveShift(${req.id}, false)">Reject</button>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    return html;
}

function generateLeaveRequestsTable() {
    if (leaveRequests.length === 0) return '<p>No pending leave requests.</p>';
    
    let html = `
        <table class="roster-table">
            <thead>
                <tr>
                    <th>Employee</th>
                    <th>Days</th>
                    <th>Reason</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    leaveRequests.forEach(req => {
        html += `
            <tr>
                <td>${req.empName} (${req.empId})</td>
                <td>${req.days}</td>
                <td>${req.reason}</td>
                <td>
                    <button class="action-btn" onclick="approveLeave(${req.id}, true)">Approve</button>
                    <button class="action-btn" style="background: #e74c3c;" onclick="approveLeave(${req.id}, false)">Reject</button>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    return html;
}

function approveShift(requestId, approved) {
    const request = shiftRequests.find(r => r.id === requestId);
    if (request) {
        request.status = approved ? 'approved' : 'rejected';
        saveData();
        loadAdminData();
    }
}

function approveLeave(requestId, approved) {
    const request = leaveRequests.find(r => r.id === requestId);
    if (request) {
        request.status = approved ? 'approved' : 'rejected';
        saveData();
        loadAdminData();
    }
}

// Utility functions
function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-IN');
}

function formatDateInput(dateStr) {
    return new Date(dateStr).toISOString().split('T')[0];
}

function saveData() {
    localStorage.setItem('roster', JSON.stringify(roster));
    localStorage.setItem('shiftRequests', JSON.stringify(shiftRequests));
    localStorage.setItem('leaveRequests', JSON.stringify(leaveRequests));
    localStorage.setItem('employees', JSON.stringify(employees));
}

function loadData() {
    const savedRoster = localStorage.getItem('roster');
    const savedShiftRequests = localStorage.getItem('shiftRequests');
    const savedLeaveRequests = localStorage.getItem('leaveRequests');
    const savedEmployees = localStorage.getItem('employees');
    
    if (savedRoster) roster = JSON.parse(savedRoster);
    if (savedShiftRequests) shiftRequests = JSON.parse(savedShiftRequests);
    if (savedLeaveRequests) leaveRequests = JSON.parse(savedLeaveRequests);
    if (savedEmployees) employees = JSON.parse(savedEmployees);
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'block';
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => modal.style.display = 'none');
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        closeModal();
    }
}