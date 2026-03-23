const { createClient } = require('@supabase/supabase-js');


const supabaseUrl = 'https://xuzfuxpmtmmbolarhkny.supabase.co';
const supabaseKey = 'sb_publishable_cL3ncQ27aZr6CGS64gDFwA_ZYzvXAcw';
const supabase = createClient(supabaseUrl, supabaseKey);

let lat = 28.6139; 
let lng = 77.2090;

console.log("Bus Simulator Started! 🚌...");

setInterval(async () => {
    lat += 0.0010; 
    lng += 0.0015;

    const { error } = await supabase
        .from('bus_locations')
        .update({ latitude: lat, longitude: lng, last_updated: new Date() })
        .eq('bus_number', 'PB-01-1234');

    if (error) console.log("Error:", error);
    else console.log(`Bus Moved to: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
}, 3000);