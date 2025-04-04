// Simple logging utility for client-side actions - it's best

/**
 * Log user actions to the server
 * @param {string} action - The action to log
 * @param {string} username - The username
 * @param {string} role_id - The role ID
 * @param {string} token - JWT token (optional for logout)
 */
async function logUserAction(action, username, role_id, token = null) {
    try {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        // Add authorization header if token is provided
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Use the correct URL format
        const response = await fetch('/api/logs', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                role_id: role_id,
                username: username,
                action: action
            })
        });
        
        if (!response.ok) {
            // Try alternative URL format
            const altResponse = await fetch('api/logs', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    role_id: role_id,
                    username: username,
                    action: action
                })
            });
            
            if (!altResponse.ok) {
                throw new Error(`Failed to log action: ${altResponse.status}`);
            }
            
            console.log(`User action logged successfully (alt URL): ${action}`);
            return;
        }
        
        console.log(`User action logged successfully: ${action}`);
    } catch (error) {
        console.error('Error logging user action:', error);
        
        // Fallback to direct database insertion for logout
        if (action.includes('ออกจากระบบ') && !token) {
            try {
                await fetch('/direct-log', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        role_id: role_id,
                        username: username,
                        action: action
                    })
                });
                console.log('Logout logged via direct endpoint');
            } catch (directError) {
                console.error('Failed to log via direct endpoint:', directError);
            }
        }
    }
}

// Export the function
window.logUserAction = logUserAction;