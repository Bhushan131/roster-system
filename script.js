// Sample data structure (in production, use backend database)
let employees = [
    { id: 'EMP001', name: 'Rajesh Kumar', password: '123456', role: 'employee', office: 'IC 07 GAVNER' },
    { id: 'EMP002', name: 'Priya Sharma', password: '123456', role: 'employee', office: 'IC 07 GAVNER' },
    { id: 'EMP003', name: 'Amit Patel', password: '123456', role: 'employee', office: 'IC 07 GAVNER' },
    { id: 'ADMIN01', name: 'Manager', password: 'admin123', role: 'admin', office: 'IC 07 GAVNER' }
];

let roster = [
    { id: 1, empId: 'EMP001', date: '2026-01-05', shift: 'A', status: 'assigned' },
    { id: 2, empId: 'EMP002', date: '2026-01-05', shift: 'B', status: 'assigned' },
    { id: 3, empId: 'EMP003', date: '2026-01-05', shift: 'C', status: 'assigned' }
];

let shiftRequests = [];
let leaveRequests = [];
let notifications = [
    { id: 1, empId: 'EMP001', title: 'Shift Assignment', message: 'Your shift for Jan 5th has been assigned: A Shift', date: '2026-01-03', read: false },
    { id: 2, empId: 'EMP001', title: 'Leave Request Update', message: 'Your leave request has been approved by management', date: '2026-01-02', read: false },
    { id: 3, empId: 'EMP002', title: 'Shift Change', message: 'Your shift for Jan 5th has been updated: B Shift', date: '2026-01-03', read: false },
    { id: 4, empId: 'EMP003', title: 'Welcome Message', message: 'Welcome to IC 07 GAVNER Toll Plaza. Please check your roster regularly.', date: '2026-01-01', read: false }
];

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
                    <button class="nav-tab" onclick="showTab('notifications')" id="notifications-tab">
                        Notifications <span id="notification-indicator" class="notification-badge"></span>
                    </button>
                </div>
                
                <div id="roster-tab" class="tab-content active"></div>
                <div id="shift-exchange-tab" class="tab-content"></div>
                <div id="leave-tab" class="tab-content"></div>
                <div id="notifications-tab" class="tab-content"></div>
                
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
                        <input type="date" id="shift-date" required>
                    </div>
                    <div class="input-group">
                        <label>My Shift</label>
                        <select id="shift-my-shift" required>
                            <option value="">Select Shift</option>
                            <option value="A">A Shift</option>
                            <option value="B">B Shift</option>
                            <option value="C">C Shift</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <label>Exchange with Employee</label>
                        <select id="shift-with-emp" required>
                            <option value="">Select Employee</option>
                        </select>
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
        updateNotificationIndicator();
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
    
    // Update notification indicator when switching tabs
    if (tabName === 'notifications') {
        updateNotificationIndicator();
    }
}

function loadTabData(tabName = 'roster') {
    if (tabName === 'roster') {
        loadRoster();
    } else if (tabName === 'shift-exchange') {
        loadShiftExchange();
    } else if (tabName === 'leave') {
        loadLeaveRequests();
    } else if (tabName === 'notifications') {
        loadNotifications();
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
        <h3>My Shift Exchange Requests</h3>
        ${myRequests.length > 0 ? 
            myRequests.map(req => `
                <div class="request-card">
                    <p><strong>Date:</strong> ${formatDate(req.date)}</p>
                    <p><strong>My Shift:</strong> ${req.myShift}</p>
                    <p><strong>Exchange With:</strong> ${req.withEmpName} (${req.withEmpId})</p>
                    <p><strong>Their Shift:</strong> ${req.withEmpShift || 'Not specified'}</p>
                    <p><strong>Status:</strong> <span class="status-${req.status}">${req.status.toUpperCase()}</span></p>
                    <p><strong>Request Date:</strong> ${formatDate(req.requestDate || req.date)}</p>
                </div>
            `).join('') : 
            '<p style="text-align: center; color: #7f8c8d;">No shift exchange requests found.</p>'
        }
        <button class="action-btn" onclick="openShiftExchangeModal()">New Shift Exchange Request</button>
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
    
    // Make fields readonly when coming from roster
    document.getElementById('shift-date').readOnly = true;
    document.getElementById('shift-my-shift').disabled = true;
    
    // Populate dropdown with ALL other employees (not just same date)
    const dropdown = document.getElementById('shift-with-emp');
    dropdown.innerHTML = '<option value="">Select Employee</option>';
    
    // Get all employees except current user
    const otherEmployees = employees.filter(emp => 
        emp.id !== currentUser.id && 
        emp.role === 'employee'
    );
    
    otherEmployees.forEach(emp => {
        // Check if employee has roster on same date
        const empRoster = roster.find(r => 
            r.date === rosterItem.date && 
            r.empId === emp.id && 
            r.status === 'assigned'
        );
        
        if (empRoster) {
            dropdown.innerHTML += `<option value="${emp.id}">${emp.name} (${empRoster.shift} Shift)</option>`;
        } else {
            dropdown.innerHTML += `<option value="${emp.id}">${emp.name} (No shift assigned)</option>`;
        }
    });
    
    showModal('shiftExchangeModal');
}

function openShiftExchangeModal() {
    // Clear form fields
    document.getElementById('shift-roster-id').value = '';
    document.getElementById('shift-date').value = '';
    document.getElementById('shift-my-shift').value = '';
    
    // Make fields editable for new requests
    document.getElementById('shift-date').readOnly = false;
    document.getElementById('shift-my-shift').disabled = false;
    
    // Populate dropdown with all employees except current user
    const dropdown = document.getElementById('shift-with-emp');
    dropdown.innerHTML = '<option value="">Select Employee</option>';
    
    // Get all other employees
    const otherEmployees = employees.filter(emp => 
        emp.id !== currentUser.id && 
        emp.role === 'employee'
    );
    
    otherEmployees.forEach(emp => {
        dropdown.innerHTML += `<option value="${emp.id}">${emp.name} (${emp.id})</option>`;
    });
    
    showModal('shiftExchangeModal');
}

function openLeaveModal() {
    showModal('leaveModal');
}

function submitShiftExchange() {
    const rosterId = document.getElementById('shift-roster-id').value;
    const withEmpId = document.getElementById('shift-with-emp').value;
    const shiftDate = document.getElementById('shift-date').value;
    const myShift = document.getElementById('shift-my-shift').value;
    
    if (!withEmpId) {
        alert('Please select an employee to exchange with.');
        return;
    }
    
    if (!shiftDate || !myShift) {
        alert('Please fill in all required fields.');
        return;
    }
    
    // Find the employee to exchange with
    const withEmp = employees.find(e => e.id === withEmpId);
    if (!withEmp) {
        alert('Selected employee not found.');
        return;
    }
    
    // Check if there's already a pending request for this date
    const existingRequest = shiftRequests.find(r => 
        r.fromEmpId === currentUser.id && 
        r.date === shiftDate && 
        r.status === 'pending'
    );
    
    if (existingRequest) {
        alert('You already have a pending shift exchange request for this date.');
        return;
    }
    
    // Find target employee's shift for the same date (if any)
    const targetEmpRoster = roster.find(r => 
        r.empId === withEmpId && 
        r.date === shiftDate && 
        r.status === 'assigned'
    );
    
    const request = {
        id: Date.now(),
        fromEmpId: currentUser.id,
        fromEmpName: currentUser.name,
        date: shiftDate,
        myShift: myShift,
        withEmpId: withEmpId,
        withEmpName: withEmp.name,
        withEmpShift: targetEmpRoster ? targetEmpRoster.shift : 'No shift assigned',
        status: 'pending',
        requestDate: new Date().toISOString().split('T')[0]
    };
    
    shiftRequests.push(request);
    
    // Add notification to the target employee
    const notification = {
        id: Date.now() + 1,
        empId: withEmpId,
        title: 'Shift Exchange Request',
        message: `${currentUser.name} has requested to exchange shifts with you for ${formatDate(shiftDate)}. Please check with management.`,
        date: new Date().toISOString().split('T')[0],
        read: false
    };
    notifications.push(notification);
    
    saveData();
    closeModal();
    loadTabData('shift-exchange');
    
    alert(`Shift exchange request sent to ${withEmp.name} and submitted for manager approval!`);
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
    if (shiftRequests.length === 0) return '<p>No shift exchange requests found.</p>';
    
    let html = `
        <table class="roster-table">
            <thead>
                <tr>
                    <th>From Employee</th>
                    <th>Date</th>
                    <th>From Shift</th>
                    <th>To Employee</th>
                    <th>To Shift</th>
                    <th>Status</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    shiftRequests.forEach(req => {
        html += `
            <tr>
                <td>${req.fromEmpName}<br><small>(${req.fromEmpId})</small></td>
                <td>${formatDate(req.date)}</td>
                <td>${req.myShift}</td>
                <td>${req.withEmpName}<br><small>(${req.withEmpId})</small></td>
                <td>${req.withEmpShift || 'Not assigned'}</td>
                <td><span class="status-${req.status}">${req.status.toUpperCase()}</span></td>
                <td>
                    ${req.status === 'pending' ? `
                        <button class="action-btn" onclick="approveShift(${req.id}, true)">Approve</button>
                        <button class="action-btn" style="background: #e74c3c;" onclick="approveShift(${req.id}, false)">Reject</button>
                    ` : `<span class="status-${req.status}">${req.status.toUpperCase()}</span>`}
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
    localStorage.setItem('notifications', JSON.stringify(notifications));
}

function loadData() {
    const savedRoster = localStorage.getItem('roster');
    const savedShiftRequests = localStorage.getItem('shiftRequests');
    const savedLeaveRequests = localStorage.getItem('leaveRequests');
    const savedEmployees = localStorage.getItem('employees');
    const savedNotifications = localStorage.getItem('notifications');
    
    if (savedRoster) roster = JSON.parse(savedRoster);
    if (savedShiftRequests) shiftRequests = JSON.parse(savedShiftRequests);
    if (savedLeaveRequests) leaveRequests = JSON.parse(savedLeaveRequests);
    if (savedEmployees) employees = JSON.parse(savedEmployees);
    if (savedNotifications) notifications = JSON.parse(savedNotifications);
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

// Notification functions
function loadNotifications() {
    const container = document.getElementById('notifications-tab');
    const myNotifications = notifications.filter(n => n.empId === currentUser.id);
    
    if (myNotifications.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #7f8c8d;">No notifications available.</p>';
        return;
    }
    
    let html = '<h3>Notifications</h3>';
    
    myNotifications.forEach(notification => {
        html += `
            <div class="notification-card ${notification.read ? 'read' : 'unread'}" onclick="markAsRead(${notification.id})">
                <div class="notification-header">
                    <h4>${notification.title}</h4>
                    <span class="notification-date">${formatDate(notification.date)}</span>
                    ${!notification.read ? '<span class="unread-dot"></span>' : ''}
                </div>
                <p class="notification-message">${notification.message}</p>
                <small style="color: #7f8c8d;">From: Admin</small>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function markAsRead(notificationId) {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
        notification.read = true;
        saveData();
        loadNotifications();
        updateNotificationIndicator();
    }
}

function updateNotificationIndicator() {
    const indicator = document.getElementById('notification-indicator');
    if (!indicator) return;
    
    const unreadCount = notifications.filter(n => n.empId === currentUser.id && !n.read).length;
    
    if (unreadCount > 0) {
        indicator.textContent = unreadCount;
        indicator.style.display = 'inline-block';
        indicator.style.background = '#e74c3c';
        indicator.style.color = 'white';
        indicator.style.borderRadius = '50%';
        indicator.style.padding = '2px 6px';
        indicator.style.fontSize = '12px';
        indicator.style.fontWeight = 'bold';
        indicator.style.marginLeft = '5px';
        indicator.style.minWidth = '18px';
        indicator.style.textAlign = 'center';
    } else {
        indicator.style.display = 'none';
    }
}

// Function to simulate admin sending notification (for testing)
function sendNotificationFromAdmin(empId, title, message) {
    const newNotification = {
        id: Date.now(),
        empId: empId,
        title: title,
        message: message,
        date: new Date().toISOString().split('T')[0],
        read: false
    };
    
    notifications.push(newNotification);
    saveData();
    
    // Update indicator if this is for current user
    if (currentUser && empId === currentUser.id) {
        updateNotificationIndicator();
    }
}
