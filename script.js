// 1. CONFIGURATION
const supabaseUrl = 'https://xuzfuxpmtmmbolarhkny.supabase.co';
const supabaseKey = 'sb_publishable_cL3ncQ27aZr6CGS64gDFwA_ZYzvXAcw';
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

let map, marker;

// 2. FREE MAP INITIALIZATION (Leaflet)
function initMap() {
    // Default Center: Delhi (Coordinates: 28.6139, 77.2090)
    const defaultPos = [28.6139, 77.2090];
    
    map = L.map('map').setView(defaultPos, 13);

    // Using OpenStreetMap Tiles (Free)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Initial Marker (Bus Icon)
    marker = L.marker(defaultPos).addTo(map);
}

// 3. MAIN TRACKING FUNCTION
async function trackBus() {
    const busInput = document.getElementById('bus-input');
    const busNum = busInput.value.trim().toUpperCase();
    
    if (!busNum) return alert("Bhai, bus number toh daal!");

    // UI Updates
    document.getElementById('dest-text').innerText = `Locating ${busNum}...`;
    document.getElementById('status-container').style.display = 'block';
    document.getElementById('map-container').style.display = 'block';

    // 1. Fetch Current Position
    const { data: busData, error } = await _supabase
        .from('bus_locations')
        .select('*')
        .eq('bus_number', busNum)
        .single();

    if (error || !busData) {
        alert("Bus nahi mili! Check if '" + busNum + "' exists in Supabase.");
        return;
    }

    // 2. Update UI and Map
    updateInterface(busData);
    
    // 3. Start Real-time Listener
    setupRealtime(busNum);
}

// 4. UPDATE UI & MAP MARKER
function updateInterface(data) {
    // Update Header
    document.getElementById('dest-text').innerHTML = `Tracking: <strong>${data.bus_number}</strong>`;
    document.getElementById('last-update').innerText = `Last Updated: ${new Date().toLocaleTimeString()}`;

    // Update Map Position (Leaflet fix: use [lat, lng] array)
    if (data.latitude && data.longitude) {
        const newPos = [parseFloat(data.latitude), parseFloat(data.longitude)];
        marker.setLatLng(newPos);
        map.panTo(newPos);
    }

    // Render the Timeline (ConfirmTkt Style)
    renderTimeline(data);
    
    // Fill the Station Dropdown
    populateDropdown();
}

// 5. RENDER TIMELINE (Dynamic Look)
function renderTimeline(data) {
    // Hackathon stops - Real-world mein ye DB se aayenge
    const stops = [
        { name: 'Kashmere Gate, Delhi', arr: '--', dep: '09:00 AM', status: 'completed' },
        { name: 'Karnal Bypass', arr: '11:15 AM', dep: '11:30 AM', status: 'active' },
        { name: 'Ambala Cantt', arr: '02:45 PM', dep: '03:00 PM', status: 'pending' },
        { name: 'Chandigarh ISBT', arr: '04:30 PM', dep: '--', status: 'pending' }
    ];

    const timelineBody = document.getElementById('timeline-body');
    timelineBody.innerHTML = ''; 

    stops.forEach(stop => {
        const row = document.createElement('div');
        row.className = `timeline-row ${stop.status}`;
        
        row.innerHTML = `
            <div class="station-cell">
                ${stop.status === 'completed' ? '<span class="check-icon">✔</span>' : 
                  stop.status === 'active' ? '<div class="pulse-dot"></div>' : '<span class="dot"></span>'}
                <span>${stop.name}</span>
            </div>
            <span>${stop.arr}</span>
            <span>${stop.dep}</span>
            <span class="${stop.status === 'active' ? 'delay-text' : ''}">${stop.status === 'active' ? (data.status || 'On Time') : ''}</span>
        `;
        timelineBody.appendChild(row);
    });

    if (window.lucide) lucide.createIcons();
}

// 6. POPULATE DROPDOWN
function populateDropdown() {
    const select = document.getElementById('station-select');
    const stations = ["Kashmere Gate, Delhi", "Karnal", "Ambala", "Chandigarh"];
    
    // Fill only if empty
    if (select.options.length <= 1) { 
        stations.forEach(city => {
            let opt = document.createElement('option');
            opt.value = city.toLowerCase();
            opt.innerHTML = city;
            select.appendChild(opt);
        });
    }
}

// 7. REAL-TIME LISTENER (Magic happens here)
function setupRealtime(busNum) {
    // Purane connections saaf karo
    _supabase.removeAllChannels();

    _supabase
        .channel('bus-live')
        .on('postgres_changes', 
            { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'bus_locations', 
                filter: `bus_number=eq.${busNum}` 
            }, 
            (payload) => {
                console.log('Real-time Move:', payload.new);
                updateInterface(payload.new);
            }
        )
        .subscribe((status) => {
            if(status === 'SUBSCRIBED') console.log("Listening for live bus movement...");
        });
}

// Map Load on Start
document.addEventListener('DOMContentLoaded', initMap);