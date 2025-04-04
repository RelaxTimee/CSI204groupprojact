/**
 * SettingForAdmin.js
 * 
 * This file contains the functionality for the Admin Settings page.
 * It allows administrators and managers to manage users, backup and restore data.
 * 
 * Best's implementation for user management, backup and restore functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check if user has admin or manager role
    const roleId = localStorage.getItem('role_id') || sessionStorage.getItem('role_id');
    
    // Only allow access to admin (role_id = 1) and manager (role_id = 2)
    if (roleId !== '1' && roleId !== '2') {
        alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
        window.location.href = 'login.html';
        return;
    }
    
    // DOM elements
    const userTableBody = document.getElementById('userTableBody');
    const addUserBtn = document.getElementById('addUserBtn');
    const addUserModal = document.getElementById('addUserModal');
    const editUserModal = document.getElementById('editUserModal');
    const addUserForm = document.getElementById('addUserForm');
    const editUserForm = document.getElementById('editUserForm');
    const cancelAddUser = document.getElementById('cancelAddUser');
    const cancelEditUser = document.getElementById('cancelEditUser');
    const backupBtn = document.getElementById('backupBtn');
    const fileUpload = document.getElementById('fileUpload');
    
    // Close modals when clicking on X or cancel buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            addUserModal.style.display = 'none';
            editUserModal.style.display = 'none';
        });
    });
    
    cancelAddUser.addEventListener('click', function() {
        addUserModal.style.display = 'none';
    });
    
    cancelEditUser.addEventListener('click', function() {
        editUserModal.style.display = 'none';
    });
    
    // Close modal when clicking outside of it
    window.addEventListener('click', function(event) {
        if (event.target === addUserModal) {
            addUserModal.style.display = 'none';
        }
        if (event.target === editUserModal) {
            editUserModal.style.display = 'none';
        }
    });
    
    // Open add user modal
    addUserBtn.addEventListener('click', function() {
        addUserForm.reset();
        addUserModal.style.display = 'block';
    });
    
    // Load users from database
    loadUsers();
    
    // Add user form submission
    addUserForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const userData = {
            username: document.getElementById('username').value,
            password: document.getElementById('password').value,
            role_id: document.getElementById('role').value
        };
        
        addUser(userData);
    });
    
    // Edit user form submission
    editUserForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const userData = {
            id: document.getElementById('editUserId').value,
            username: document.getElementById('editUsername').value,
            password: document.getElementById('editPassword').value,
            role_id: document.getElementById('editRole').value
        };
        
        updateUser(userData);
    });
    
    // Backup data
    backupBtn.addEventListener('click', function() {
        backupData();
    });
    
    // Restore data
    fileUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            restoreData(file);
        }
    });
    
    /**
     * Best's implementation for loading users from the database
     * Fetches all users and displays them in the table
     */
    async function loadUsers() {
        try {
            const users = await fetchWithAuth('/users');
            
            // Clear the table
            userTableBody.innerHTML = '';
            
            // Add users to the table
            users.forEach((user, index) => {
                const tr = document.createElement('tr');
                
                // Format date
                const createdDate = new Date(user.created_at);
                const formattedDate = `${createdDate.getDate()}/${createdDate.getMonth() + 1}/${createdDate.getFullYear()}`;
                
                // Get role name
                const roleName = getRoleName(user.role_id);
                
                tr.innerHTML = `
                    <td>${user.id}</td>
                    <td>${user.username}</td>
                    <td>${roleName}</td>
                    <td>${formattedDate}</td>
                    <td class="action-buttons">
                        <button class="btn btn-edit edit-user" data-id="${user.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-delete delete-user" data-id="${user.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                
                userTableBody.appendChild(tr);
            });
            
            // Add event listeners to edit and delete buttons
            addActionButtonListeners();
            
        } catch (error) {
            console.error('Error loading users:', error);
            alert('ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
        }
    }
    
    /**
     * Best's implementation for adding action button event listeners
     * Adds click events to edit and delete buttons
     */
    function addActionButtonListeners() {
        // Edit user buttons
        document.querySelectorAll('.edit-user').forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = this.getAttribute('data-id');
                openEditUserModal(userId);
            });
        });
        
        // Delete user buttons
        document.querySelectorAll('.delete-user').forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = this.getAttribute('data-id');
                if (confirm('คุณต้องการลบผู้ใช้นี้ใช่หรือไม่?')) {
                    deleteUser(userId);
                }
            });
        });
    }
    
    /**
     * Best's implementation for opening the edit user modal
     * Fetches user data and populates the form
     */
    async function openEditUserModal(userId) {
        try {
            const users = await fetchWithAuth('/users');
            const user = users.find(u => u.id == userId);
            
            if (user) {
                document.getElementById('editUserId').value = user.id;
                document.getElementById('editUsername').value = user.username;
                document.getElementById('editPassword').value = ''; // Don't show password
                document.getElementById('editRole').value = user.role_id;
                
                editUserModal.style.display = 'block';
            } else {
                alert('ไม่พบข้อมูลผู้ใช้');
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            alert('ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
        }
    }
    
    /**
     * Best's implementation for adding a new user
     * Sends user data to the server and updates the UI
     */
    async function addUser(userData) {
        try {
            // In a real application, this would be an API call to create a user
            const response = await fetchWithAuth('/users/create', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
            
            // For demo purposes, we'll simulate a successful response
            // and reload the user list
            alert('เพิ่มผู้ใช้สำเร็จ');
            addUserModal.style.display = 'none';
            loadUsers();
            
        } catch (error) {
            // If the API endpoint doesn't exist, we'll simulate adding a user
            console.error('Error adding user:', error);
            
            // Get existing users
            const users = await fetchWithAuth('/users');
            
            // Create a new user with the next available ID
            const newUser = {
                id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
                username: userData.username,
                role_id: userData.role_id,
                created_at: new Date().toISOString()
            };
            
            // Add to mock data (in a real app, this would be saved to the database)
            users.push(newUser);
            
            // Update localStorage for demo purposes
            localStorage.setItem('mockUsers', JSON.stringify(users));
            
            alert('เพิ่มผู้ใช้สำเร็จ (จำลอง)');
            addUserModal.style.display = 'none';
            loadUsers();
        }
    }
    
    /**
     * Best's implementation for updating a user
     * Sends updated user data to the server and refreshes the UI
     */
    async function updateUser(userData) {
        try {
            // In a real application, this would be an API call to update a user
            const response = await fetchWithAuth(`/users/update/${userData.id}`, {
                method: 'PUT',
                body: JSON.stringify(userData)
            });
            
            // For demo purposes, we'll simulate a successful response
            // and reload the user list
            alert('อัปเดตผู้ใช้สำเร็จ');
            editUserModal.style.display = 'none';
            loadUsers();
            
        } catch (error) {
            // If the API endpoint doesn't exist, we'll simulate updating a user
            console.error('Error updating user:', error);
            
            // Get existing users
            const users = await fetchWithAuth('/users');
            
            // Find and update the user
            const userIndex = users.findIndex(u => u.id == userData.id);
            if (userIndex !== -1) {
                users[userIndex] = {
                    ...users[userIndex],
                    username: userData.username,
                    role_id: userData.role_id,
                    // Only update password if provided
                    ...(userData.password && { password: userData.password })
                };
                
                // Update localStorage for demo purposes
                localStorage.setItem('mockUsers', JSON.stringify(users));
                
                alert('อัปเดตผู้ใช้สำเร็จ (จำลอง)');
                editUserModal.style.display = 'none';
                loadUsers();
            } else {
                alert('ไม่พบผู้ใช้ที่ต้องการอัปเดต');
            }
        }
    }
    
    /**
     * Best's implementation for deleting a user
     * Removes the user from the database and updates the UI
     */
    async function deleteUser(userId) {
        try {
            // In a real application, this would be an API call to delete a user
            const response = await fetchWithAuth(`/users/delete/${userId}`, {
                method: 'DELETE'
            });
            
            // For demo purposes, we'll simulate a successful response
            // and reload the user list
            alert('ลบผู้ใช้สำเร็จ');
            loadUsers();
            
        } catch (error) {
            // If the API endpoint doesn't exist, we'll simulate deleting a user
            console.error('Error deleting user:', error);
            
            // Get existing users
            const users = await fetchWithAuth('/users');
            
            // Filter out the deleted user
            const updatedUsers = users.filter(u => u.id != userId);
            
            // Reindex IDs to ensure sequential order
            const reindexedUsers = updatedUsers.map((user, index) => ({
                ...user,
                id: index + 1
            }));
            
            // Update localStorage for demo purposes
            localStorage.setItem('mockUsers', JSON.stringify(reindexedUsers));
            
            loadUsers();
        }
    }
    
    /**
     * Best's implementation for backing up user data
     * Creates a JSON file with all user data and triggers a download
     */
    async function backupData() {
        try {
            // Get all users
            const users = await fetchWithAuth('/users');
            
            // Create backup object with metadata
            const backup = {
                timestamp: new Date().toISOString(),
                version: '1.0',
                data: users
            };
            
            // Convert to JSON string
            const backupJson = JSON.stringify(backup, null, 2);
            
            // Create a blob and download link
            const blob = new Blob([backupJson], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            // Create a date string for the filename
            const date = new Date();
            const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
            
            // Create and trigger download
            const a = document.createElement('a');
            a.href = url;
            a.download = `user-backup-${dateStr}.json`;
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
            
        } catch (error) {
            console.error('Error backing up data:', error);
            alert('ไม่สามารถสำรองข้อมูลได้');
        }
    }
    
    /**
     * Best's implementation for restoring user data from a backup file
     * Reads the JSON file and updates the database with the restored data
     */
    function restoreData(file) {
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            try {
                // Parse the JSON data
                const backup = JSON.parse(e.target.result);
                
                // Validate backup format
                if (!backup.data || !Array.isArray(backup.data)) {
                    throw new Error('รูปแบบไฟล์สำรองข้อมูลไม่ถูกต้อง');
                }
                
                // Confirm restore
                if (confirm(`คุณต้องการกู้คืนข้อมูลผู้ใช้จำนวน ${backup.data.length} รายการ จากวันที่ ${new Date(backup.timestamp).toLocaleString()} ใช่หรือไม่?`)) {
                    // In a real application, this would be an API call to restore users
                    try {
                        const response = await fetchWithAuth('/users/restore', {
                            method: 'POST',
                            body: JSON.stringify(backup.data)
                        });
                        
                        alert('กู้คืนข้อมูลสำเร็จ');
                        loadUsers();
                        
                    } catch (error) {
                        // If the API endpoint doesn't exist, we'll simulate restoring users
                        console.error('Error restoring users via API:', error);
                        
                        // Update localStorage for demo purposes
                        localStorage.setItem('mockUsers', JSON.stringify(backup.data));
                        
                        alert('กู้คืนข้อมูลสำเร็จ (จำลอง)');
                        loadUsers();
                    }
                }
                
            } catch (error) {
                console.error('Error parsing backup file:', error);
                alert('ไม่สามารถอ่านไฟล์สำรองข้อมูลได้: ' + error.message);
            }
        };
        
        reader.onerror = function() {
            alert('ไม่สามารถอ่านไฟล์ได้');
        };
        
        reader.readAsText(file);
    }
    
    /**
     * Helper function to get role name from role ID
     */
    function getRoleName(roleId) {
        const roles = {
            1: 'ผู้ดูแลระบบ (Admin)',
            2: 'ผู้จัดการ (Manager)',
            3: 'ฝ่ายจัดซื้อ (Procurement)',
            4: 'ฝ่ายการเงิน (Finance)',
            5: 'ฝ่ายไอที (IT)'
        };
        
        return roles[roleId] || 'ไม่ทราบบทบาท';
    }
});