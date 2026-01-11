// API base URL
const API_BASE = '';

// Current user
let currentUser = null;
let employees = [];
let roster = [];
let shiftRequests = [];
let leaveRequests = [];
let notifications = [];

// API helper functions
async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {'Content-Type': 'application/json'}
    };
    if (data) options.body = JSON.stringify(data);
    
    const response = await fetch(API_BASE + endpoint, options);
    return await response.json();
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

// Login handler
async function handleLogin(e) {
    e.preventDefault();
    const empId = document.getElementById('empId').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('errorMsg');

    try {
        const result = await apiCall('/api/login', 'POST', { empId, password });
        
        if (result.success) {
            currentUser = result.user;
            
            if (currentUser.role === 'admin') {
                window.location.href = 'admin.html';
            } else {
                await loadEmployees();
                showDashboard();
            }
        } else {
            errorMsg.textContent = result.message;
            errorMsg.className = 'error';
        }
    } catch (error) {
        errorMsg.textContent = 'Connection error. Please try again.';
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

async function loadEmployees() {
    try {
        employees = await apiCall('/api/employees');
    } catch (error) {
        console.error('Failed to load employees:', error);
    }
}

async function loadRoster() {
    const container = document.getElementById('roster-tab');
    
    try {
        roster = await apiCall(`/api/roster?empId=${currentUser.id}`);
        
        if (roster.length === 0) {
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
        
        roster.forEach(row => {
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
    } catch (error) {
        container.innerHTML = '<p style="color: #e74c3c;">Error loading roster data.</p>';
    }
}

async function loadShiftExchange() {
    const container = document.getElementById('shift-exchange-tab');
    
    try {
        shiftRequests = await apiCall(`/api/shift-requests?empId=${currentUser.id}`);
        
        container.innerHTML = `
            <h3>My Shift Exchange Requests</h3>
            ${shiftRequests.length > 0 ? 
                shiftRequests.map(req => `
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
    } catch (error) {
        container.innerHTML = '<p style="color: #e74c3c;">Error loading shift exchange data.</p>';
    }
}

async function loadLeaveRequests() {
    const container = document.getElementById('leave-tab');
    
    try {
        leaveRequests = await apiCall(`/api/leave-requests?empId=${currentUser.id}`);
        
        container.innerHTML = `
            <h3>Leave Requests</h3>
            ${leaveRequests.length > 0 ? 
                leaveRequests.map(req => `
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
    } catch (error) {
        container.innerHTML = '<p style="color: #e74c3c;">Error loading leave requests.</p>';
    }
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

async function submitShiftExchange() {
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
    
    const withEmp = employees.find(e => e.id === withEmpId);
    if (!withEmp) {
        alert('Selected employee not found.');
        return;
    }
    
    try {
        // Find target employee's shift for the same date (if any)
        const allRoster = await apiCall('/api/roster');
        const targetEmpRoster = allRoster.find(r => 
            r.empId === withEmpId && 
            r.date === shiftDate && 
            r.status === 'assigned'
        );
        
        const requestData = {
            fromEmpId: currentUser.id,
            fromEmpName: currentUser.name,
            date: shiftDate,
            myShift: myShift,
            withEmpId: withEmpId,
            withEmpName: withEmp.name,
            withEmpShift: targetEmpRoster ? targetEmpRoster.shift : 'No shift assigned'
        };
        
        const result = await apiCall('/api/shift-requests', 'POST', requestData);
        
        if (result.success) {
            closeModal();
            loadTabData('shift-exchange');
            alert(`Shift exchange request sent to ${withEmp.name} and submitted for manager approval!`);
        }
    } catch (error) {
        alert('Error submitting request. Please try again.');
    }
}

async function submitLeaveRequest() {
    const days = document.getElementById('leave-days').value;
    const reason = document.getElementById('leave-reason').value;
    
    try {
        const requestData = {
            empId: currentUser.id,
            empName: currentUser.name,
            days: days,
            reason: reason
        };
        
        const result = await apiCall('/api/leave-requests', 'POST', requestData);
        
        if (result.success) {
            closeModal();
            loadLeaveRequests();
            alert('Leave request submitted for manager approval!');
        }
    } catch (error) {
        alert('Error submitting request. Please try again.');
    }
}

function logout() {
    currentUser = null;
    window.location.replace('index.html');
}

// Admin functions (admin.html)
async function initAdmin() {
    if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = 'index.html';
        return;
    }
    
    await loadAdminData();
}

async function loadAdminData() {
    try {
        const [allRoster, allShiftRequests, allLeaveRequests] = await Promise.all([
            apiCall('/api/roster'),
            apiCall('/api/shift-requests'),
            apiCall('/api/leave-requests')
        ]);
        
        employees = await apiCall('/api/employees');
        
        document.getElementById('admin-roster').innerHTML = generateRosterTable(allRoster);
        document.getElementById('admin-shift-requests').innerHTML = generateShiftRequestsTable(allShiftRequests);
        document.getElementById('admin-leave-requests').innerHTML = generateLeaveRequestsTable(allLeaveRequests);
    } catch (error) {
        console.error('Error loading admin data:', error);
    }
}

function generateRosterTable(rosterData) {
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
    
    rosterData.forEach(row => {
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

function generateShiftRequestsTable(requestsData) {
    if (requestsData.length === 0) return '<p>No shift exchange requests found.</p>';
    
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
    
    requestsData.forEach(req => {
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

function generateLeaveRequestsTable(requestsData) {
    if (requestsData.length === 0) return '<p>No leave requests found.</p>';
    
    let html = `
        <table class="roster-table">
            <thead>
                <tr>
                    <th>Employee</th>
                    <th>Days</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    requestsData.forEach(req => {
        html += `
            <tr>
                <td>${req.empName} (${req.empId})</td>
                <td>${req.days}</td>
                <td>${req.reason}</td>
                <td><span class="status-${req.status}">${req.status.toUpperCase()}</span></td>
                <td>
                    ${req.status === 'pending' ? `
                        <button class="action-btn" onclick="approveLeave(${req.id}, true)">Approve</button>
                        <button class="action-btn" style="background: #e74c3c;" onclick="approveLeave(${req.id}, false)">Reject</button>
                    ` : `<span class="status-${req.status}">${req.status.toUpperCase()}</span>`}
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    return html;
}

async function approveShift(requestId, approved) {
    try {
        await apiCall('/api/approve-shift', 'POST', { requestId, approved });
        loadAdminData();
    } catch (error) {
        alert('Error processing request. Please try again.');
    }
}

async function approveLeave(requestId, approved) {
    try {
        await apiCall('/api/approve-leave', 'POST', { requestId, approved });
        loadAdminData();
    } catch (error) {
        alert('Error processing request. Please try again.');
    }
}

// Remove all localStorage functions
function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-IN');
}

function formatDateInput(dateStr) {
    return new Date(dateStr).toISOString().split('T')[0];
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
async function loadNotifications() {
    const container = document.getElementById('notifications-tab');
    
    try {
        notifications = await apiCall(`/api/notifications?empId=${currentUser.id}`);
        
        if (notifications.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #7f8c8d;">No notifications available.</p>';
            return;
        }
        
        let html = '<h3>Notifications</h3>';
        
        notifications.forEach(notification => {
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
    } catch (error) {
        container.innerHTML = '<p style="color: #e74c3c;">Error loading notifications.</p>';
    }
}

async function markAsRead(notificationId) {
    try {
        await apiCall('/api/notifications', 'PUT', { id: notificationId });
        loadNotifications();
        updateNotificationIndicator();
    } catch (error) {
        console.error('Error marking notification as read:', error);
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
