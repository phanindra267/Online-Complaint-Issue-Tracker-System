const API_URL = '/complaints';

// Utility: Show Toast
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';

    // Icon based on type
    const icon = type === 'success' ? '✓' : '⚠';
    const color = type === 'success' ? 'var(--success)' : 'var(--danger)';

    toast.innerHTML = `
        <span style="color: ${color}; font-weight: bold; font-size: 1.2rem;">${icon}</span>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease-in reverse forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// User: Submit Complaint
const complaintForm = document.getElementById('complaintForm');
if (complaintForm) {
    complaintForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = document.getElementById('submitBtn');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = 'Submitting...';
        submitBtn.disabled = true;

        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            text: document.getElementById('text').value
        };

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                showToast('Complaint submitted successfully!');
                complaintForm.reset();
            } else {
                throw new Error('Submission failed');
            }
        } catch (error) {
            showToast('Error submitting complaint. Please try again.', 'error');
            console.error(error);
        } finally {
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
        }
    });
}

// Admin: Fetch Complaints
async function fetchComplaints() {
    const tableBody = document.getElementById('complaintsTableBody');
    if (!tableBody) return;

    try {
        const response = await fetch(API_URL);
        const complaints = await response.json();

        tableBody.innerHTML = '';

        if (complaints.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #94a3b8;">No complaints found.</td></tr>';
            return;
        }

        complaints.forEach(complaint => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#${complaint.id}</td>
                <td>
                    <div style="font-weight: 500;">${complaint.name}</div>
                    <div style="font-size: 0.8rem; color: #94a3b8;">${complaint.email}</div>
                </td>
                <td style="max-width: 300px;">
                    <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${complaint.text}</div>
                </td>
                <td>
                    <span class="status-badge status-${complaint.status.toLowerCase()}">${complaint.status}</span>
                </td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="action-btn" onclick="updateStatus(${complaint.id}, 'Resolved')" title="Mark Resolved">✓</button>
                        <button class="action-btn" onclick="updateStatus(${complaint.id}, 'Rejected')" title="Reject">✕</button>
                        <button class="action-btn delete" onclick="deleteComplaint(${complaint.id})" title="Delete">🗑</button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--danger);">Error loading complaints.</td></tr>';
        console.error(error);
    }
}

// Admin: Update Status
async function updateStatus(id, newStatus) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            showToast(`Complaint updated to ${newStatus}`);
            fetchComplaints(); // Refresh table
        } else {
            throw new Error('Update failed');
        }
    } catch (error) {
        showToast('Failed to update status', 'error');
    }
}

// Admin: Delete Complaint
async function deleteComplaint(id) {
    if (!confirm('Are you sure you want to delete this complaint?')) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showToast('Complaint deleted');
            fetchComplaints(); // Refresh table
        } else {
            throw new Error('Delete failed');
        }
    } catch (error) {
        showToast('Failed to delete complaint', 'error');
    }
}
