const API_URL = 'https://mezmurtege.onrender.com';
let authToken = localStorage.getItem('auth_token');
let currentTab = 'mezmurs';

function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
    };
}

// Login
document.getElementById('loginBtn').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');

    try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (data.success && data.token) {
            authToken = data.token;
            localStorage.setItem('auth_token', authToken);
            document.getElementById('loginSection').classList.add('hidden');
            document.getElementById('mainContent').classList.remove('hidden');
            document.getElementById('sidebar').classList.remove('hidden');
            errorDiv.classList.add('hidden');
            loadContent();
        } else {
            errorDiv.textContent = data.error || 'Login failed';
            errorDiv.classList.remove('hidden');
        }
    } catch (error) {
        errorDiv.textContent = 'Connection failed: ' + error.message;
        errorDiv.classList.remove('hidden');
    }
});

function logout() {
    authToken = null;
    localStorage.removeItem('auth_token');
    document.getElementById('loginSection').classList.remove('hidden');
    document.getElementById('mainContent').classList.add('hidden');
    document.getElementById('sidebar').classList.add('hidden');
}

function showTab(tabName) {
    currentTab = tabName;
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(`${tabName}Tab`).classList.remove('hidden');
    
    // Update page title and button
    const titles = {
        'mezmurs': { title: 'Mezmur Management', subtitle: 'Manage all the mezmurs in the Tselot Tunes app.', btn: 'Add Mezmur' },
        'wallpapers': { title: 'Wallpaper Management', subtitle: 'Manage all the wallpapers in the Tselot Tunes app.', btn: 'Add Wallpaper' },
        'ringtones': { title: 'Ringtone Management', subtitle: 'Manage all the ringtones in the Tselot Tunes app.', btn: 'Add Ringtone' },
        'stats': { title: 'Statistics', subtitle: 'View app statistics and analytics.', btn: '' }
    };
    const info = titles[tabName] || titles['mezmurs'];
    document.getElementById('pageTitle').textContent = info.title;
    document.getElementById('pageSubtitle').textContent = info.subtitle;
    const btn = document.getElementById('addItemBtn');
    const btnText = btn.querySelector('span:last-child');
    if (info.btn) {
        btnText.textContent = info.btn;
        btn.classList.remove('hidden');
    } else {
        btn.classList.add('hidden');
    }
    
    loadContent();
}

async function loadContent() {
    if (currentTab === 'mezmurs') await loadMezmurs();
    else if (currentTab === 'wallpapers') await loadWallpapers();
    else if (currentTab === 'ringtones') await loadRingtones();
    else if (currentTab === 'stats') await loadStats();
}

async function loadMezmurs() {
    const tbody = document.getElementById('mezmursList');
    tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center text-white/60">Loading...</td></tr>';
    try {
        const response = await fetch(`${API_URL}/api/mezmurs`, { headers: getHeaders() });
        const data = await response.json();
        if (data.success && data.data) {
            tbody.innerHTML = data.data.map(m => `
                <tr class="border-t border-white/10">
                    <td class="h-[72px] px-4 py-2"><div class="bg-center bg-cover rounded-lg w-10 h-10" style="background-image:url('${m.imageUrl||'https://via.placeholder.com/40'}')"></div></td>
                    <td class="h-[72px] px-4 py-2 text-white text-sm">${m.title||'N/A'}</td>
                    <td class="h-[72px] px-4 py-2 text-white/60 text-sm">${m.artist||'Unknown'}</td>
                    <td class="h-[72px] px-4 py-2"><div class="inline-flex rounded-full py-1 px-3 bg-primary/20 text-primary text-xs font-medium">${m.category||'All'}</div></td>
                    <td class="h-[72px] px-4 py-2 text-white/60 text-sm">${(m.plays||0).toLocaleString()}</td>
                    <td class="h-[72px] px-4 py-2"><button class="delete-mezmur-btn text-red-400 hover:text-red-300 cursor-pointer" data-id="${m._id}"><span class="material-symbols-outlined">delete</span></button></td>
                </tr>
            `).join('');
            document.querySelectorAll('.delete-mezmur-btn').forEach(btn => {
                btn.addEventListener('click', () => deleteMezmur(btn.dataset.id));
            });
        }
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center text-red-400">Error loading mezmurs</td></tr>';
    }
}

async function loadWallpapers() {
    const container = document.getElementById('wallpapersList');
    container.innerHTML = '<div class="text-center text-white/60 py-8">Loading...</div>';
    try {
        const response = await fetch(`${API_URL}/api/wallpapers`, { headers: getHeaders() });
        const data = await response.json();
        if (data.success && data.data) {
            container.innerHTML = data.data.map(w => `
                <div class="bg-[#2b281c] rounded-lg border border-white/20 overflow-hidden">
                    <div class="aspect-square bg-cover bg-center" style="background-image:url('${w.imageUrl||'https://via.placeholder.com/300'}')"></div>
                    <div class="p-4">
                        <h3 class="text-white font-medium mb-1">${w.title||'N/A'}</h3>
                        <p class="text-white/60 text-sm mb-2">${w.category||'Icons'}</p>
                        <button class="delete-wallpaper-btn text-red-400 hover:text-red-300 text-sm cursor-pointer" data-id="${w._id}">Delete</button>
                    </div>
                </div>
            `).join('');
            document.querySelectorAll('.delete-wallpaper-btn').forEach(btn => {
                btn.addEventListener('click', () => deleteWallpaper(btn.dataset.id));
            });
        }
    } catch (e) {
        container.innerHTML = '<div class="text-center text-red-400 py-8">Error loading wallpapers</div>';
    }
}

async function loadRingtones() {
    const tbody = document.getElementById('ringtonesList');
    tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center text-white/60">Loading...</td></tr>';
    try {
        const response = await fetch(`${API_URL}/api/ringtones`, { headers: getHeaders() });
        const data = await response.json();
        if (data.success && data.data) {
            tbody.innerHTML = data.data.map(r => `
                <tr class="border-t border-white/10">
                    <td class="h-[72px] px-4 py-2"><div class="bg-cover rounded-lg w-10 h-10" style="background-image:url('${r.thumbnailUrl||'https://via.placeholder.com/40'}')"></div></td>
                    <td class="h-[72px] px-4 py-2 text-white text-sm">${r.title||'N/A'}</td>
                    <td class="h-[72px] px-4 py-2 text-white/60 text-sm">${r.artist||'Unknown'}</td>
                    <td class="h-[72px] px-4 py-2"><div class="inline-flex rounded-full py-1 px-3 bg-primary/20 text-primary text-xs font-medium">${r.category||'All'}</div></td>
                    <td class="h-[72px] px-4 py-2 text-white/60 text-sm">${(r.downloads||0).toLocaleString()}</td>
                    <td class="h-[72px] px-4 py-2"><button class="delete-ringtone-btn text-red-400 hover:text-red-300 cursor-pointer" data-id="${r._id}"><span class="material-symbols-outlined">delete</span></button></td>
                </tr>
            `).join('');
            document.querySelectorAll('.delete-ringtone-btn').forEach(btn => {
                btn.addEventListener('click', () => deleteRingtone(btn.dataset.id));
            });
        }
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center text-red-400">Error loading ringtones</td></tr>';
    }
}

async function loadStats() {
    document.getElementById('statsContent').innerHTML = 'Loading...';
}

function showAddMezmurForm() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-[#2b281c] border border-white/20 rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-white text-xl font-bold">Add New Mezmur</h3>
                <button id="closeModal" class="text-white/60 hover:text-white cursor-pointer">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            <form id="mezmurForm" class="space-y-4">
                <div>
                    <label class="block text-white/80 text-sm font-medium mb-2">Title *</label>
                    <input type="text" id="formTitle" required class="w-full px-4 py-2 bg-[#201d13] border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary" placeholder="Mezmur Title">
                </div>
                <div>
                    <label class="block text-white/80 text-sm font-medium mb-2">Artist *</label>
                    <input type="text" id="formArtist" required class="w-full px-4 py-2 bg-[#201d13] border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary" placeholder="Artist Name">
                </div>
                <div>
                    <label class="block text-white/80 text-sm font-medium mb-2">Category</label>
                    <select id="formCategory" class="w-full px-4 py-2 bg-[#201d13] border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary">
                        <option value="All">All</option>
                        <option value="Kidase">Kidase</option>
                        <option value="Holiday">Holiday</option>
                        <option value="Sunday">Sunday</option>
                        <option value="Saints">Saints</option>
                        <option value="Fasting">Fasting</option>
                    </select>
                </div>
                <div>
                    <label class="block text-white/80 text-sm font-medium mb-2">Image (File or URL)</label>
                    <input type="file" id="formImageFile" accept="image/*" class="w-full px-4 py-2 bg-[#201d13] border border-white/10 rounded-lg text-white text-sm mb-2">
                    <input type="text" id="formImageUrl" class="w-full px-4 py-2 bg-[#201d13] border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary" placeholder="Or paste image URL here">
                </div>
                <div>
                    <label class="block text-white/80 text-sm font-medium mb-2">Audio (File or URL) *</label>
                    <input type="file" id="formAudioFile" accept="audio/*" class="w-full px-4 py-2 bg-[#201d13] border border-white/10 rounded-lg text-white text-sm mb-2">
                    <input type="text" id="formAudioUrl" class="w-full px-4 py-2 bg-[#201d13] border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary" placeholder="Or paste audio URL here">
                </div>
                <div>
                    <label class="block text-white/80 text-sm font-medium mb-2">Duration</label>
                    <input type="text" id="formDuration" class="w-full px-4 py-2 bg-[#201d13] border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary" placeholder="e.g., 5:32">
                </div>
                <div>
                    <label class="block text-white/80 text-sm font-medium mb-2">Lyrics (optional)</label>
                    <textarea id="formLyrics" rows="3" class="w-full px-4 py-2 bg-[#201d13] border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary" placeholder="Mezmur lyrics..."></textarea>
                </div>
                <div class="flex gap-3">
                    <button type="submit" class="flex-1 py-2 px-4 rounded-lg font-bold cursor-pointer bg-primary text-[#201d13] hover:bg-yellow-500 transition-colors">Add Mezmur</button>
                    <button type="button" id="cancelBtn" class="px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-colors">Cancel</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('closeModal').addEventListener('click', () => modal.remove());
    document.getElementById('cancelBtn').addEventListener('click', () => modal.remove());
    document.getElementById('mezmurForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await addMezmurWithForm(modal);
    });
}

async function addMezmurWithForm(modal) {
    const title = document.getElementById('formTitle').value.trim();
    const artist = document.getElementById('formArtist').value.trim();
    const category = document.getElementById('formCategory').value;
    const duration = document.getElementById('formDuration').value.trim();
    const lyrics = document.getElementById('formLyrics').value.trim();
    
    const imageFileInput = document.getElementById('formImageFile');
    const imageUrlInput = document.getElementById('formImageUrl');
    const audioFileInput = document.getElementById('formAudioFile');
    const audioUrlInput = document.getElementById('formAudioUrl');
    
    const imageFile = imageFileInput ? imageFileInput.files[0] : null;
    const imageUrl = imageUrlInput ? imageUrlInput.value.trim() : '';
    const audioFile = audioFileInput ? audioFileInput.files[0] : null;
    const audioUrl = audioUrlInput ? audioUrlInput.value.trim() : '';

    if (!title) {
        alert('Please fill in title');
        return;
    }

    if (!artist) {
        alert('Please fill in artist');
        return;
    }

    if (!audioFile && !audioUrl) {
        alert('Please provide an audio file or URL');
        return;
    }

    try {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('artist', artist);
        formData.append('category', category);
        if (duration) formData.append('duration', duration);
        if (lyrics) formData.append('lyrics', lyrics);
        
        if (imageFile) {
            formData.append('image', imageFile);
        }
        if (imageUrl) {
            formData.append('imageUrl', imageUrl);
        }
        if (audioFile) {
            formData.append('audio', audioFile);
        }
        if (audioUrl) {
            formData.append('audioUrl', audioUrl);
        }

        const headers = getHeaders();
        delete headers['Content-Type']; // Let browser set it for FormData

        const r = await fetch(`${API_URL}/api/mezmurs`, {
            method: 'POST',
            headers: {
                'Authorization': headers['Authorization']
            },
            body: formData
        });

        const res = await r.json();
        if (res.success) {
            alert('✅ Mezmur added successfully!');
            modal.remove();
            loadMezmurs();
        } else {
            let errorMsg = res.error || 'Unknown error';
            if (res.debug) {
                errorMsg += '\n\nDebug info:\n' + JSON.stringify(res.debug, null, 2);
                console.error('Backend debug info:', res.debug);
            }
            alert('❌ Error: ' + errorMsg);
        }
    } catch (e) {
        console.error('Upload error:', e);
        alert('❌ Error: ' + e.message);
    }
}

function showAddWallpaperForm() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-[#2b281c] border border-white/20 rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-white text-xl font-bold">Add New Wallpaper</h3>
                <button id="closeModal" class="text-white/60 hover:text-white cursor-pointer">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            <form id="wallpaperForm" class="space-y-4">
                <div>
                    <label class="block text-white/80 text-sm font-medium mb-2">Title *</label>
                    <input type="text" id="formTitle" required class="w-full px-4 py-2 bg-[#201d13] border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary" placeholder="Wallpaper Title">
                </div>
                <div>
                    <label class="block text-white/80 text-sm font-medium mb-2">Category</label>
                    <select id="formCategory" class="w-full px-4 py-2 bg-[#201d13] border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary">
                        <option value="Icons">Icons</option>
                        <option value="Saints">Saints</option>
                        <option value="Churches">Churches</option>
                        <option value="Nature">Nature</option>
                        <option value="Cross">Cross</option>
                        <option value="Holy Trinity">Holy Trinity</option>
                    </select>
                </div>
                <div>
                    <label class="block text-white/80 text-sm font-medium mb-2">Image (File or URL) *</label>
                    <input type="file" id="formImageFile" accept="image/*" class="w-full px-4 py-2 bg-[#201d13] border border-white/10 rounded-lg text-white text-sm mb-2">
                    <input type="text" id="formImageUrl" class="w-full px-4 py-2 bg-[#201d13] border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary" placeholder="Or paste image URL here">
                </div>
                <div>
                    <label class="block text-white/80 text-sm font-medium mb-2">Tags (comma separated)</label>
                    <input type="text" id="formTags" class="w-full px-4 py-2 bg-[#201d13] border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary" placeholder="tag1, tag2, tag3">
                </div>
                <div class="flex gap-3">
                    <button type="submit" class="flex-1 py-2 px-4 rounded-lg font-bold cursor-pointer bg-primary text-[#201d13] hover:bg-yellow-500 transition-colors">Add Wallpaper</button>
                    <button type="button" id="cancelBtn" class="px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-colors">Cancel</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('closeModal').addEventListener('click', () => modal.remove());
    document.getElementById('cancelBtn').addEventListener('click', () => modal.remove());
    document.getElementById('wallpaperForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await addWallpaperWithForm(modal);
    });
}

async function addWallpaperWithForm(modal) {
    const title = document.getElementById('formTitle').value.trim();
    const category = document.getElementById('formCategory').value;
    const tags = document.getElementById('formTags').value.trim();
    const imageFileInput = document.getElementById('formImageFile');
    const imageUrlInput = document.getElementById('formImageUrl');
    const imageFile = imageFileInput ? imageFileInput.files[0] : null;
    const imageUrl = imageUrlInput ? imageUrlInput.value.trim() : '';

    if (!title) {
        alert('Please fill in title');
        return;
    }

    if (!imageFile && !imageUrl) {
        alert('Please provide an image file or URL');
        return;
    }
    
    console.log('Wallpaper form data:', {
        title,
        category,
        tags,
        hasFile: !!imageFile,
        fileName: imageFile ? imageFile.name : null,
        imageUrl: imageUrl || '(empty)'
    });

    try {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('category', category);
        if (tags) formData.append('tags', tags);
        if (imageFile) {
            formData.append('image', imageFile);
        }
        if (imageUrl) {
            formData.append('imageUrl', imageUrl);
        }

        const headers = getHeaders();
        delete headers['Content-Type']; // Let browser set it for FormData

        const r = await fetch(`${API_URL}/api/wallpapers`, {
            method: 'POST',
            headers: {
                'Authorization': headers['Authorization']
            },
            body: formData
        });

        const res = await r.json();
        if (res.success) {
            alert('✅ Wallpaper added successfully!');
            modal.remove();
            loadWallpapers();
        } else {
            let errorMsg = res.error || 'Unknown error';
            if (res.debug) {
                errorMsg += '\n\nDebug info:\n' + JSON.stringify(res.debug, null, 2);
                console.error('Backend debug info:', res.debug);
            }
            alert('❌ Error: ' + errorMsg);
        }
    } catch (e) {
        console.error('Upload error:', e);
        alert('❌ Error: ' + e.message);
    }
}

async function deleteWallpaper(id) {
    if (!confirm('Are you sure you want to delete this wallpaper?')) return;
    try {
        const response = await fetch(`${API_URL}/api/wallpapers/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        const data = await response.json();
        if (data.success) {
            loadWallpapers();
        } else {
            alert('Error: ' + (data.error || 'Failed to delete'));
        }
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

async function deleteMezmur(id) {
    if (!confirm('Are you sure you want to delete this mezmur?')) return;
    try {
        const response = await fetch(`${API_URL}/api/mezmurs/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        const data = await response.json();
        if (data.success) {
            loadMezmurs();
        } else {
            alert('Error: ' + (data.error || 'Failed to delete'));
        }
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

async function deleteRingtone(id) {
    if (!confirm('Are you sure you want to delete this ringtone?')) return;
    try {
        const response = await fetch(`${API_URL}/api/ringtones/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        const data = await response.json();
        if (data.success) {
            loadRingtones();
        } else {
            alert('Error: ' + (data.error || 'Failed to delete'));
        }
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('nav-mezmurs').addEventListener('click', () => showTab('mezmurs'));
    document.getElementById('nav-wallpapers').addEventListener('click', () => showTab('wallpapers'));
    document.getElementById('nav-ringtones').addEventListener('click', () => showTab('ringtones'));
    document.getElementById('nav-stats').addEventListener('click', () => showTab('stats'));
    document.getElementById('sidebarLogoutBtn').addEventListener('click', logout);
    document.getElementById('addItemBtn').addEventListener('click', () => {
        if (currentTab === 'mezmurs') showAddMezmurForm();
        else if (currentTab === 'wallpapers') showAddWallpaperForm();
        else if (currentTab === 'ringtones') showAddRingtoneForm();
    });
    if (authToken) {
        document.getElementById('loginSection').classList.add('hidden');
        document.getElementById('mainContent').classList.remove('hidden');
        document.getElementById('sidebar').classList.remove('hidden');
        loadContent();
    }
});


