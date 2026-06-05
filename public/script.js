const API_URL = '/complaints';

// --- Shared Utilities ---
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    const icon = type === 'success' ? '✓' : '⚠';
    const color = type === 'success' ? 'var(--success)' : 'var(--danger)';

    toast.innerHTML = `
        <span style="color: ${color}; font-weight: bold; font-size: 1.2rem;">${icon}</span>
        <span>${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) reverse forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- Client-Side Local NLP Engine ---
const CATEGORY_KEYWORDS = {
    Technical: ['bug', 'error', 'crash', 'fail', 'broken', 'issue', 'not working', 'slow', 'loading', 'freeze', 'page', 'site', 'website', 'app', 'application', 'server', 'down', 'connection', 'internet', 'network', 'login', 'access', 'load', 'ui', 'button'],
    Billing: ['refund', 'charge', 'money', 'billing', 'invoice', 'pay', 'payment', 'subscription', 'price', 'cost', 'fee', 'charged', 'card', 'bank', 'credit', 'transaction', 'receipt', 'double'],
    Account: ['password', 'account', 'signin', 'sign-in', 'register', 'signup', 'sign-up', 'email', 'profile', 'username', 'hacked', 'security', 'leak', 'auth', 'verification', 'credentials', 'otp'],
    Feedback: ['suggest', 'improve', 'feature', 'idea', 'like', 'dislike', 'feedback', 'opinion', 'recommend', 'good', 'bad', 'great', 'terrible', 'awesome', 'suggestion']
};

const URGENCY_KEYWORDS = {
    high: ['urgent', 'emergency', 'asap', 'immediately', 'broken', 'hacked', 'leak', 'security', 'critical', 'down', 'crash', 'payment', 'charge', 'money', 'stolen', 'cannot login', 'blocked', 'exploit', 'compromised'],
    medium: ['error', 'slow', 'fail', 'issue', 'refund', 'subscription', 'invoice', 'reset', 'password', 'bug', 'not working']
};

function runClientSideNLP(text) {
    const cleanText = text.toLowerCase();
    
    // 1. Predict Category
    let bestCategory = 'General';
    let maxScore = 0;
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        let score = 0;
        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            const matches = cleanText.match(regex);
            if (matches) score += matches.length;
        });
        if (score > maxScore) {
            maxScore = score;
            bestCategory = category;
        }
    }

    // 2. Predict Priority & Urgency Score
    let priority = 'Low';
    let urgencyScore = 0.1;
    let highMatches = 0;
    let mediumMatches = 0;

    URGENCY_KEYWORDS.high.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = cleanText.match(regex);
        if (matches) highMatches += matches.length;
    });

    URGENCY_KEYWORDS.medium.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = cleanText.match(regex);
        if (matches) mediumMatches += matches.length;
    });

    if (highMatches > 0) {
        priority = 'High';
        urgencyScore = 0.8 + (highMatches * 0.05);
    } else if (mediumMatches > 0) {
        priority = 'Medium';
        urgencyScore = 0.5 + (mediumMatches * 0.05);
    } else {
        priority = 'Low';
        urgencyScore = 0.2 + (cleanText.length * 0.001);
    }
    urgencyScore = Math.min(1.0, urgencyScore);

    return {
        category: bestCategory,
        priority: priority,
        urgencyScore: urgencyScore
    };
}

// Attach Live Typist Event Listener for AI Preview
const complaintTextarea = document.getElementById('text');
if (complaintTextarea) {
    complaintTextarea.addEventListener('input', (e) => {
        const text = e.target.value.trim();
        const aiBox = document.getElementById('aiAssistBox');
        if (text.length > 5) {
            aiBox.style.display = 'block';
            const prediction = runClientSideNLP(text);
            document.getElementById('aiCategory').innerText = prediction.category;
            document.getElementById('aiPriority').innerText = prediction.priority;
            
            // Style predictions
            document.getElementById('aiCategory').className = `badge priority-${prediction.priority.toLowerCase()}`;
            document.getElementById('aiPriority').className = `badge priority-${prediction.priority.toLowerCase()}`;
            
            // Update urgency filling bar
            document.getElementById('aiUrgencyBar').style.width = `${prediction.urgencyScore * 100}%`;
        } else {
            aiBox.style.display = 'none';
        }
    });
}

// --- Tabs Management ---
const tabSubmit = document.getElementById('tabSubmit');
const tabTrack = document.getElementById('tabTrack');
const panelSubmit = document.getElementById('panelSubmit');
const panelTrack = document.getElementById('panelTrack');

if (tabSubmit && tabTrack) {
    tabSubmit.addEventListener('click', () => {
        tabSubmit.classList.add('active');
        tabTrack.classList.remove('active');
        panelSubmit.style.display = 'block';
        panelTrack.style.display = 'none';
    });
    tabTrack.addEventListener('click', () => {
        tabTrack.classList.add('active');
        tabSubmit.classList.remove('active');
        panelTrack.style.display = 'block';
        panelSubmit.style.display = 'none';
    });
}

// --- User: Submit Complaint ---
const complaintForm = document.getElementById('complaintForm');
if (complaintForm) {
    complaintForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = document.getElementById('submitBtn');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = 'Analyzing & Submitting...';
        submitBtn.disabled = true;

        const categoryVal = document.getElementById('category').value;
        const priorityVal = document.getElementById('priority').value;

        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            text: document.getElementById('text').value,
            category: categoryVal || null,
            priority: priorityVal || null
        };

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const newComplaint = await response.json();
                complaintForm.reset();
                document.getElementById('aiAssistBox').style.display = 'none';
                
                // Show modal with tracking info
                document.getElementById('modalComplaintId').innerText = `#${newComplaint.id}`;
                document.getElementById('successModal').style.display = 'flex';
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

function closeSuccessModal() {
    document.getElementById('successModal').style.display = 'none';
}

// --- User: Track Status ---
const trackBtn = document.getElementById('trackBtn');
if (trackBtn) {
    trackBtn.addEventListener('click', async () => {
        const inputVal = document.getElementById('trackSearchInput').value.trim();
        const resultsDiv = document.getElementById('trackResults');
        const errorDiv = document.getElementById('trackError');
        
        if (!inputVal) {
            showToast('Please enter an ID or email address.', 'error');
            return;
        }

        resultsDiv.style.display = 'none';
        errorDiv.style.display = 'none';

        try {
            const response = await fetch(`${API_URL}/${inputVal}`);
            if (response.ok) {
                const complaint = await response.json();
                
                document.getElementById('trackId').innerText = `ID: #${complaint.id}`;
                document.getElementById('trackStatus').innerText = complaint.status;
                document.getElementById('trackStatus').className = `status-badge status-${complaint.status.toLowerCase()}`;
                
                document.getElementById('trackCategory').innerText = complaint.category;
                document.getElementById('trackPriority').innerText = complaint.priority;
                document.getElementById('trackPriority').className = `status-badge priority-${complaint.priority.toLowerCase()}`;
                document.getElementById('trackText').innerText = complaint.text;

                const responseSec = document.getElementById('trackResponseSection');
                if (complaint.adminResponse) {
                    responseSec.style.display = 'block';
                    document.getElementById('trackResponse').innerText = complaint.adminResponse;
                } else {
                    responseSec.style.display = 'none';
                }

                resultsDiv.style.display = 'block';
            } else {
                errorDiv.style.display = 'block';
            }
        } catch (err) {
            errorDiv.style.display = 'block';
            console.error(err);
        }
    });
}

// --- Admin Portal Logic ---
let selectedComplaintId = null;
let currentComplaintsList = [];

// AI Templates based on complaint categories
const AI_RESPONSE_TEMPLATES = {
    Billing: "We have reviewed your billing issue. A refund has been approved/initiated and should post within 3-5 business days. We apologize for the inconvenience.",
    Technical: "Our engineering team has been dispatched to investigate this technical bug. We will deploy a hotfix shortly. Thank you for your patience.",
    Account: "Your account verification has been triggered. Please check your email inbox to reset your password or verify your credentials securely.",
    Feedback: "Thank you for your valuable feedback! We have shared this with our product management team for our upcoming roadmap iterations.",
    General: "We have received your request and assigned a support representative to look into it. We will update you as soon as possible."
};

async function fetchComplaints() {
    const tableBody = document.getElementById('complaintsTableBody');
    if (!tableBody) return;

    // Filters values
    const search = document.getElementById('searchFilter').value;
    const category = document.getElementById('categoryFilter').value;
    const priority = document.getElementById('priorityFilter').value;
    const status = document.getElementById('statusFilter').value;
    const sort = document.getElementById('sortOrder').value;

    const queryParams = new URLSearchParams();
    if (search) queryParams.append('search', search);
    if (category) queryParams.append('category', category);
    if (priority) queryParams.append('priority', priority);
    if (status) queryParams.append('status', status);

    try {
        const response = await fetch(`${API_URL}?${queryParams.toString()}`);
        let complaints = await response.json();
        currentComplaintsList = [...complaints];

        // Perform Custom Sorting
        if (sort === 'urgency') {
            complaints.sort((a, b) => (b.urgencyScore || 0) - (a.urgencyScore || 0));
        } else if (sort === 'id-desc') {
            complaints.sort((a, b) => b.id - a.id);
        } else if (sort === 'id-asc') {
            complaints.sort((a, b) => a.id - b.id);
        } else if (sort === 'status') {
            complaints.sort((a, b) => a.status.localeCompare(b.status));
        }

        // Render Table Body
        tableBody.innerHTML = '';
        if (complaints.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #94a3b8; padding: 2rem;">No matching complaints found.</td></tr>';
            return;
        }

        complaints.forEach(complaint => {
            const row = document.createElement('tr');
            row.onclick = () => openDetailModal(complaint.id);
            row.innerHTML = `
                <td>#${complaint.id}</td>
                <td>
                    <div style="font-weight: 600;">${complaint.name}</div>
                    <div style="font-size: 0.8rem; color: #94a3b8;">${complaint.email}</div>
                </td>
                <td>${complaint.category || 'General'}</td>
                <td>
                    <span class="status-badge priority-${(complaint.priority || 'Low').toLowerCase()}">${complaint.priority || 'Low'}</span>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="font-weight:700; color: #38bdf8;">${complaint.urgencyScore || 0.1}</span>
                        <div class="progress-bar-bg" style="width: 50px; margin: 0; height: 5px;">
                            <div class="progress-bar-fill" style="width: ${(complaint.urgencyScore || 0.1) * 100}%;"></div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="status-badge status-${complaint.status.toLowerCase()}">${complaint.status}</span>
                </td>
                <td style="text-align: center;" onclick="event.stopPropagation();">
                    <div style="display: flex; gap: 0.5rem; justify-content: center;">
                        <button class="action-btn" onclick="updateStatusDirect(${complaint.id}, 'Resolved')" title="Resolve">✓</button>
                        <button class="action-btn delete" onclick="deleteComplaint(${complaint.id})" title="Delete">🗑</button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });

        // Compute dashboard statistics counters
        updateStatsCounters();

    } catch (error) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--danger);">Error loading complaints database.</td></tr>';
        console.error(error);
    }
}

// Compute metrics
async function updateStatsCounters() {
    try {
        // Fetch all complaints directly to calculate stats accurately
        const res = await fetch(API_URL);
        const all = await res.json();
        
        let total = all.length;
        let pending = all.filter(c => c.status === 'Pending').length;
        let resolved = all.filter(c => c.status === 'Resolved').length;
        let rejected = all.filter(c => c.status === 'Rejected').length;

        document.getElementById('statTotal').innerText = total;
        document.getElementById('statPending').innerText = pending;
        document.getElementById('statResolved').innerText = resolved;
        document.getElementById('statRejected').innerText = rejected;
    } catch (err) {
        console.error(err);
    }
}

// Open detailed interactive modal
function openDetailModal(id) {
    const complaint = currentComplaintsList.find(c => c.id === id);
    if (!complaint) return;

    selectedComplaintId = id;
    
    document.getElementById('modalTitle').innerText = `Complaint #${complaint.id}`;
    document.getElementById('mUser').innerText = complaint.name;
    document.getElementById('mEmail').innerText = complaint.email;
    document.getElementById('mCategory').innerText = complaint.category || 'General';
    document.getElementById('mPriority').innerText = complaint.priority || 'Low';
    document.getElementById('mPriority').className = `status-badge priority-${(complaint.priority || 'Low').toLowerCase()}`;
    document.getElementById('mUrgency').innerText = complaint.urgencyScore || '0.1';
    document.getElementById('mStatus').innerText = complaint.status;
    document.getElementById('mStatus').className = `status-badge status-${complaint.status.toLowerCase()}`;
    document.getElementById('mText').innerText = complaint.text;
    document.getElementById('adminResponseInput').value = complaint.adminResponse || '';

    // Generate AI Resolution suggestion
    const category = complaint.category || 'General';
    const suggestion = AI_RESPONSE_TEMPLATES[category] || AI_RESPONSE_TEMPLATES.General;
    document.getElementById('aiSuggestionText').innerText = suggestion;

    document.getElementById('detailModal').style.display = 'flex';
}

function applyAiSuggestion() {
    const suggestion = document.getElementById('aiSuggestionText').innerText;
    document.getElementById('adminResponseInput').value = suggestion;
    showToast('AI suggestion applied to response.');
}

function closeDetailModal() {
    document.getElementById('detailModal').style.display = 'none';
    selectedComplaintId = null;
}

// Action submit from detailed modal (Resolve/Reject)
async function submitAction(newStatus) {
    if (!selectedComplaintId) return;
    const responseText = document.getElementById('adminResponseInput').value.trim();

    try {
        const response = await fetch(`${API_URL}/${selectedComplaintId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus, adminResponse: responseText })
        });

        if (response.ok) {
            showToast(`Complaint #${selectedComplaintId} marked as ${newStatus}`);
            closeDetailModal();
            fetchComplaints();
        } else {
            throw new Error('Update failed');
        }
    } catch (err) {
        showToast('Failed to update status', 'error');
    }
}

// Direct button actions from table row
async function updateStatusDirect(id, newStatus) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            showToast(`Complaint #${id} updated to ${newStatus}`);
            fetchComplaints();
        } else {
            throw new Error('Update failed');
        }
    } catch (error) {
        showToast('Failed to update status', 'error');
    }
}

// Admin: Delete Complaint
async function deleteComplaint(id) {
    if (!confirm(`Are you sure you want to permanently delete Complaint #${id}?`)) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showToast(`Complaint #${id} deleted`);
            fetchComplaints();
        } else {
            throw new Error('Delete failed');
        }
    } catch (error) {
        showToast('Failed to delete complaint', 'error');
    }
}

// Logout authentication helper
function adminLogout() {
    localStorage.removeItem('adminToken');
    window.location.href = 'login.html';
}
